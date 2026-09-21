import express from 'express'
import cors from 'cors'
import childProcess from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import util from 'util';
import { generateSuggestionWithCache } from './aiSuggestions.js';
import { generateHTMLReportWithSuggestions, readIssuesFromCSV } from './reportGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, 'Output');
const resultsCsvPath = path.join(outputDir, 'test-results.csv');

// Environment quick-check at startup (do not print secrets)
console.info('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.info('NODE_EXTRA_CA_CERTS set:', !!process.env.NODE_EXTRA_CA_CERTS);
console.info('DISABLE_TLS_VERIFY:', process.env.DISABLE_TLS_VERIFY === 'true');

const execPromise = util.promisify(childProcess.exec);
const app = express();

// Use Render's PORT if provided
const port = process.env.PORT || 3002;

// Configure CORS origin via env var
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5174';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function getAccessibilityScanProcessConfig() {
  if (process.platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: ['-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'Invoke-AccessibilityScan.ps1')]
    };
  }

  return {
    command: process.execPath,
    args: [path.join(__dirname, 'WebAccessibility_final.cjs')]
  };
}

function runAccessibilityScan() {
  const { command, args } = getAccessibilityScanProcessConfig();
  return new Promise((resolve, reject) => {
    const scanProcess = childProcess.spawn(command, args, {
      cwd: __dirname,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stderr = '';

    scanProcess.stdout.on('data', data => {
      const message = data.toString().trimEnd();
      if (message) {
        console.log(`[scan] ${message}`);
      }
    });

    scanProcess.stderr.on('data', data => {
      const message = data.toString().trimEnd();
      if (message) {
        stderr += `${message}\n`;
        console.error(`[scan] ${message}`);
      }
    });

    scanProcess.on('error', reject);

    scanProcess.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `Accessibility scan exited with code ${code}`));
    });
  });
}

app.use(express.static('public'));

app.post('/run-script', async (req, res) => {
  const urls = req.body.urls || [];
  const csvContent = 'URL\n' + urls.join('\n');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'TesturlUpdated.csv'), csvContent);
  try {
    await runAccessibilityScan();
    return res.status(200).json({ message: "Accessibility Scan completed" });
  } catch (error) {
    console.error('Accessibility scan failed:', error);
    return res.status(500).send(error.message || String(error));
  }
});

app.post('/crawl-site', async (req, res) => {
  let urls = req.body.urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ message: "No URLs provided" });
  }
  urls = urls.filter(u => typeof u === 'string' && u.trim() !== '');
  if (urls.length === 0) {
    return res.status(400).json({ message: "No valid URLs provided" });
  }
  const urlArgs = urls.map(u => `"${u}"`).join(' ');
  const command = `node ./Crawler.cjs ${urlArgs}`;
  console.log('Server side command:', command);
  try {
    await execPromise(command);
    await runAccessibilityScan();
    return res.status(200).json({ message: "Accessibility Scan completed" });
  } catch (error) {
    console.error(`exec error: ${error}`);
    return res.status(500).send(error.message || String(error));
  }
});

app.get('/generate-report', (req, res) => {
  childProcess.exec('node ./csvjson.cjs', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(stderr);
    }
    // return the generated JSON file (chart-data.json)
    res.sendFile(path.join(__dirname, 'chart-data.json'));
  });
});

app.get('/slice-details', (req, res) => {
  const { chartTitle, label } = req.query;
  const results = [];
  setTimeout(() => {
    fs.createReadStream(resultsCsvPath)
      .pipe(csv())
      .on('data', (data) => {
        if (!label) {
          results.push({
            URL: data.URL,
            Rule: data.Rule,
            'Violation description': data['Violation description'],
            'Violation Type': data['Violation Type'],
            Impact: data.Impact,
            LEVEL: data.Level || data.LEVEL,
            'HTML Element': data['HTML Element'] || '',
            'DOM Element': data['DOM Element'] || '',
            Messages: data.Messages || ''
          });
        } else if (
          chartTitle &&
          label &&
          data[chartTitle] !== undefined &&
          String(data[chartTitle]).trim() === String(label).trim()
        ) {
          results.push({
            URL: data.URL,
            Rule: data.Rule,
            'Violation description': data['Violation description'],
            'Violation Type': data['Violation Type'],
            Impact: data.Impact,
            LEVEL: data.Level || data.LEVEL,
            'HTML Element': data['HTML Element'] || '',
            'DOM Element': data['DOM Element'] || '',
            Messages: data.Messages || ''
          });
        }
      })
      .on('end', () => {
        res.json({ details: results });
      });
  }, 1000);
});

app.post('/generate-suggestions', async (req, res) => {
  try {
    const { issues } = req.body;
    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({ error: 'No issues provided' });
    }
    const suggestionsPromises = issues.map(issue =>
      generateSuggestionWithCache(issue)
        .then(suggestion => ({ ...issue, 'AI Suggestion': suggestion }))
        .catch(error => ({ ...issue, 'AI Suggestion': `Error: ${error.message}` }))
    );
    const issuesWithSuggestions = await Promise.all(suggestionsPromises);
    res.json({ suggestions: issuesWithSuggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/generate-suggestion', async (req, res) => {
  try {
    const { issue } = req.body;
    if (!issue) {
      return res.status(400).json({ error: 'No issue provided' });
    }
    const suggestion = await generateSuggestionWithCache(issue);
    res.json({ suggestion });
  } catch (error) {
    console.error('Error generating suggestion:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/generate-report-with-suggestions', async (req, res) => {
  try {
    const csvPath = resultsCsvPath;
    if (!fs.existsSync(csvPath)) {
      return res.status(400).json({ error: 'No test results found. Run accessibility scan first.' });
    }
    const issues = await readIssuesFromCSV(csvPath);
    if (issues.length === 0) {
      return res.status(400).json({ error: 'No issues found in test results.' });
    }
    console.info(`Generating report with ${issues.length} issues...`);
    const issuesWithSuggestions = await Promise.all(
      issues.map(async (issue) => {
        try {
          const suggestion = await generateSuggestionWithCache(issue);
          return { ...issue, 'AI Suggestion': suggestion };
        } catch (error) {
          return { ...issue, 'AI Suggestion': `Error generating suggestion: ${error.message}` };
        }
      })
    );
    const htmlContent = generateHTMLReportWithSuggestions(issuesWithSuggestions);
    const reportPath = path.join(__dirname, 'accessibility-report-with-suggestions.html');
    fs.writeFileSync(reportPath, htmlContent);
    console.info(`Report saved to ${reportPath}`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="accessibility-report-with-suggestions.html"');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error generating report with suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve built frontend if present (optional single-repo usage)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    // keep API routes unaffected
    const apiPrefixes = ['/run-script', '/crawl-site', '/generate-report', '/slice-details', '/generate-suggestions', '/generate-suggestion', '/generate-report-with-suggestions'];
    if (apiPrefixes.some(p => req.path.startsWith(p))) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => console.log(`Server running on port ${port}`));