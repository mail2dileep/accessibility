import express from 'express'
	import cors from 'cors'
	import exec from 'child_process'
	import path from 'path'
	import fs from 'fs'
	import { fileURLToPath } from 'url';

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	//const { exec } = require('child_process');
	const app = express();
	app.use(cors());
	app.use(express.json()); 
	app.use(express.static(path.join(__dirname)));
	const port = 3000;
	const folder1 = 'C:\\AXE-Automation-Latest';
		const subfolder = 'AXE-Automation';
		const filename = 'WebAccessibility_latest.js';
	const scriptPath=path.join(folder1,subfolder,filename);
	//console.log(scriptPath)

	//app.use(express.json());
	app.use(express.static('public'));

	  app.post('/run-script', (req, res) => {
		  
		  const urls = req.body.urls || [];
		  console.log(urls)
		  const csvContent = 'URL\n' + urls.join('\n');
          fs.writeFileSync('./TesturlUpdated.csv', csvContent);
		 // res.send('Hello from myapp root!');
		  exec.exec('node ./WebAccessibility_final.cjs', (error, stdout, stderr) => {
		if (error) {
		  console.error(`exec error: ${error}`);
		  return res.status(500).send(stderr);
		}
		console.log(`stdout: ${stdout}`);
		return res.status(200).send(stdout);
	  });
		});
		app.get('/generate-report', (req, res) => {
		  exec.exec('node ./PieChartSummary.cjs', (error, stdout, stderr) => {
		if (error) {
		  console.error(`exec error: ${error}`);
		  return res.status(500).send(stderr);	
		}
		console.log(`stdout: ${stdout}`);
		// Now send the generated file
		//res.sendFile(path.join(__dirname, 'chart-data.json'));
	  });
		});
		/*app.get('/slice-details', (req, res) => {
  const { chartTitle, label } = req.query;
  const results = [];
  fs.createReadStream(path.join(__dirname, 'output', 'outputresults.csv'))
    .pipe(csv())
    .on('data', (data) => {
      // Adjust filtering logic as needed for your chartTitle/label mapping
      // Example: filter by Violation Type or Violation description
      if (
        (chartTitle && data['Violation Type'] === chartTitle && data['Violation description'] === label) ||
        (label && data['Violation description'] === label)
      ) {
        results.push({
          URL: data.URL,
          Rule: data.Rule,
          'Violation description': data['Violation description'],
          'Violation Type': data['Violation Type'],
          Impact: data.Impact,
          Level: data.LEVEL
        });
      }
    })
    .on('end', () => {
      res.json({ details: results });
    });
});*/
	app.listen(port, () => console.log(`Server running on port ${port}`));