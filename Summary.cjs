const fs = require('fs');
const { parse } = require('csv-parse');

const csvFilePath = './Output/test-results.csv';
const outputFile = 'all_column_summaries.csv';

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

summarizeCsvTextColumns(csvFilePath, outputFile);