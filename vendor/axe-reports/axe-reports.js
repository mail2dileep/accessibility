const fs = require('fs');

const CSV_COLUMNS = [
  'URL',
  'Rule',
  'Violation description',
  'Violation Type',
  'Impact',
  'LEVEL',
  'WCAG Tags',
  'HTML Element',
  'Messages',
  'DOM Element'
];

function csvValue(value) {
  return String(value ?? '')
    .replace(/\r?\n|\r/g, ' ')
    .replace(/,/g, '-');
}

function joinValues(values) {
  return (values || []).map(value => csvValue(value)).join('--');
}

function writeHeader(fileName, delimiter) {
  fs.writeFileSync(fileName, CSV_COLUMNS.join(delimiter) + '\r\n', 'utf8');
}

exports.processResults = function processResults(results, fileType, fileName, createNewReport, flag) {
  const delimiter = fileType === 'csv' ? ',' : fileType === 'tsv' ? '\t' : null;
  if (!delimiter) {
    console.log("ERROR - Please supply a valid file type. Currently, only 'csv' and 'tsv' are supported.");
    return undefined;
  }

  if (!fileName) {
    console.log('ERROR - Please supply a file name (i.e. my-report)');
    return undefined;
  }

  const reportPath = `${fileName}.${fileType}`;
  if (createNewReport || flag === 0) {
    writeHeader(reportPath, delimiter);
  }

  const rows = [];
  for (const violation of results?.violations || []) {
    const tags = (violation.tags || []).filter(tag =>
      ['wcag2a', 'wcag2aa', 'best-practice', 'wcag2aaa'].includes(tag)
    );

    for (const node of violation.nodes || []) {
      rows.push([
        results.url,
        violation.help,
        violation.description,
        violation.id,
        violation.impact,
        '',
        tags.join('--'),
        node.html,
        (node.any || []).map(check => check.message),
        node.target
      ].map(value => Array.isArray(value) ? joinValues(value) : csvValue(value)).join(delimiter));
    }
  }

  if (rows.length > 0) {
    fs.appendFileSync(reportPath, rows.join('\r\n') + '\r\n', 'utf8');
  }
};
