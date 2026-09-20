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
const totalRows = inputRows.length > 1 ? inputRows.length - 1 : 0;

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
    .summary-block { 
      display: flex; 
      flex-direction: column; 
      align-items: stretch; 
      margin-bottom: 3em; 
    }
    .table-chart-wrapper {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 5em;
    }
    .table-container { 
      min-width: 220px; 
      max-width: 380px; 
      margin-right: 0; 
      flex: 1 1 320px;
      order: 1;
    }
    .chart-container { 
      width: 320px; 
      min-width: 220px; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      order: 2;
    }
    table { 
      border-collapse: collapse; 
      margin-bottom: 1em; 
      table-layout: fixed; 
      width: 100%; 
    }
    th, td { 
      border: 1px solid #aaa; 
      padding: 4px 8px; 
      word-break: break-word; 
    }
    th { background: #f0f0f0; }
    th.count-col, td.count-col { width: 60px; text-align: center; }
    .detail-table { display: none; margin-bottom: 2em; }
    .clickable { color: #0066cc; text-decoration: underline; cursor: pointer; }
  </style>
</head>
<body>
  <h1 style="text-align: center;">Executive Summary</h1>
   <div style="text-align: center; font-size: 1.2em; margin-bottom: 2em;"><b>Total Accessibility Issues:</b> ${totalRows}</div>
  `;

let chartGlobalId = 0;
for (const block of wantedOrder) {
  const {colName, total, unique, freqSection} = block;
  const colIndex = inputRows[0].indexOf(colName);

  // Build value->rows mapping for this column
  const valueToRows = {};
  inputRows.slice(1).forEach(row => {
    const val = row[colIndex];
    if (!valueToRows[val]) valueToRows[val] = [];
    valueToRows[val].push(row);
  });

  html += `<div class="summary-block"><h2>${escapeHtml(colName)}</h2>`;
  html += `<div style="margin-bottom=2em;"><b>Unique Values:</b> ${escapeHtml(unique)}</div>`;
  html += `<div class="table-chart-wrapper">`;
  html += `<div class="table-container">`;

  // Frequency table section
  let labels = [], values = [], clickableHtmlRows = [];
  if (freqSection) {
    const freqLines = freqSection.trim().split('\n');
    if (freqLines.length > 1) {
      // Add class to Count column header
      const [labelHeader, countHeader] = freqLines[0].split(',');
      clickableHtmlRows.push(`<tr><th>${labelHeader}</th><th class="count-col">${countHeader}</th></tr>`);
      for (let j = 1; j < freqLines.length; ++j) {
        const lastComma = freqLines[j].lastIndexOf(',');
        let value = freqLines[j].substring(0, lastComma).replace(/^"|"$/g, '').replace(/""/g, '"');
        const count = freqLines[j].substring(lastComma + 1);
        labels.push(value);
        values.push(Number(count));
        const detailId = `detail_${chartGlobalId}_${j}`;
        clickableHtmlRows.push(
          `<tr>
            <td>${escapeHtml(value)}</td>
            <td class="count-col">
              <span class="clickable" onclick="toggleTable('${detailId}')">${escapeHtml(count)}</span>
            </td>
          </tr>`
        );
        let detailTable = `<table id="${detailId}" class="detail-table">
          <caption>All records where <b>${escapeHtml(colName)}</b> = <b>${escapeHtml(value)}</b></caption>
          <tr>${inputRows[0].map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
        (valueToRows[value] || []).forEach(row => {
          detailTable += '<tr>' + row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('') + '</tr>';
        });
        detailTable += `</table>`;
        detailTables.push(detailTable);
      }
    }
  }

  html += `<table>${clickableHtmlRows.join('')}</table>`;
  html += `</div>`; // close table-container

  chartsData.push({
    id: `pie_${chartGlobalId}`,
    column: colName,
    labels,
    values
  });
  html += `<div class="chart-container"><canvas id="pie_${chartGlobalId}"></canvas></div></div></div>`;
  chartGlobalId++;
}

html += `<div id="details">` + detailTables.join('\n') + `</div>`;

html += `
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

function toggleTable(id) {
  // Hide all detail tables first
  document.querySelectorAll('.detail-table').forEach(function(tbl) {
    tbl.style.display = 'none';
  });
  // Then show the selected one if it was not already visible
  var el = document.getElementById(id);
  if (!el) return;
  if (el.style.display === 'table') {
    el.style.display = 'none';
  } else {
    el.style.display = 'table';
    el.scrollIntoView({behavior: "smooth", block: "start"});
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const chartsData = ${JSON.stringify(chartsData)};
  const detailMap = {};

  // Build a map from chartId and label index to detail table id
  chartsData.forEach(function(data, chartIdx) {
    data.labels.forEach(function(label, labelIdx) {
      detailMap[data.id + '_' + labelIdx] = 'detail_' + chartIdx + '_' + (labelIdx + 1);
    });
  });

  chartsData.forEach(function(data, chartIdx) {
    const chart = new Chart(document.getElementById(data.id), {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#66bb6a', '#ab47bc',
            '#29b6f6', '#ef5350', '#ffa726', '#8d6e63', '#26a69a',
            '#d4e157', '#5c6bc0', '#ec407a', '#42a5f5', '#7e57c2'
          ],
        }]
      },
      options: {
        cutout: '60%',
        plugins: {
          legend: { display: true, position: 'bottom' },
          title: { display: false },
          datalabels: {
            color: '#222',
            font: { weight: 'bold', size: 14 },
            formatter: function(value, context) {
              // Make the count look like a link
              return value;
            },
            listeners: {
              click: function(context) {
                // This is handled below with Chart.js click event
              }
            }
          }
        }
      },
      plugins: [ChartDataLabels, centerTextPlugin]
    });

    // Add click event to the chart canvas
    chart.canvas.onclick = function(evt) {
      const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
      if (points.length) {
        const idx = points[0].index;
        const detailId = detailMap[data.id + '_' + idx];
        if (detailId) {
          toggleTable(detailId);
        }
      }
    };
  });
});
</script>
</body>
</html>
`;

fs.writeFileSync(outputHtml, html, 'utf8');
console.log(`Tabular & donut chart summary HTML (with hyperlinks) generated: ${outputHtml}`);