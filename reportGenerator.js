import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import { identifySystemicDefects, clusterDOMPatterns, detectSharedComponents } from './systemicDefectAnalyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate an HTML report with AI suggestions
 * @param {Array} issuesWithSuggestions - Issues with AI suggestions added
 * @returns {string} HTML content
 */
export function generateHTMLReportWithSuggestions(issuesWithSuggestions) {
  const timestamp = new Date().toLocaleString();
  
  // Perform systemic analysis
  const systemicAnalysis = identifySystemicDefects(issuesWithSuggestions);
  const domPatterns = clusterDOMPatterns(issuesWithSuggestions);
  const sharedComponents = detectSharedComponents(issuesWithSuggestions);
  
  const rows = issuesWithSuggestions
    .map((issue, idx) => `
      <tr class="issue-row" onclick="toggleRow(${idx})">
        <td class="row-number">${idx + 1}</td>
        <td class="url">${escapeHtml(issue.URL || 'N/A')}</td>
        <td class="rule">${escapeHtml(issue.Rule || 'N/A')}</td>
        <td class="violation-type">${escapeHtml(issue['Violation Type'] || 'N/A')}</td>
        <td class="level level-${(issue.LEVEL || issue.Level || 'unknown').toLowerCase()}">${escapeHtml(issue.LEVEL || issue.Level || 'N/A')}</td>
        <td class="impact impact-${(issue.Impact || 'minor').toLowerCase()}">${escapeHtml(issue.Impact || 'N/A')}</td>
      </tr>
      <tr class="details-row" id="details-${idx}" style="display: none;">
        <td colspan="6">
          <div class="details-content">
            <div class="detail-section">
              <h4>Violation Description</h4>
              <p>${escapeHtml(issue['Violation description'] || 'N/A')}</p>
            </div>
            <div class="detail-section">
              <h4>HTML Element</h4>
              <pre><code>${escapeHtml(issue['HTML Element'] || 'N/A')}</code></pre>
            </div>
            <div class="detail-section">
              <h4>DOM Path</h4>
              <pre><code>${escapeHtml(issue['DOM Element'] || 'N/A')}</code></pre>
            </div>
            <div class="detail-section ai-suggestion">
              <h4>🤖 AI Fix Suggestion</h4>
              <div class="suggestion-text">${escapeHtml(issue['AI Suggestion'] || 'No suggestion available')}</div>
            </div>
          </div>
        </td>
      </tr>
    `)
    .join('');

  const impactStats = {
    critical: issuesWithSuggestions.filter(i => i.Impact === 'critical').length,
    serious: issuesWithSuggestions.filter(i => i.Impact === 'serious').length,
    moderate: issuesWithSuggestions.filter(i => i.Impact === 'moderate').length,
    minor: issuesWithSuggestions.filter(i => i.Impact === 'minor').length
  };

  // Generate systemic analysis HTML sections
  const systemicAnalysisHTML = generateSystemicAnalysisSection(systemicAnalysis, domPatterns, sharedComponents);
  
  // Generate AI executive summary
  const executiveSummary = generateExecutiveSummary(systemicAnalysis, impactStats, issuesWithSuggestions);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report with AI Suggestions</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 1.1em;
      opacity: 0.9;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .stat-card h3 {
      font-size: 2em;
      margin-bottom: 10px;
    }

    .stat-card.critical { color: #dc3545; }
    .stat-card.serious { color: #fd7e14; }
    .stat-card.moderate { color: #ffc107; }
    .stat-card.minor { color: #17a2b8; }

    .stat-card p {
      color: #666;
      font-size: 0.9em;
    }

    .content {
      padding: 40px;
      overflow-x: auto;
    }

    .content h2 {
      margin-bottom: 20px;
      color: #333;
      font-size: 1.8em;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95em;
      table-layout: fixed;
    }

    thead {
      background: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
    }

    th {
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      color: #333;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      vertical-align: top;
    }

    th:nth-child(1) { width: 5%; min-width: 35px; }
    th:nth-child(2) { width: 25%; min-width: 200px; }
    th:nth-child(3) { width: 25%; min-width: 200px; }
    th:nth-child(4) { width: 15%; min-width: 120px; }
    th:nth-child(5) { width: 15%; min-width: 120px; }
    th:nth-child(6) { width: 15%; min-width: 120px; }

    tr.issue-row {
      cursor: pointer;
      border-bottom: 1px solid #dee2e6;
      transition: background 0.2s;
    }

    tr.issue-row:hover {
      background: #f8f9fa;
    }

    td {
      padding: 12px 15px;
      color: #666;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      line-height: 1.5;
      vertical-align: top;
    }

    td:nth-child(1) { width: 5%; min-width: 35px; }
    td:nth-child(2) { width: 25%; min-width: 200px; }
    td:nth-child(3) { width: 25%; min-width: 200px; }
    td:nth-child(4) { width: 15%; min-width: 120px; }
    td:nth-child(5) { width: 15%; min-width: 120px; }
    td:nth-child(6) { width: 15%; min-width: 120px; }

    .row-number {
      font-weight: 600;
      color: #667eea;
      width: 50px;
      min-width: 50px;
    }

    .url {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.85em;
      word-break: break-all;
      overflow-wrap: break-word;
      max-width: 250px;
    }

    .rule {
      font-weight: 500;
      color: #333;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .violation-type {
      font-size: 0.9em;
      color: #666;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .level {
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 4px;
      min-width: 80px;
      text-align: center;
      white-space: nowrap;
    }

    .level-error { background: #f8d7da; color: #721c24; }
    .level-warning { background: #fff3cd; color: #856404; }
    .level-notice { background: #d1ecf1; color: #0c5460; }
    .level-unknown { background: #e2e3e5; color: #383d41; }

    .impact {
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 4px;
      min-width: 100px;
      text-align: center;
      white-space: nowrap;
    }

    .impact-critical { background: #f8d7da; color: #721c24; }
    .impact-serious { background: #fff3cd; color: #856404; }
    .impact-moderate { background: #fff3cd; color: #856404; }
    .impact-minor { background: #d1ecf1; color: #0c5460; }

    tr.details-row {
      background: #fafbfc;
    }

    .details-content {
      padding: 30px;
      background: white;
      border-radius: 8px;
      margin: 10px 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .detail-section {
      margin-bottom: 25px;
    }

    .detail-section h4 {
      color: #333;
      margin-bottom: 10px;
      font-size: 1.1em;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .detail-section p {
      color: #666;
      line-height: 1.8;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: pre-wrap;
    }

    .detail-section pre {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #667eea;
      overflow-x: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: pre-wrap;
      max-width: 100%;
    }

    .detail-section code {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
      color: #333;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: pre-wrap;
    }

    .detail-section.ai-suggestion {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .suggestion-text {
      color: #333;
      line-height: 1.8;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: 0.95em;
    }

    .footer {
      background: #f8f9fa;
      padding: 20px 40px;
      border-top: 1px solid #dee2e6;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }

    @media print {
      body {
        background: white;
      }
      tr.details-row {
        display: table-row !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>♿ Accessibility Report</h1>
      <p>Issues with AI-Powered Fix Suggestions</p>
    </div>

    ${executiveSummary}

    <!-- Summary metrics moved to AI Executive Summary to avoid duplication -->

    <div class="content">
      <h2>Issues Details (Click to expand)</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>URL</th>
            <th>Rule</th>
            <th>Type</th>
            <th>Level</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    ${systemicAnalysisHTML}

    <div class="footer">
      <p>Report generated on ${timestamp}</p>
      <p>Total Issues: ${issuesWithSuggestions.length} | AI Suggestions enabled</p>
    </div>
  </div>

  <script>
    function toggleRow(idx) {
      const detailsRow = document.getElementById('details-' + idx);
      if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'table-row';
      } else {
        detailsRow.style.display = 'none';
      }
    }
  </script>
</body>
</html>`;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate systemic analysis section for HTML report
 */
function generateSystemicAnalysisSection(analysis, domPatterns, sharedComponents) {
  // Use ruleFrequencyList for all rules (not filtered to systemic only)
  const systemicRulesRows = (analysis.ruleFrequencyList || analysis.systemicRules || [])
    .map(item => `
      <tr>
        <td>${escapeHtml(item.rule)}</td>
        <td>${item.occurrences}</td>
        <td>${item.percentage}%</td>
        <td><span class="severity-${item.severity}">${item.severity.toUpperCase()}</span></td>
      </tr>
    `).join('');

  const problematicUrlsRows = analysis.problematicUrls.slice(0, 5)
    .map(item => `
      <tr>
        <td><code>${escapeHtml(item.url)}</code></td>
        <td>${item.totalIssues}</td>
        <td>${item.uniqueRules}</td>
        <td>${item.criticalIssues}</td>
        <td><span class="impact-${item.maxImpact.toLowerCase()}">${item.maxImpact}</span></td>
      </tr>
    `).join('');

  const crossUrlPatternsRows = analysis.crossUrlPatterns.slice(0, 5)
    .map(item => `
      <tr>
        <td><code>${escapeHtml(item.pattern)}</code></td>
        <td>${item.totalOccurrences}</td>
        <td>${item.urlsAffected}</td>
        <td>${item.rules.slice(0, 2).map(r => `<span class="rule-badge">${escapeHtml(r)}</span>`).join('')}</td>
      </tr>
    `).join('');

  const domPatternsRows = domPatterns.slice(0, 5)
    .map(item => `
      <tr>
        <td><code>${escapeHtml(item.pattern)}</code></td>
        <td>${item.count}</td>
        <td><span class="severity-${item.severity}">${item.severity.toUpperCase()}</span></td>
        <td>${item.rules.join(', ').substring(0, 50)}...</td>
      </tr>
    `).join('');

  const sharedComponentsRows = sharedComponents.slice(0, 5)
    .map(item => `
      <tr>
        <td><code>&lt;${escapeHtml(item.tag)}&gt;</code></td>
        <td>${item.issueCount}</td>
        <td>${item.urlsAffected}</td>
        <td>${item.uniqueRules}</td>
        <td>${item.isSystemic ? '⚠️ Yes' : 'No'}</td>
      </tr>
    `).join('');

  return `
    <div class="systemic-analysis">
      <h2>🔍 Systemic Defect Analysis</h2>
      
      <div class="analysis-summary">
        <div class="summary-card critical">
          <h3>${escapeHtml(analysis.systemicSummary.topConcern).substring(0, 30)}</h3>
          <p>${analysis.systemicSummary.prevalence}</p>
        </div>
        <div class="summary-card">
          <h3>${analysis.systemicSummary.affectedUrls}</h3>
          <p>URLs with systemic issues</p>
        </div>
        <div class="summary-card">
          <h3>${analysis.systemicSummary.criticalCount}</h3>
          <p>Critical systemic issues</p>
        </div>
        <div class="summary-card">
          <h3>${domPatterns.length}</h3>
          <p>DOM patterns identified</p>
        </div>
      </div>

      <div class="analysis-section">
        <h3>📊 Most Prevalent Rules</h3>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Occurrences</th>
              <th>% of Total</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            ${systemicRulesRows}
          </tbody>
        </table>
      </div>

      <div class="analysis-section">
        <h3>🎯 Most Affected URLs</h3>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Total Issues</th>
              <th>Unique Rules</th>
              <th>Critical</th>
              <th>Max Impact</th>
            </tr>
          </thead>
          <tbody>
            ${problematicUrlsRows}
          </tbody>
        </table>
      </div>

      <div class="analysis-section">
        <h3>🔗 Cross-URL Patterns</h3>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Occurrences</th>
              <th>URLs Affected</th>
              <th>Associated Rules</th>
            </tr>
          </thead>
          <tbody>
            ${crossUrlPatternsRows}
          </tbody>
        </table>
      </div>

      <div class="analysis-section">
        <h3>🎨 DOM Pattern Clusters</h3>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Occurrences</th>
              <th>Severity</th>
              <th>Associated Rules</th>
            </tr>
          </thead>
          <tbody>
            ${domPatternsRows}
          </tbody>
        </table>
      </div>

      <div class="analysis-section">
        <h3>⚙️ Shared Components</h3>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Issue Count</th>
              <th>URLs</th>
              <th>Rules</th>
              <th>Systemic</th>
            </tr>
          </thead>
          <tbody>
            ${sharedComponentsRows}
          </tbody>
        </table>
      </div>

      <style>
        .systemic-analysis {
          margin: 40px 0;
          background: #f5f7fa;
          padding: 30px;
          border-radius: 8px;
          border-left: 5px solid #667eea;
        }

        .systemic-analysis h2 {
          color: #333;
          margin-bottom: 30px;
          font-size: 1.8em;
        }

        .analysis-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .summary-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
        }

        .summary-card.critical {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .summary-card h3 {
          font-size: 1.5em;
          margin-bottom: 10px;
        }

        .summary-card p {
          font-size: 0.9em;
          opacity: 0.8;
        }

        .analysis-section {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .analysis-section h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 1.3em;
        }

        .analysis-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9em;
        }

        .analysis-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
          color: #333;
        }

        .analysis-table td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
        }

        .analysis-table tbody tr:hover {
          background: #f8f9fa;
        }

        .severity-critical {
          background: #f8d7da;
          color: #721c24;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .severity-high {
          background: #fff3cd;
          color: #856404;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .severity-medium {
          background: #d1ecf1;
          color: #0c5460;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .severity-low {
          background: #e2e3e5;
          color: #383d41;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .rule-badge {
          display: inline-block;
          background: #e7f3ff;
          color: #0066cc;
          padding: 3px 8px;
          border-radius: 3px;
          margin-right: 5px;
          font-size: 0.85em;
        }
      </style>
    </div>
  `;
}

/**
 * Generate AI Executive Summary based on systemic analysis
 */
function generateExecutiveSummary(analysis, impactStats, allIssues) {
  const topRule = analysis.systemicRules[0];
  const topUrl = analysis.problematicUrls[0];
  const criticalCount = impactStats.critical;
  const seriousCount = impactStats.serious;
  const moderateCount = impactStats.moderate;
  const minorCount = impactStats.minor;
  const totalIssues = allIssues.length;
  
  // Determine severity level and recommendations
  let severityLevel = 'Moderate';
  let urgency = '⚠️ Moderate Priority';
  let urgencyColor = '#ffc107';
  
  if (criticalCount > 5) {
    severityLevel = 'Critical';
    urgency = '🚨 Critical - Immediate Action Required';
    urgencyColor = '#dc3545';
  } else if (criticalCount > 0) {
    severityLevel = 'Serious';
    urgency = '⚠️ High Priority';
    urgencyColor = '#fd7e14';
  }
  
  // Generate key findings
  const findings = [];
  if (topRule) {
    findings.push(`The website has ${severityLevel.toLowerCase()} accessibility issues primarily related to <strong>${escapeHtml(topRule.rule.substring(0, 60))}</strong> (affecting ${topRule.percentage}% of issues).`);
  }
  
  if (criticalCount > 0) {
    findings.push(`There are <strong>${criticalCount} critical issues</strong> that may prevent users with disabilities from accessing key features.`);
  }
  
  if (seriousCount > 0) {
    findings.push(`<strong>${seriousCount} serious issues</strong> also affect readability and navigation for visually impaired and keyboard-only users.`);
  }
  
  if (analysis.crossUrlPatterns.length > 0) {
    const crossUrlCount = analysis.crossUrlPatterns.length;
    findings.push(`<strong>${crossUrlCount} patterns appear across multiple pages</strong>, suggesting architectural accessibility issues that need site-wide fixes.`);
  }
  
  // Recommendations
  const recommendations = [];
  if (analysis.systemicRules.length > 0) {
    recommendations.push(`Address the top accessibility rule violation: ${escapeHtml(analysis.systemicRules[0].rule.substring(0, 70))}`);
  }
  
  if (analysis.crossUrlPatterns.length > 0 && analysis.crossUrlPatterns[0].rules.length > 0) {
    recommendations.push(`Focus on cross-URL pattern fixes to resolve <strong>${analysis.crossUrlPatterns[0].totalOccurrences} issues</strong> at once`);
  }
  
  if (criticalCount > 0) {
    recommendations.push(`Prioritize <strong>critical issues</strong> affecting navigation and screen reader compatibility`);
  }
  
  recommendations.push(`Immediate remediation is recommended for high-impact components`);
  
  const findingsHtml = findings.map(f => `<li>${f}</li>`).join('');
  const recommendationsHtml = recommendations.slice(0, 3).map(r => `<li>${r}</li>`).join('');
  
  return `
    <div class="executive-summary">
      <div class="executive-header">
        <h2>📋 AI Executive Summary</h2>
        <span class="urgency-badge" style="background-color: ${urgencyColor}; color: white;">${urgency}</span>
      </div>
      
      <div class="summary-content">
        <div class="summary-section">
          <h3>Key Findings</h3>
          <ul class="findings-list">
            ${findingsHtml}
          </ul>
        </div>
        
        <div class="summary-section">
          <h3>Recommended Actions</h3>
          <ul class="recommendations-list">
            ${recommendationsHtml}
          </ul>
        </div>
        
        <div class="summary-metrics">
          <div class="metric-item">
            <span class="metric-label">Total Issues</span>
            <span class="metric-value">${totalIssues}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Affected Pages</span>
            <span class="metric-value">${analysis.systemicSummary.affectedUrls}</span>
          </div>
          <div class="metric-item critical">
            <span class="metric-label">Critical</span>
            <span class="metric-value">${criticalCount}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Serious</span>
            <span class="metric-value">${seriousCount}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Moderate</span>
            <span class="metric-value">${moderateCount}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Minor</span>
            <span class="metric-value">${minorCount}</span>
          </div>
        </div>
      </div>
      
      <style>
        .executive-summary {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          border-left: 5px solid #667eea;
          padding: 30px;
          margin: 30px 40px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
        }
        
        .executive-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #667eea;
        }
        
        .executive-header h2 {
          color: #333;
          margin: 0;
          font-size: 1.6em;
        }
        
        .urgency-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9em;
        }
        
        .summary-content {
          margin-bottom: 20px;
        }
        
        .summary-section {
          margin-bottom: 25px;
        }
        
        .summary-section h3 {
          color: #667eea;
          font-size: 1.1em;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .findings-list,
        .recommendations-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .findings-list li,
        .recommendations-list li {
          color: #555;
          line-height: 1.8;
          margin-bottom: 10px;
          padding-left: 24px;
          position: relative;
        }
        
        .findings-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
        }
        
        .recommendations-list li:before {
          content: "→";
          position: absolute;
          left: 0;
          color: #764ba2;
          font-weight: bold;
        }
        
        .summary-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 15px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        
        .metric-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border-left: 4px solid #667eea;
        }
        
        .metric-item.critical {
          border-left-color: #dc3545;
        }
        
        .metric-label {
          display: block;
          color: #666;
          font-size: 0.85em;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .metric-value {
          display: block;
          color: #333;
          font-size: 1.8em;
          font-weight: 700;
        }
        
        @media print {
          .executive-summary {
            page-break-inside: avoid;
            box-shadow: none;
            border: 1px solid #667eea;
          }
        }
      </style>
    </div>
  `;
}

/**
 * Read issues from CSV file
 */
export function readIssuesFromCSV(csvPath) {
  try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true
    });
    return records;
  } catch (err) {
    // Fallback: return empty array on parse/read error
    console.error('Error reading/parsing CSV:', err && err.message ? err.message : err);
    return [];
  }
}
