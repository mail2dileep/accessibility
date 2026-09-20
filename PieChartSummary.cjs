const fs = require('fs');
const { parse } = require('csv-parse/sync');

const inputCsv = './Output/test-results.csv';
const summaryCsv = 'all_column_summaries.csv';
const outputHtml = 'summary_tabular_donutcharts_hyperlinks.html';

// Parse the original CSV for detailed records
const inputData = fs.readFileSync(inputCsv, 'utf8');
const inputRows = parse(inputData, {
  trim: true,
  relax_quotes: true,
  skip_empty_lines: true,
  columns: false,
});

// Read and parse the consolidated CSV summary file
const summaryData = fs.readFileSync(summaryCsv, 'utf8');
const sections = summaryData.split('\n\n').filter(Boolean);
console.log(inputRows.length, 'input rows parsed from CSV')  ;
//const totalRows = inputRows.length > 1 ? inputRows.length - 1 : 0;
//const hasHeader = Array.isArray(inputRows[0]) && inputRows[0].some(h => typeof h === 'string');
const totalRows =  inputRows.length - 1 

function escapeHtml(text) {
  return (text ?? '').toString().replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m];
  });
}

// Parse all summary blocks and store with column names
let allBlocks = [];
for (let i = 0, chartId = 0; i < sections.length; i += 2, chartId++) {
  const summaryLines = sections[i].trim().split('\n');
  if (summaryLines.length < 2) continue;
  const [summaryHeader, summaryData] = summaryLines;
  const [colName, total, unique] = summaryData.split(',');
  allBlocks.push({
    chartId,
    i,
    colName: colName.trim(),
    summaryHeader,
    summaryData,
    total,
    unique,
    summarySection: sections[i],
    freqSection: sections[i+1]
  });
}

// Order: up to URL, then URL, Level, Impact, then the rest
const wantedOrder = [];
let urlIdx = allBlocks.findIndex(b => b.colName.toLowerCase() === 'url');
let levelIdx = allBlocks.findIndex(b => b.colName.toLowerCase() === 'level');
let impactIdx = allBlocks.findIndex(b => b.colName.toLowerCase() === 'impact');

if (urlIdx !== -1) {
  for (let k = 0; k < urlIdx; ++k) wantedOrder.push(allBlocks[k]);
  wantedOrder.push(allBlocks[urlIdx]);
  if (levelIdx !== -1) wantedOrder.push(allBlocks[levelIdx]);
  if (impactIdx !== -1) wantedOrder.push(allBlocks[impactIdx]);
  for (let k = urlIdx + 1; k < allBlocks.length; ++k) {
    if (![urlIdx, levelIdx, impactIdx].includes(k)) {
      wantedOrder.push(allBlocks[k]);
    }
  }
} else {
  wantedOrder.push(...allBlocks);
}

let chartsData = [];
let detailTables = [];
let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Accessibility Report</title>
  <style>
    body { font-family: Arial, sans-serif; }
    h2 { margin-top: 2em; }
    .charts-row {
      display: flex;
      flex-wrap: wrap;
      gap: 2em;
      justify-content: flex-start;
      align-items: flex-start;
      margin-bottom: 2em;
    }
    .chart-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 340px;
      max-width: 400px;
      margin-bottom: 2em;
      background: #fafafa;
      border-radius: 8px;
      box-shadow: 0 2px 8px #0001;
      padding: 1em 1.5em 1.5em 1.5em;
    }
    .chart-container { 
      width: 320px; 
      min-width: 220px; 
      height: 320px;
      display: flex; 
      align-items: center; 
      justify-content: center;
      margin: 0 auto;
    }
    .chart-legend {
      margin-top: 1em;
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5em 1.5em;
      justify-content: center;
      font-size: 0.98em;
    }
    .legend-color {
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: 0.5em;
      border-radius: 3px;
      vertical-align: middle;
    }
    .detail-table {
      display: none;
      margin: 1em auto 2em auto;
      border-collapse: collapse;
      width: 95%;
      background: #fff;
      box-shadow: 0 2px 8px #0002;
    }
    .detail-table th, .detail-table td {
      border: 1px solid #ccc;
      padding: 0.4em 0.7em;
      font-size: 0.98em;
    }
    .detail-table th {
      background: #f2f2f2;
    }
    .detail-table caption {
      caption-side: top;
      font-weight: bold;
      margin-bottom: 0.5em;
      text-align: left;
    }
  </style>
</head>
<body>
  <h1 style="text-align: center;">Executive Summary</h1>
  <div style="text-align: center; font-size: 1.2em; margin-bottom: 2em;"><b>Total Accessibility Issues:</b> ${totalRows}</div>
  <div class="charts-row">
`;

let chartGlobalId = 0;
for (const block of wantedOrder) {
  const {colName, total, unique, freqSection} = block;
  if (!freqSection) continue;

  // Frequency table section
  let labels = [], values = [];
  const freqLines = freqSection.trim().split('\n');
  if (freqLines.length > 1) {
    for (let j = 1; j < freqLines.length; ++j) {
      const lastComma = freqLines[j].lastIndexOf(',');
      let value = freqLines[j].substring(0, lastComma).replace(/^"|"$/g, '').replace(/""/g, '"');
      const count = freqLines[j].substring(lastComma + 1);
      labels.push(value);
      values.push(Number(count));
    }
  }

  // Prepare detail tables for each slice
  const colIndex = inputRows[0].indexOf(colName);
  labels.forEach((label, idx) => {
    let detailId = `detail_${chartGlobalId}_${idx}`;
    let detailTable = `<table id="${detailId}" class="detail-table">
      <caption>All records where <b>${escapeHtml(colName)}</b> = <b>${escapeHtml(label)}</b></caption>
      <tr>${inputRows[0].map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    inputRows.slice(1).forEach(row => {
      if (row[colIndex] === label) {
        detailTable += '<tr>' + row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('') + '</tr>';
      }
    });
    detailTable += `</table>`;
    detailTables.push(detailTable);
  });

  // Generate legend HTML for this chart
  let legendHtml = '';
  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#66bb6a', '#ab47bc',
    '#29b6f6', '#ef5350', '#ffa726', '#8d6e63', '#26a69a',
    '#d4e157', '#5c6bc0', '#ec407a', '#42a5f5', '#7e57c2'
  ];
  legendHtml += `<div class="chart-legend">`;
  labels.forEach((label, idx) => {
    legendHtml += `<span><span class="legend-color" style="background:${chartColors[idx % chartColors.length]}"></span>${escapeHtml(label)}</span>`;
  });
  legendHtml += `</div>`;

  html += `<div class="chart-block">
    <h2>${escapeHtml(colName)}</h2>
    <div style="margin-bottom:1em;"><b>Unique Values:</b> ${escapeHtml(unique)}</div>
    <div class="chart-container"><canvas id="pie_${chartGlobalId}"></canvas></div>
    ${legendHtml}
  </div>`;

  chartsData.push({
    id: `pie_${chartGlobalId}`,
    column: colName,
    labels,
    values
  });
  chartGlobalId++;
}

html += `
  </div>
  <div id="detail-tables">
    ${detailTables.join('\n')}
  </div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
<script>
// Custom plugin to draw total count in the center
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const {ctx, chartArea: {left, right, top, bottom, width, height}} = chart;
    ctx.save();
    ctx.font = 'bold 1.5em Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';
    // Calculate total
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
    ctx.fillText(total, left + width / 2, top + height / 2);
    ctx.restore();
  }
};

function showOnlyTable(id) {
  document.querySelectorAll('.detail-table').forEach(function(tbl) {
    tbl.style.display = 'none';
  });
  var el = document.getElementById(id);
  if (el) {
    el.style.display = 'table';
    el.scrollIntoView({behavior: "smooth", block: "start"});
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const chartsData = ${JSON.stringify(chartsData)};
  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#66bb6a', '#ab47bc',
    '#29b6f6', '#ef5350', '#ffa726', '#8d6e63', '#26a69a',
    '#d4e157', '#5c6bc0', '#ec407a', '#42a5f5', '#7e57c2'
  ];

  chartsData.forEach(function(data, chartIdx) {
    const chart = new Chart(document.getElementById(data.id), {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: chartColors,
        }]
      },
      options: {
        cutout: '60%',
        plugins: {
          legend: { display: false }, // Hide Chart.js legend, use custom legend
          title: { display: false },
          datalabels: {
            color: '#222',
            font: { weight: 'bold', size: 14 },
            formatter: function(value, context) {
              // Make the count look like a link
              return value;
            }
          }
        }
      },
      plugins: [ChartDataLabels, centerTextPlugin]
    });

    // Add click event to the chart canvas for slice labels
    chart.canvas.onclick = function(evt) {
      const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
      if (points.length) {
        const idx = points[0].index;
        const detailId = 'detail_' + chartIdx + '_' + idx;
        showOnlyTable(detailId);
      }
    };
  });
});
</script>
</body>
</html>
`;

fs.writeFileSync(outputHtml, html, 'utf8');
console.log(`Doughnut chart summary HTML generated: ${outputHtml}`);