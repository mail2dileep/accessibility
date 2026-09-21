const AxeBuilder = require('@axe-core/webdriverjs');
const AxeReports = require('axe-reports');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const csvjson = require('csvjson');
const fs = require('fs');
const { parse } = require('csv-parse');

const INPUT_CSV_PATH = './TesturlUpdated.csv';
const OUTPUT_CSV_PATH = './Output/test-results.csv';
const SUMMARY_OUTPUT_PATH = 'all_column_summaries.csv';
const PAGE_LOAD_TIMEOUT_MS = 60000;
const SCRIPT_TIMEOUT_MS = 60000;
const AXE_TIMEOUT_MS = 30000;
const MAX_RETRIES_PER_URL = 2;

fs.mkdirSync('./Output', { recursive: true });

function loadUrls() {
	const fileData = fs.readFileSync(INPUT_CSV_PATH, { encoding: 'utf8' });
	const urls = csvjson
		.toObject(fileData, {
			delimiter: ',',
			quote: '"'
		})
		.map(row => row.URL)
		.filter(url => typeof url === 'string' && url.trim() !== '');

	console.log(`Loaded ${urls.length} URL(s) from ${INPUT_CSV_PATH}`);
	return urls;
}

function removeExistingOutput() {
	if (!fs.existsSync(OUTPUT_CSV_PATH)) {
		return;
	}

	try {
		fs.unlinkSync(OUTPUT_CSV_PATH);
	} catch (error) {
		console.error(`Failed to remove existing output file: ${OUTPUT_CSV_PATH}`, error);
	}
}

function buildDriver() {
	const chromeOptions = new chrome.Options();
	chromeOptions.addArguments(
		'--headless=new',
		'--no-sandbox',
		'--disable-dev-shm-usage',
		'--disable-gpu',
		'--window-size=1920,1080',
		'--disable-background-timer-throttling'
	);

	const driver = new webdriver.Builder()
		.forBrowser('chrome')
		.setChromeOptions(chromeOptions)
		.build();

	driver.manage().setTimeouts({
		pageLoad: PAGE_LOAD_TIMEOUT_MS,
		script: SCRIPT_TIMEOUT_MS,
		implicit: 0
	});

	return driver;
}

async function waitForPageReady(driver) {
	await driver.wait(async () => {
		const readyState = await driver.executeScript('return document.readyState');
		return readyState === 'complete';
	}, PAGE_LOAD_TIMEOUT_MS);

	await driver.sleep(1000);
}

function analyzePage(driver) {
	return new Promise((resolve, reject) => {
		const builder = new AxeBuilder(driver);
		let settled = false;

		const timeoutId = setTimeout(() => {
			if (!settled) {
				settled = true;
				reject(new Error(`axe analysis timed out after ${AXE_TIMEOUT_MS}ms`));
			}
		}, AXE_TIMEOUT_MS);

		builder.analyze((error, results) => {
			if (settled) {
				return;
			}

			clearTimeout(timeoutId);
			settled = true;

			if (error) {
				reject(error);
				return;
			}

			resolve(results);
		});
	});
}

async function analyzeUrl(driver, url, index) {
	for (let attempt = 1; attempt <= MAX_RETRIES_PER_URL; attempt += 1) {
		try {
			console.log(`[${index + 1}] Opening ${url} (attempt ${attempt}/${MAX_RETRIES_PER_URL})`);
			await driver.get(url);
			await waitForPageReady(driver);
			const results = await analyzePage(driver);
			AxeReports.processResults(results, 'csv', './Output/test-results', false, index);
			console.log(`[${index + 1}] Completed ${url}`);
			return;
		} catch (error) {
			console.error(`[${index + 1}] Failed ${url} on attempt ${attempt}:`, error.message || error);
			if (attempt === MAX_RETRIES_PER_URL) {
				throw error;
			}
			await driver.sleep(2000);
		}
	}
}

function summarizeColumnText(values) {
	const nonEmptyValues = values.filter(value => value !== '');
	const summary = {
		count: nonEmptyValues.length,
		uniqueCount: [...new Set(nonEmptyValues)].length
	};
	const frequency = {};

	nonEmptyValues.forEach(value => {
		frequency[value] = (frequency[value] || 0) + 1;
	});

	const freqTable = Object.entries(frequency).sort((left, right) => right[1] - left[1]);
	return { summary, freqTable };
}

function summarizeCsvTextColumns(csvFilePath, outputFile) {
	fs.readFile(csvFilePath, 'utf8', (error, data) => {
		if (error) {
			console.error('Error reading CSV file:', error);
			return;
		}

		parse(
			data,
			{
				trim: true,
				relax_quotes: true,
				// Allow records with a differing number of fields instead of throwing
				relax_column_count: true,
				skip_empty_lines: true,
				columns: false
			},
			(parseError, rows) => {
				if (parseError) {
					console.error('Error parsing CSV:', parseError);
					return;
				}

				const headers = (rows[0] || []).slice(0, 6);
				const columns = [[], [], [], [], [], []];

				rows.slice(1).forEach(row => {
					for (let columnIndex = 0; columnIndex < 6; columnIndex += 1) {
						// If a record has fewer columns, use empty string; if more, ignore extras
						columns[columnIndex].push((row && row[columnIndex]) || '');
					}
				});

				let allContent = '';

				for (let columnIndex = 0; columnIndex < 6; columnIndex += 1) {
					const columnName = headers[columnIndex] || `Column${columnIndex + 1}`;
					const { summary, freqTable } = summarizeColumnText(columns[columnIndex]);
					allContent += 'Column,Total Values,Unique Values\n';
					allContent += `${columnName},${summary.count},${summary.uniqueCount}\n\n`;
					allContent += 'Value,Count\n';
					allContent += `${freqTable
						.map(([value, count]) => `"${String(value).replace(/"/g, '""')}",${count}`)
						.join('\n')}\n\n`;
				}

				fs.writeFileSync(outputFile, allContent, 'utf8');
				console.log(`All column summaries written to ${outputFile}`);
			}
		);
	});
}

function waitForFileAndSummarize(filePath, summarizeFn, outputFile, maxRetries = 10, delay = 1000) {
	let tries = 0;

	(function check() {
		if (fs.existsSync(filePath)) {
			console.log('Output CSV detected, generating summaries');
			summarizeFn(filePath, outputFile);
			return;
		}

		tries += 1;
		if (tries < maxRetries) {
			setTimeout(check, delay);
			return;
		}

		console.error('File was not created in time:', filePath);
	})();
}

async function main() {
	const urls = loadUrls();
	if (urls.length === 0) {
		console.warn('No URLs found to scan.');
		return;
	}

	removeExistingOutput();
	const driver = buildDriver();
	let failureCount = 0;

	try {
		for (let index = 0; index < urls.length; index += 1) {
			try {
				await analyzeUrl(driver, urls[index], index);
			} catch (error) {
				failureCount += 1;
				console.error(`[${index + 1}] Skipping ${urls[index]} after repeated failures.`);
			}
		}
	} finally {
		await driver.quit();
	}

	waitForFileAndSummarize(OUTPUT_CSV_PATH, summarizeCsvTextColumns, SUMMARY_OUTPUT_PATH);

	if (failureCount > 0) {
		console.warn(`Scan finished with ${failureCount} failed URL(s).`);
		return;
	}

	console.log('Accessibility scan completed successfully.');
}

main().catch(error => {
	console.error('Accessibility scan failed:', error);
	process.exitCode = 1;
});