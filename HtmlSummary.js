const fs = require('fs');

const inputCsv = 'all_column_summaries.csv';
const outputHtml = 'summary_report.html';

fs.readFile(inputCsv, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading CSV summary:', err);
    return;
  }

  // Split columns by two consecutive newlines
  const sections = data.split('\n\n').filter(Boolean);

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Column Summaries</title>
  <style>
    body { font-family: Arial, sans-serif; }
    h2 { margin-top: 2em; }
    table { border-collapse: collapse; margin-bottom: 2em; }
    th, td { border: 1px solid #aaa; padding: 4px 8px; }
    th { background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>CSV Column Summaries</h1>
`;

  for (let i = 0; i < sections.length; i += 2) {
    // Summary section
    const summaryLines = sections[i].trim().split('\n');
    if (summaryLines.length < 2) continue;
    const [summaryHeader, summaryData] = summaryLines;
    const [colName, total, unique] = summaryData.split(',');

    html += `<h2>Summary for column: ${colName}</h2>`;
    html += `<table>
      <tr><th>${summaryHeader.split(',')[0]}</th><th>${summaryHeader.split(',')[1]}</th><th>${summaryHeader.split(',')[2]}</th></tr>
      <tr><td>${colName}</td><td>${total}</td><td>${unique}</td></tr>
    </table>`;

    // Frequency table section (should be next)
    if (sections[i+1]) {
      const freqLines = sections[i+1].trim().split('\n');
      if (freqLines.length > 1) {
        html += `<table>
          <tr><th>${freqLines[0].split(',')[0]}</th><th>${freqLines[0].split(',')[1]}</th></tr>`;
        for (let j = 1; j < freqLines.length; ++j) {
          // Split only on the last comma (in case value contains commas)
          const lastComma = freqLines[j].lastIndexOf(',');
          const value = freqLines[j].substring(0, lastComma).replace(/^"|"$/g, '').replace(/""/g, '"');
          const count = freqLines[j].substring(lastComma + 1);
          html += `<tr><td>${value}</td><td>${count}</td></tr>`;
        }
        html += `</table>`;
      }
    }
  }

  html += '</body></html>';

  fs.writeFileSync(outputHtml, html, 'utf8');
  console.log(`HTML summary generated: ${outputHtml}`);
});