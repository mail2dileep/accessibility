var fs = require('fs');
var options = {
	delimiter: ',', // optional
	quote: '"' // optional
}
const csvFilePath = './Output/test-results.csv';
const outputFile = 'all_column_summaries1.csv';
const { parse } = require('csv-parse');
summarizeCsvTextColumns(csvFilePath, outputFile);

function summarizeColumnText(values) {
	const nonEmptyValues = values.filter(v => v !== '');
	//const nonEmptyValues = values.filter(v => v && v.trim() !== '');
	const summary = {};

	// Count total values
	summary.count = nonEmptyValues.length;
	console.log('Total values in column:', summary.count);

	// Unique values
	const unique = [...new Set(nonEmptyValues)];
	summary.uniqueCount = unique.length;

	// Frequency table
	const freq = {};
	nonEmptyValues.forEach(val => { freq[val] = (freq[val] || 0) + 1; });
	const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

	return { summary, freqTable: sorted };
	/*const nonEmptyValues = values.filter(v => v && v.trim() !== '');
  const trimmedValues = nonEmptyValues.map(v => v.trim());
  const summary = {};

  // Count total values (non-empty)
  summary.count = trimmedValues.length;
  console.log('Total values in column:', summary.count);

  // Unique values (non-empty, trimmed)
  const unique = [...new Set(trimmedValues)];
  summary.uniqueCount = unique.length;

  // Frequency table (non-empty, trimmed)
  const freq = {};
  trimmedValues.forEach(val => { freq[val] = (freq[val] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  return { summary, freqTable: sorted };*/
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
					const colName = headers[i] || `Column${i + 1}`;
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