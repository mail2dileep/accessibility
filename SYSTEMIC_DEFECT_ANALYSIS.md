# Systemic Defect Analysis - Feature Documentation

## Overview

The **Systemic Defect Analyzer** enhances accessibility reports with intelligent pattern detection and cross-URL analysis. It identifies:

1. **Clustered DOM Patterns** - Groups similar HTML elements/selectors showing repeated structural issues
2. **Shared Components** - Detects components appearing across multiple pages with accessibility defects
3. **Systemic Defects** - Finds issues that repeat across the entire website, indicating architectural problems

## Features

### 1. DOM Pattern Clustering

**Purpose**: Groups accessibility issues by similar DOM patterns to identify structural problems.

**Output includes**:
- Pattern name (extracted from class/ID/tag)
- Number of occurrences
- Associated rules and violation types
- Maximum impact level
- Severity classification (low/medium/high)
- Example selectors and URLs

**Example**:
```
Pattern: "header__nav-item"
- Occurrences: 15
- Severity: High
- Associated Rules: aria-allowed-role, aria-allowed-attr
- Max Impact: Critical
```

### 2. Shared Components Detection

**Purpose**: Identifies components that have multiple accessibility defects, especially across different pages.

**Identifies**:
- HTML tag type
- Component classes
- Total issues in component
- URLs where component appears
- Unique accessibility rules violated
- Cross-URL prevalence (systemic indicator)

**Example**:
```
Component: <div class="header__nav-item">
- Total Issues: 12
- URLs Affected: 3
- Systemic: Yes (appears on multiple URLs)
- Associated Rules: 4 unique rules
```

### 3. Systemic Defect Identification

**Purpose**: Finds architectural-level accessibility problems that repeat across the site.

**Analysis includes**:
- **Most Prevalent Rules**: Rules that violate >30% of issues or appear >5 times
- **Problematic URLs**: Pages with highest issue counts and critical issues
- **Cross-URL Patterns**: DOM patterns appearing on multiple pages
- **Summary Metrics**:
  - Top concern and its prevalence
  - Total URLs affected
  - Critical issue count
  - Serious issue count

**Example**:
```
Systemic Summary:
- Top Concern: "ARIA role should be appropriate for the element"
- Prevalence: 45% of all issues
- Affected URLs: 8 out of 10
- Critical Issues: 23
```

## Integration with HTML Reports

The systemic analysis automatically appears in generated reports with:

1. **Summary Cards**: Quick overview of top concerns, affected URLs, critical counts
2. **Most Prevalent Rules Table**: Top accessibility rules that are violated
3. **Most Affected URLs Table**: Pages ranked by issue count and severity
4. **Cross-URL Patterns Table**: DOM patterns appearing across multiple pages
5. **DOM Pattern Clusters Table**: Grouped selector patterns and their impact
6. **Shared Components Table**: Reusable components with accessibility defects

### Visual Elements

- **Color-coded severity**: Critical (red) → High (yellow) → Medium (blue) → Low (gray)
- **Impact badges**: Visual indicators of issue severity
- **Component type**: HTML tag icons for quick identification
- **Systemic indicators**: ⚠️ marks for cross-URL issues

## API Usage

### 1. Cluster DOM Patterns

```javascript
import { clusterDOMPatterns } from './systemicDefectAnalyzer.js';

const patterns = clusterDOMPatterns(issues);
// Returns: Array of pattern objects sorted by frequency

// Each pattern object contains:
// {
//   pattern: string,           // Normalized pattern name
//   count: number,             // Occurrences
//   examples: Array,           // Example selectors and rules
//   rules: Array,              // Associated rules
//   violationTypes: Array,     // Associated violation types
//   maxImpact: string,         // Highest impact level
//   severity: string           // 'high' | 'medium' | 'low'
// }
```

### 2. Detect Shared Components

```javascript
import { detectSharedComponents } from './systemicDefectAnalyzer.js';

const components = detectSharedComponents(issues);
// Returns: Array of component objects sorted by issue count

// Each component object contains:
// {
//   componentId: string,       // Unique component identifier
//   tag: string,               // HTML tag
//   classes: string,           // Component classes
//   issueCount: number,        // Total issues
//   urlsAffected: number,      // Number of URLs with this component
//   uniqueRules: number,       // Different rules violated
//   averageImpact: string,     // Average impact score
//   issues: Array,             // Detailed issues
//   isSystemic: boolean        // Appears on multiple URLs
// }
```

### 3. Identify Systemic Defects

```javascript
import { identifySystemicDefects } from './systemicDefectAnalyzer.js';

const analysis = identifySystemicDefects(issues);
// Returns: Analysis object with comprehensive metrics

// Structure:
// {
//   totalIssuesAnalyzed: number,
//   systemicRules: Array,          // Rules in >30% of issues
//   systemicViolationTypes: Array, // Violation types >3 occurrences
//   problematicUrls: Array,        // URLs ranked by issues
//   crossUrlPatterns: Array,       // Patterns on multiple URLs
//   systemicSummary: {
//     topConcern: string,
//     prevalence: string,
//     affectedUrls: number,
//     criticalCount: number,
//     seriesCount: number
//   }
// }
```

## Algorithm Details

### Pattern Extraction

The analyzer normalizes DOM patterns to detect similar elements:

```javascript
// Input: <div class="header__nav-item--active">...</div>
// Pattern: "header" (from "header__nav-item" → "header")

// Input: <a id="btn-primary-submit">...</a>
// Pattern: "id:btn" (from "btn-primary" → "btn")

// Input: <button>...</button>
// Pattern: "tag:button"
```

### Systemic Rule Detection

Rules are considered systemic if they:
1. Appear in >30% of all issues, OR
2. Occur >5 times in the dataset

### Severity Levels

- **High**: Component/pattern has >5 occurrences
- **Medium**: Component/pattern has 2-5 occurrences  
- **Low**: Component/pattern has 1 occurrence

## Report Generation Integration

When generating reports with AI suggestions:

```javascript
import { generateHTMLReportWithSuggestions } from './reportGenerator.js';

// Systemic analysis is automatically performed:
const html = generateHTMLReportWithSuggestions(issuesWithSuggestions);
// Includes:
// 1. Detailed issue table
// 2. Systemic defect analysis section with:
//    - Summary cards
//    - Most prevalent rules
//    - Affected URLs ranking
//    - Cross-URL patterns
//    - DOM pattern clusters
//    - Shared components
```

## Implementation Notes

### Performance Considerations

- **Clustering**: O(n) where n = number of issues
- **Component Detection**: O(n) with Set-based deduplication
- **Systemic Analysis**: O(n + k) where k = unique elements

### Data Normalization

The analyzer normalizes:
- Class names (removes variants: `btn--primary` → `btn`)
- IDs (extracts prefix: `nav-item-1` → `nav-item`)
- HTML tags (lowercase)
- ARIA attributes and roles

### Cross-URL Detection

Components/patterns are marked as systemic when they appear on multiple URLs, indicating:
- Shared component libraries with defects
- Architectural patterns causing issues
- Site-wide accessibility problems

## Testing

Run the test suite:

```bash
node test-systemic-analysis.js
```

Expected output:
- ✓ DOM patterns identified
- ✓ Shared components detected
- ✓ Systemic defects analyzed
- ✓ Summary statistics generated

## Future Enhancements

Potential improvements:
1. **Trend Analysis**: Track pattern changes over time
2. **Smart Recommendations**: Suggest component refactoring
3. **Impact Scoring**: Weighted impact based on page traffic
4. **Remediation Tracking**: Monitor fix implementation
5. **Export Formats**: CSV, PDF, JSON export of analysis
6. **Component Library Integration**: Link to shared component code

## Files

- `systemicDefectAnalyzer.js` - Core analysis functions
- `reportGenerator.js` - HTML report generation (updated)
- `test-systemic-analysis.js` - Test suite

## Usage Example

```javascript
// Complete workflow
import { readIssuesFromCSV } from './reportGenerator.js';
import { generateHTMLReportWithSuggestions } from './reportGenerator.js';
import { generateSuggestionWithCache } from './aiSuggestions.js';

// 1. Read issues from scan
const issues = await readIssuesFromCSV('./Output/test-results.csv');

// 2. Generate AI suggestions (cached)
const issuesWithSuggestions = await Promise.all(
  issues.map(issue => generateSuggestionWithCache(issue))
);

// 3. Generate report (includes systemic analysis)
const html = generateHTMLReportWithSuggestions(issuesWithSuggestions);

// 4. HTML includes:
//    - Individual issue details
//    - AI suggestions for each issue
//    - Systemic defect analysis
//    - DOM pattern clustering
//    - Shared component detection
//    - Cross-URL pattern analysis
```

## Benefits

✅ **Identify Root Causes**: Find architectural problems causing multiple issues
✅ **Prioritize Fixes**: Focus on systemic issues for maximum impact
✅ **Component Analysis**: Understand which components have most defects
✅ **Cross-Site Insights**: See patterns across entire website
✅ **Data-Driven Decisions**: Backed by quantitative analysis
✅ **Actionable Insights**: Clear recommendations on what to fix first
