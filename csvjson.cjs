const fs = require('fs');

const inputFile = 'all_column_summaries.csv';
const outputFile = 'chart-data.json';

const content = fs.readFileSync(inputFile, 'utf8');
const sections = content.split('\n\n').filter(Boolean);

const charts = [];

for (let i = 0; i < sections.length; i += 2) {
  // Parse summary header
  const summaryLines = sections[i].trim().split('\n');
  if (summaryLines.length < 2) continue;
  const [header, data] = summaryLines;
  const [colName, total, unique] = data.split(',');

  // Parse value/counts
  const freqLines = sections[i + 1] ? sections[i + 1].trim().split('\n') : [];
  const labels = [];
  const values = [];
  for (let j = 1; j < freqLines.length; ++j) {
    // Remove quotes and handle commas inside quotes
    let [label, count] = freqLines[j].split(/,(?=\d+$)/);
    label = label.replace(/^"|"$/g, '').replace(/""/g, '"');
    labels.push(label);
    values.push(Number(count));
  }

  charts.push({
    title: colName ? colName.trim() : `Column${i / 2 + 1}`,
    labels,
    values
  });
}

fs.writeFileSync(outputFile, JSON.stringify({ charts }, null, 2), 'utf8');
console.log('chart-data.json generated!');