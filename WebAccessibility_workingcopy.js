		var AxeBuilder = require('@axe-core/webdriverjs'),
			AxeReports = require('axe-reports'),
			webdriver = require('selenium-webdriver'),
			By = webdriver.By,
			until = webdriver.until;


		var driver = new webdriver.Builder()
			.forBrowser('chrome') //or firefox or whichever driver you use
			.build();
			
		var AXE_BUILDER = new AxeBuilder(driver);
			// specify your test criteria (see aXe documentation for more info)
	 

		var pathConfig = {};
		var csvjson = require('csvjson');
		var fs = require('fs');
		var options = {
			delimiter : ',' , // optional
			quote     : '"' // optional
		};
		var file_data = fs.readFileSync('./TestData/TesturlUpdated.csv', { encoding : 'utf8'});
		pathConfig.array = csvjson.toObject(file_data, options);
		const { parse } = require('csv-parse');
		const outputFile = 'all_column_summaries.csv';
		const outputHtml = 'summary_tabular_donutcharts_hyperlinks.html';

		console.log(pathConfig.array);
		 //Converted json object from csv data
		module.exports = pathConfig;

		//const fs1 = require('fs')

		const csvFilePath = './Output/test-results.csv';
		if (fs.existsSync(csvFilePath))
		{
		try {
		  fs.unlinkSync(csvFilePath)
		  //file removed
		} catch(err) {
		  console.error(err)
		}
		}

		var executeDriver = async function(i, array) {
		if (i < array.length) {
			setTimeout(function() {
				var url = pathConfig.array[i].URL;
				driver.get(url);
				driver.then(
					setTimeout(function() {
						AXE_BUILDER.analyze(function(err, results) {
							if (err) {
								console.log("error in Analyzing page");
							}
							AxeReports.processResults(results, 'csv', './Output/test-results', false, i);
							executeDriver(i + 1, array);
						}, 10000);
					}, 10000)
				);
			}, 10000);
		} else {
			driver.close();
			// Wait a short bit to ensure file is flushed, then summarize
			waitForFileAndSummarize(csvFilePath, summarizeCsvTextColumns, outputFile);		 
		
		}
	}; // <<< THIS CLOSES executeDriver!	//executeDriver(1,array);

		if(pathConfig.array.length){
			executeDriver(0,pathConfig.array);

		}

		 function summarizeColumnText(values) {
		  const nonEmptyValues = values.filter(v => v !== '');
		  const summary = {};

		  // Count total values
		  summary.count = nonEmptyValues.length;

		  // Unique values
		  const unique = [...new Set(nonEmptyValues)];
		  summary.uniqueCount = unique.length;

		  // Frequency table
		  const freq = {};
		  nonEmptyValues.forEach(val => { freq[val] = (freq[val] || 0) + 1; });
		  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

		  return { summary, freqTable: sorted };
		}

		 function summarizeCsvTextColumns(csvFilePath, outputFile) {
		   fs.readFile(csvFilePath, 'utf8', (err, data) => {
			if (err) return console.error('Error reading CSV file:', err);

			parse(
			  data,
			  {
				trim: true,
				relax_quotes: true,
				skip_empty_lines: true,
				columns: false,
			  },
			  (err, rows) => {
				if (err) return console.error('Error parsing CSV:', err);

				const headers = rows[0].slice(0, 6); // A-F
				const columns = [[], [], [], [], [], []];

				rows.slice(1).forEach(row => {
				  for (let i = 0; i < 6; i++) {
					columns[i].push(row[i]);
				  }
				});

				let allContent = '';

				for (let i = 0; i < 6; i++) {
				  const colName = headers[i] || `Column${i+1}`;
				  const { summary, freqTable } = summarizeColumnText(columns[i]);
				  allContent += `Column,Total Values,Unique Values\n`;
				  allContent += `${colName},${summary.count},${summary.uniqueCount}\n\n`;
				  allContent += `Value,Count\n`;
				  allContent += freqTable.map(([val, cnt]) => `"${val.replace(/"/g, '""')}",${cnt}`).join('\n') + '\n\n';
				}

				fs.writeFileSync(outputFile, allContent, 'utf8');
				console.log(`All column summaries written to ${outputFile}`);
				
			  }
			);
		  });
		}
		// summarizeCsvTextColumns(csvFilePath, outputFile);
		function waitForFileAndSummarize(filePath, summarizeFn, outputFile, maxRetries = 10, delay = 1000) {
		let tries = 0;
		(function check() {
			if (fs.existsSync(filePath)) {
				summarizeFn(filePath, outputFile);
			} else if (++tries < maxRetries) {
				setTimeout(check, delay);
			} else {
				console.error('File was not created in time:', filePath);
			}
		})();
	}