const fs = require('fs');
const { parse } = require('csv-parse/sync');

const inputCsv = './Output/test-results.csv';
const summaryCsv = 'all_column_summaries.csv';
const outputHtml = 'summary_report_fully_interactive.html';

// Parse the original CSV for detailed records
const inputData = fs.readFileSync(inputCsv, 'utf8');
const inputRows = parse(inputData, {
  trim: true,
  relax_quotes: true,
  skip_empty_lines: true,
  columns: false,
});

// Parse the summary CSV for column summaries
const summaryData = fs.readFileSync(summaryCsv, 'utf8');
const sections = summaryData.split('\n\n').filter(Boolean);

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m];
  });
}

let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Column Summaries (Fully Interactive)</title>
  <style>
    body { font-family: Arial, sans-serif; }
    h2 { margin-top: 2em; }
    table { border-collapse: collapse; margin-bottom: 2em; }
    th, td { border: 1px solid #aaa; padding: 4px 8px; }
    th { background: #f0f0f0; }
    .detail-table { display: none; margin-bottom: 2em; }
    .clickable { color: #0066cc; text-decoration: underline; cursor: pointer; }
  </style>
</head>
<body>
  <h1>CSV Column Summaries (Fully Interactive)</h1>
  <p>Click any blue value below to view the relevant records from the source CSV.</p>
`;

for (let i = 0, sectionId = 0; i < sections.length; i += 2, sectionId++) {
  // Summary section
  const summaryLines = sections[i].trim().split('\n');
  if (summaryLines.length < 2) continue;
  const [summaryHeader, summaryData] = summaryLines;
  const [colName, total, unique] = summaryData.split(',');
  const colIndex = inputRows[0].indexOf(colName);

  // Build value->rows mapping for this column
  const valueToRows = {};
  const nonEmptyRows = [];
  inputRows.slice(1).forEach(row => {
    const val = row[colIndex];
    if (val && val.trim() !== '') {
      nonEmptyRows.push(row);
      if (!valueToRows[val]) valueToRows[val] = [];
      valueToRows[val].push(row);
    }
  });
  const uniqueVals = Object.keys(valueToRows);

  // --- Summary Table ---
  html += `<h2>Summary for column: ${escapeHtml(colName)}</h2>`;
  html += `<table>
    <tr>
      <th>${summaryHeader.split(',')[0]}</th>
      <th>${summaryHeader.split(',')[1]}</th>
      <th>${summaryHeader.split(',')[2]}</th>
    </tr>
    <tr>
      <td>${escapeHtml(colName)}</td>
      <td>
        <span class="clickable" onclick="toggleTable('total_${sectionId}')">${total}</span>
      </td>
      <td>
        <span class="clickable" onclick="toggleTable('unique_${sectionId}')">${unique}</span>
      </td>
    </tr>
  </table>`;

  // --- Frequency Table ---
  if (sections[i + 1]) {
    const freqLines = sections[i + 1].trim().split('\n');
    if (freqLines.length > 1) {
      html += `<table>
        <tr><th>${freqLines[0].split(',')[0]}</th><th>${freqLines[0].split(',')[1]}</th></tr>`;
      for (let j = 1; j < freqLines.length; ++j) {
        const lastComma = freqLines[j].lastIndexOf(',');
        let value = freqLines[j].substring(0, lastComma).replace(/^"|"$/g, '').replace(/""/g, '"');
        const count = freqLines[j].substring(lastComma + 1);
        html += `<tr>
          <td>${escapeHtml(value)}</td>
          <td>
            <span class="clickable" onclick="toggleTable('val_${sectionId}_${j}')">${count}</span>
          </td>
        </tr>`;
      }
      html += `</table>`;
    }
  }

  // --- Detail Tables ---
  // Total Values: all non-empty
  html += `<table id="total_${sectionId}" class="detail-table">
    <caption>All non-empty records for column <b>${escapeHtml(colName)}</b></caption>
    <tr>${inputRows[0].map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  nonEmptyRows.forEach(row => {
    html += '<tr>' + row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('') + '</tr>';
  });
  html += `</table>`;

  // Unique Values: one example row per unique value
  html += `<table id="unique_${sectionId}" class="detail-table">
    <caption>One record per unique value in column <b>${escapeHtml(colName)}</b></caption>
    <tr>${inputRows[0].map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  uniqueVals.forEach(val => {
    html += '<tr>' + valueToRows[val][0].map(cell => `<td>${escapeHtml(cell)}</td>`).join('') + '</tr>';
  });
  html += `</table>`;

  // Frequency: all rows for each specific value
  if (sections[i + 1]) {
    const freqLines = sections[i + 1].trim().split('\n');
    if (freqLines.length > 1) {
      for (let j = 1; j < freqLines.length; ++j) {
        const lastComma = freqLines[j].lastIndexOf(',');
        let value = freqLines[j].substring(0, lastComma).replace(/^"|"$/g, '').replace(/""/g, '"');
        html += `<table id="val_${sectionId}_${j}" class="detail-table">
          <caption>All records where <b>${escapeHtml(colName)}</b> = <b>${escapeHtml(value)}</b></caption>
          <tr>${inputRows[0].map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
        (valueToRows[value] || []).forEach(row => {
          html += '<tr>' + row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('') + '</tr>';
        });
        html += `</table>`;
      }
    }
  }
}

// JS for show/hide detail tables
html += `
<script>
function toggleTable(id) {
  var el = document.getElementById(id);
  if (!el) return;
  if (el.style.display === 'table' || el.style.display === '') {
    el.style.display = 'none';
  } else {
    el.style.display = 'table';
  }
}
</script>
</body>
</html>
`;

fs.writeFileSync(outputHtml, html, 'utf8');
console.log(`Fully interactive HTML report generated: ${outputHtml}`);