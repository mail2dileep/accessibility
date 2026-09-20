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

// Environment quick-check at startup (do not print secrets)
console.info('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.info('NODE_EXTRA_CA_CERTS set:', !!process.env.NODE_EXTRA_CA_CERTS);
console.info('DISABLE_TLS_VERIFY:', process.env.DISABLE_TLS_VERIFY === 'true');
  const execPromise = util.promisify(childProcess.exec);
	//const { exec } = require('child_process');
	const app = express();
	app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
	}));
	app.use(express.json()); 
	app.use(express.static(path.join(__dirname)));
	const port = 3002;
	const folder1 = 'C:\\AXE-Automation-Latest';
		const subfolder = 'AXE-Automation';
		const filename = 'WebAccessibility_latest.js';
	const scriptPath=path.join(folder1,subfolder,filename);
	//console.log(scriptPath)

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

	//app.use(express.json());
	app.use(express.static('public'));

    app.post('/run-script', async (req, res) => {
		  
		  const urls = req.body.urls || [];
		  console.log(urls)
		  const csvContent = 'URL\n' + urls.join('\n');
          fs.writeFileSync('./TesturlUpdated.csv', csvContent);
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
  // Filter out empty strings just in case
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
    return res.status(500).send(error.message || error);
  }
});


    app.get('/generate-report', (req, res) => {
      childProcess.exec('node ./csvjson.cjs', (error, stdout, stderr) => {
		if (error) {
		  console.error(`exec error: ${error}`);
		  return res.status(500).send(stderr);
		}
		console.log(`stdout: ${stdout}`);
		// Now send the generated file
		res.sendFile(path.join(__dirname, 'chart-data.json'));
	  });
		});
app.get('/slice-details', (req, res) => {
  // Use first parameter as column, second as value
  const { chartTitle, label } = req.query;
  const results = [];
    setTimeout(() => {
    fs.createReadStream(path.join(__dirname, 'output', 'test-results.csv'))
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
  }, 1000); // 100ms delay
});

// Endpoint to generate AI suggestions for issues
app.post('/generate-suggestions', async (req, res) => {
  try {
    const { issues } = req.body;
    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({ error: 'No issues provided' });
    }

    const suggestionsPromises = issues.map(issue => 
      generateSuggestionWithCache(issue)
        .then(suggestion => ({
          ...issue,
          'AI Suggestion': suggestion
        }))
        .catch(error => ({
          ...issue,
          'AI Suggestion': `Error: ${error.message}`
        }))
    );

    const issuesWithSuggestions = await Promise.all(suggestionsPromises);
    res.json({ suggestions: issuesWithSuggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to generate suggestion for a single issue
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

// Endpoint to generate HTML report with AI suggestions
app.get('/generate-report-with-suggestions', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, 'output', 'test-results.csv');
    
    // Check if CSV exists
    if (!fs.existsSync(csvPath)) {
      return res.status(400).json({ error: 'No test results found. Run accessibility scan first.' });
    }

    // Read issues from CSV
    const issues = await readIssuesFromCSV(csvPath);
    
    if (issues.length === 0) {
      return res.status(400).json({ error: 'No issues found in test results.' });
    }

    console.info(`Generating report with ${issues.length} issues...`);
    
    // Generate AI suggestions for all issues in parallel
    const issuesWithSuggestions = await Promise.all(
      issues.map(async (issue) => {
        try {
          const suggestion = await generateSuggestionWithCache(issue);
          return {
            ...issue,
            'AI Suggestion': suggestion
          };
        } catch (error) {
          return {
            ...issue,
            'AI Suggestion': `Error generating suggestion: ${error.message}`
          };
        }
      })
    );

    // Generate HTML
    const htmlContent = generateHTMLReportWithSuggestions(issuesWithSuggestions);
    
    // Save to file
    const reportPath = path.join(__dirname, 'accessibility-report-with-suggestions.html');
    fs.writeFileSync(reportPath, htmlContent);
    
    console.info(`Report saved to ${reportPath}`);
    
    // Send the HTML file
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="accessibility-report-with-suggestions.html"');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error generating report with suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

	app.listen(port, () => console.log(`Server running on port ${port}`));