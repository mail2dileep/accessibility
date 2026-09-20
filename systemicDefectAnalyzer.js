/**
 * Systemic Defect Analyzer
 * Clusters repeated DOM patterns, detects shared components, and identifies systemic defects
 */

/**
 * Extract pattern from HTML element or DOM selector
 * Groups similar selectors by class/ID patterns
 * @param {string} selector - DOM selector or HTML element
 * @returns {string} Normalized pattern
 */
function extractPattern(selector) {
  if (!selector) return 'unknown';
  
  // Extract class patterns (e.g., "header__nav-item" from full selector)
  const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);
  if (classMatch) {
    const classPattern = classMatch[1];
    // Normalize by removing variant suffixes (e.g., "btn--primary" -> "btn")
    return classPattern.split('--')[0].split('_')[0];
  }
  
  // Extract ID patterns
  const idMatch = selector.match(/#([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `id:${idMatch[1].split('-')[0]}`;
  }
  
  // Extract tag-based patterns
  const tagMatch = selector.match(/^([a-z]+)/);
  if (tagMatch) {
    return `tag:${tagMatch[1]}`;
  }
  
  return 'unknown';
}

/**
 * Normalize ARIA attributes and role patterns
 * @param {string} htmlElement - HTML element string
 * @returns {string} Normalized ARIA pattern
 */
function extractAriaPattern(htmlElement) {
  if (!htmlElement) return null;
  
  const ariaMatch = htmlElement.match(/aria-([a-z-]+)(?:="([^"]+)")?/g);
  if (ariaMatch) {
    return ariaMatch.map(attr => attr.split('=')[0]).join(', ');
  }
  
  const roleMatch = htmlElement.match(/role="([^"]+)"/);
  if (roleMatch) {
    return `role:${roleMatch[1]}`;
  }
  
  return null;
}

/**
 * Cluster issues by repeated DOM patterns
 * Groups similar selectors/components
 * @param {Array} issues - Array of accessibility issues
 * @returns {Object} Clustered patterns with count
 */
export function clusterDOMPatterns(issues) {
  const patterns = {};
  
  issues.forEach(issue => {
    const domSelector = issue['DOM Element'] || '';
    const pattern = extractPattern(domSelector);
    
    if (!patterns[pattern]) {
      patterns[pattern] = {
        count: 0,
        examples: [],
        rules: new Set(),
        violationTypes: new Set(),
        impacts: []
      };
    }
    
    patterns[pattern].count++;
    patterns[pattern].impacts.push(issue.Impact);
    patterns[pattern].rules.add(issue.Rule);
    patterns[pattern].violationTypes.add(issue['Violation Type']);
    
    if (patterns[pattern].examples.length < 3) {
      patterns[pattern].examples.push({
        selector: domSelector,
        rule: issue.Rule,
        url: issue.URL
      });
    }
  });
  
  // Convert Sets to Arrays and sort by frequency
  const clustered = Object.entries(patterns).map(([pattern, data]) => ({
    pattern,
    count: data.count,
    examples: data.examples,
    rules: Array.from(data.rules),
    violationTypes: Array.from(data.violationTypes),
    maxImpact: getMaxImpact(data.impacts),
    severity: data.count > 5 ? 'high' : data.count > 2 ? 'medium' : 'low'
  }));
  
  return clustered.sort((a, b) => b.count - a.count);
}

/**
 * Detect shared components with repeated issues
 * Identifies components that have multiple accessibility defects
 * @param {Array} issues - Array of accessibility issues
 * @returns {Array} Shared components with their issues
 */
export function detectSharedComponents(issues) {
  const components = {};
  
  issues.forEach(issue => {
    const htmlElement = issue['HTML Element'] || '';
    // Extract component signature (tag + key classes)
    const tagMatch = htmlElement.match(/^<([a-z][a-z0-9]*)/i);
    const classMatch = htmlElement.match(/class="([^"]*)"/);
    
    const tag = tagMatch ? tagMatch[1].toLowerCase() : 'unknown';
    const classes = classMatch ? classMatch[1].split(' ').slice(0, 2).join('-') : 'no-class';
    const componentId = `${tag}.${classes}`;
    
    if (!components[componentId]) {
      components[componentId] = {
        tag,
        classes,
        issueCount: 0,
        issues: [],
        urls: new Set(),
        rules: new Set(),
        totalImpact: 0
      };
    }
    
    components[componentId].issueCount++;
    components[componentId].urls.add(issue.URL);
    components[componentId].rules.add(issue.Rule);
    components[componentId].totalImpact += getImpactScore(issue.Impact);
    
    components[componentId].issues.push({
      rule: issue.Rule,
      violation: issue['Violation Type'],
      impact: issue.Impact,
      description: issue['Violation description']
    });
  });
  
  // Filter to components with multiple issues
  const sharedComponents = Object.entries(components)
    .filter(([_, comp]) => comp.issueCount > 1 || comp.urls.size > 1)
    .map(([componentId, data]) => ({
      componentId,
      tag: data.tag,
      classes: data.classes,
      issueCount: data.issueCount,
      urlsAffected: Array.from(data.urls).length,
      uniqueRules: Array.from(data.rules).length,
      averageImpact: (data.totalImpact / data.issueCount).toFixed(1),
      issues: data.issues.slice(0, 5),
      isSystemic: data.urls.size > 1 // Appears on multiple URLs
    }));
  
  return sharedComponents.sort((a, b) => b.issueCount - a.issueCount);
}

/**
 * Identify systemic defects - issues that repeat across multiple pages/elements
 * @param {Array} issues - Array of accessibility issues
 * @returns {Object} Systemic defects analysis
 */
export function identifySystemicDefects(issues) {
  const ruleFrequency = {};
  const violationTypeFrequency = {};
  const urlIssueMap = {};
  const elementIssueMap = {};
  
  issues.forEach(issue => {
    const rule = issue.Rule || 'unknown';
    const violationType = issue['Violation Type'] || 'unknown';
    const url = issue.URL || 'unknown';
    const element = issue['HTML Element'] || 'unknown';
    
    // Track rules across issues
    ruleFrequency[rule] = (ruleFrequency[rule] || 0) + 1;
    violationTypeFrequency[violationType] = (violationTypeFrequency[violationType] || 0) + 1;
    
    // Track issues per URL
    if (!urlIssueMap[url]) {
      urlIssueMap[url] = { count: 0, rules: new Set(), impacts: [] };
    }
    urlIssueMap[url].count++;
    urlIssueMap[url].rules.add(rule);
    urlIssueMap[url].impacts.push(issue.Impact);
    
    // Track issues per element pattern
    const pattern = extractPattern(element);
    if (!elementIssueMap[pattern]) {
      elementIssueMap[pattern] = { count: 0, rules: new Set(), urls: new Set() };
    }
    elementIssueMap[pattern].count++;
    elementIssueMap[pattern].rules.add(rule);
    elementIssueMap[pattern].urls.add(url);
  });
  
  // Identify systemic rules (appear in >30% of issues or >5 times)
  const totalIssues = issues.length;
  const systemicRules = Object.entries(ruleFrequency)
    .filter(([_, count]) => count > Math.max(5, totalIssues * 0.3))
    .map(([rule, count]) => ({
      rule,
      occurrences: count,
      percentage: ((count / totalIssues) * 100).toFixed(1),
      severity: count > totalIssues * 0.5 ? 'critical' : 'high'
    }))
    .sort((a, b) => b.occurrences - a.occurrences);

  // Full rule frequency list (no filtering) for reporting/grouping
  const ruleFrequencyList = Object.entries(ruleFrequency)
    .map(([rule, count]) => ({
      rule,
      occurrences: count,
      percentage: ((count / totalIssues) * 100).toFixed(1),
      severity: count > totalIssues * 0.5 ? 'critical' : count > totalIssues * 0.2 ? 'high' : 'medium'
    }))
    .sort((a, b) => b.occurrences - a.occurrences);
  
  // Identify systemic violation types
  const systemicViolationTypes = Object.entries(violationTypeFrequency)
    .filter(([_, count]) => count > 3)
    .map(([type, count]) => ({
      type,
      occurrences: count,
      percentage: ((count / totalIssues) * 100).toFixed(1)
    }))
    .sort((a, b) => b.occurrences - a.occurrences);
  
  // Identify problematic URLs
  const problematicUrls = Object.entries(urlIssueMap)
    .map(([url, data]) => ({
      url,
      totalIssues: data.count,
      uniqueRules: data.rules.size,
      criticalIssues: data.impacts.filter(i => i === 'critical').length,
      maxImpact: getMaxImpact(data.impacts)
    }))
    .sort((a, b) => b.totalIssues - a.totalIssues);
  
  // Identify element patterns with cross-URL impact
  const crossUrlPatterns = Object.entries(elementIssueMap)
    .filter(([_, data]) => data.urls.size > 1)
    .map(([pattern, data]) => ({
      pattern,
      totalOccurrences: data.count,
      urlsAffected: data.urls.size,
      uniqueRules: data.rules.size,
      rules: Array.from(data.rules)
    }))
    .sort((a, b) => b.urlsAffected - a.urlsAffected || b.totalOccurrences - a.totalOccurrences);
  
  return {
    totalIssuesAnalyzed: totalIssues,
    systemicRules,
    ruleFrequencyList,
    systemicViolationTypes,
    problematicUrls,
    crossUrlPatterns,
    systemicSummary: {
      topConcern: systemicRules[0] ? systemicRules[0].rule : 'N/A',
      prevalence: systemicRules[0] ? `${systemicRules[0].percentage}% of all issues` : 'N/A',
      affectedUrls: new Set(issues.map(i => i.URL)).size,
      criticalCount: issues.filter(i => i.Impact === 'critical').length,
      seriesCount: issues.filter(i => i.Impact === 'serious').length
    }
  };
}

/**
 * Generate systemic defect report HTML section
 * @param {Object} analysis - Result from identifySystemicDefects
 * @returns {string} HTML content for systemic analysis
 */
export function generateSystemicAnalysisHTML(analysis) {
  const html = `
    <div class="systemic-analysis">
      <h2>🔍 Systemic Defect Analysis</h2>
      
      <div class="analysis-summary">
        <div class="summary-card critical">
          <h3>${analysis.systemicSummary.topConcern}</h3>
          <p>${analysis.systemicSummary.prevalence}</p>
        </div>
        <div class="summary-card">
          <h3>${analysis.systemicSummary.affectedUrls} URLs</h3>
          <p>Contain systemic issues</p>
        </div>
        <div class="summary-card">
          <h3>${analysis.systemicSummary.criticalCount}</h3>
          <p>Critical systemic issues</p>
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
            ${analysis.systemicRules.slice(0, 5).map(item => `
              <tr>
                <td>${escapeHtml(item.rule)}</td>
                <td>${item.occurrences}</td>
                <td>${item.percentage}%</td>
                <td><span class="severity-${item.severity}">${item.severity.toUpperCase()}</span></td>
              </tr>
            `).join('')}
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
            ${analysis.problematicUrls.slice(0, 5).map(item => `
              <tr>
                <td><code>${escapeHtml(item.url)}</code></td>
                <td>${item.totalIssues}</td>
                <td>${item.uniqueRules}</td>
                <td>${item.criticalIssues}</td>
                <td><span class="impact-${item.maxImpact.toLowerCase()}">${item.maxImpact}</span></td>
              </tr>
            `).join('')}
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
            ${analysis.crossUrlPatterns.slice(0, 5).map(item => `
              <tr>
                <td><code>${escapeHtml(item.pattern)}</code></td>
                <td>${item.totalOccurrences}</td>
                <td>${item.urlsAffected}</td>
                <td>${item.rules.slice(0, 2).map(r => `<span class="rule-badge">${escapeHtml(r)}</span>`).join('')}</td>
              </tr>
            `).join('')}
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

        .impact-critical {
          color: #dc3545;
          font-weight: 600;
        }

        .impact-serious {
          color: #fd7e14;
          font-weight: 600;
        }

        .impact-moderate {
          color: #ffc107;
          font-weight: 600;
        }

        .impact-minor {
          color: #17a2b8;
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

        code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
        }
      </style>
    </div>
  `;

  return html;
}

/**
 * Helper function to get impact score for sorting
 * @param {string} impact - Impact level
 * @returns {number} Score for comparison
 */
function getImpactScore(impact) {
  const scores = {
    'critical': 4,
    'serious': 3,
    'moderate': 2,
    'minor': 1
  };
  return scores[impact?.toLowerCase()] || 0;
}

/**
 * Helper function to get maximum impact from array
 * @param {Array} impacts - Array of impact levels
 * @returns {string} Maximum impact
 */
function getMaxImpact(impacts) {
  const levels = ['critical', 'serious', 'moderate', 'minor'];
  for (const level of levels) {
    if (impacts.includes(level)) return level;
  }
  return 'minor';
}

/**
 * Helper function to escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export all analysis functions
export default {
  clusterDOMPatterns,
  detectSharedComponents,
  identifySystemicDefects,
  generateSystemicAnalysisHTML
};
