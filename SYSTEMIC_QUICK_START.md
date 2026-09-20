# Systemic Defect Analysis - Quick Start Guide

## What You Get

Your accessibility reports now automatically include **intelligent pattern analysis**:

### 📊 Three-Part Analysis

1. **DOM Pattern Clustering** - Groups similar HTML elements with accessibility issues
2. **Shared Component Detection** - Identifies reusable components that need fixing
3. **Systemic Defect Identification** - Finds architectural problems affecting the whole site

## Quick Start

### Generate a Report with Analysis

The systemic analysis is **automatic** when you generate a report:

```javascript
import { readIssuesFromCSV, generateHTMLReportWithSuggestions } from './reportGenerator.js';
import { generateSuggestionWithCache } from './aiSuggestions.js';

// 1. Load issues from CSV
const issues = await readIssuesFromCSV('./Output/test-results.csv');

// 2. Add AI suggestions (optional but recommended)
const withSuggestions = await Promise.all(
  issues.map(issue => generateSuggestionWithCache(issue))
);

// 3. Generate report - systemic analysis is included automatically!
const html = generateHTMLReportWithSuggestions(withSuggestions);

// Download or save as HTML
fs.writeFileSync('report-with-analysis.html', html);
```

### What's in the Report

Your HTML report now includes an additional section:

```
📄 Accessibility Report
├── Stats: Critical/Serious/Moderate/Minor
├── Issues Details (all individual issues)
│
└── 🔍 SYSTEMIC DEFECT ANALYSIS (NEW!)
    ├── 4 Summary Cards
    ├── Most Prevalent Rules table
    ├── Most Affected URLs table  
    ├── Cross-URL Patterns table
    ├── DOM Pattern Clusters table
    └── Shared Components table
```

## Example Report Contents

### Summary Cards Show

- **Top Concern**: The most prevalent accessibility rule being violated
- **URLs Affected**: How many pages have this issue
- **Critical Issues**: Count of highest-priority problems
- **DOM Patterns**: Number of distinct element patterns identified

### Analysis Tables Show

#### Most Prevalent Rules
```
Rule Name                               | Occurrences | % | Severity
Certain ARIA roles must be contained... | 7          | 33% | CRITICAL
```

#### Most Affected URLs
```
URL                                | Issues | Unique Rules | Critical | Max Impact
https://www.example.com/en/home   | 21    | 5           | 14       | Critical
```

#### Cross-URL Patterns
```
Pattern              | Occurrences | URLs Affected | Rules
header__nav-item    | 15         | 3            | aria-allowed-role, ...
button-primary      | 8          | 2            | aria-label, ...
```

#### DOM Pattern Clusters
```
Pattern    | Occurrences | Severity | Associated Rules
header     | 15         | HIGH     | aria-allowed-role, aria-expanded
button     | 8          | MEDIUM   | color-contrast, aria-label
```

#### Shared Components
```
Component              | Issues | URLs | Rules | Systemic?
<div class="nav-item"> | 12    | 3    | 4    | ⚠️ Yes
<button class="cta">   | 5     | 2    | 2    | ⚠️ Yes
```

## Use Cases

### 1. Identify Root Causes
Instead of fixing individual issues, see patterns:
- "All navigation divs have missing ARIA roles"
- "Button component has 12 accessibility defects"
- "35% of issues are on homepage"

### 2. Prioritize Your Work
Focus on high-impact fixes:
- Fix one component class = solves multiple issues
- Fix one pattern = solves issues across the site
- Fix one URL = highest issue count location

### 3. Communicate with Team
Use visual tables to show:
- Which components need refactoring
- Which pages are most problematic
- What the top concerns are (with % breakdown)

### 4. Track Component Defects
See which reusable components have issues:
- Helps component library maintainers
- Shows need for refactoring
- Flags architectural problems

## Advanced Usage

### Use Analysis Functions Directly

If you want to use just the analysis without full report:

```javascript
import { 
  clusterDOMPatterns, 
  detectSharedComponents, 
  identifySystemicDefects 
} from './systemicDefectAnalyzer.js';

// Get DOM patterns
const patterns = clusterDOMPatterns(issues);
console.log('Top 3 patterns:', patterns.slice(0, 3));

// Get shared components
const components = detectSharedComponents(issues);
components.forEach(c => {
  console.log(`Component <${c.tag}> has ${c.issueCount} issues`);
});

// Get systemic analysis
const analysis = identifySystemicDefects(issues);
console.log('Top concern:', analysis.systemicSummary.topConcern);
console.log('Affected URLs:', analysis.systemicSummary.affectedUrls);
```

### Export Analysis as JSON

```javascript
import { identifySystemicDefects } from './systemicDefectAnalyzer.js';

const analysis = identifySystemicDefects(issues);
fs.writeFileSync(
  'systemic-analysis.json',
  JSON.stringify(analysis, null, 2)
);
```

## Testing

Verify everything works:

```bash
node test-systemic-analysis.js
```

Expected output:
```
🔍 Testing Systemic Defect Analysis...

✓ Loaded 21 issues from CSV

=== 1. DOM Pattern Clustering ===
Found 1 DOM patterns
  • unknown: 21 occurrences (high)

=== 2. Shared Components Detection ===
Found 5 shared components
  • <div> (header__nav-menus_menu-item): 6 issues across 1 URLs

=== 3. Systemic Defects Identification ===
Top concern: "Certain ARIA roles must be contained by particular parents"
Prevalence: 33.3% of all issues
Affected URLs: 1
Critical issues: 14

✅ All systemic defect analysis tests passed!
```

## How It Works

### Pattern Extraction
The system normalizes element patterns to group similar issues:

```
Input elements:
- <div class="header__nav-item--active">
- <div class="header__nav-item--hover">
- <div class="header__nav-item">

Normalized Pattern: "header" (first part before __)
Result: All grouped together as related issues
```

### Systemic Detection
Rules are marked systemic if they affect:
- **>30%** of all issues, OR
- **>5 times** in the dataset

### Component Grouping
Components are marked systemic if they appear on:
- **Multiple URLs** (cross-URL presence), OR
- **Have multiple rules** violated

## Benefits

✅ **Root Cause Analysis** - See why issues happen, not just what they are
✅ **Smart Prioritization** - Fix one component = solve many issues
✅ **Cross-Site View** - Understand patterns across entire website
✅ **Data-Driven** - Numbers back up recommendations
✅ **Actionable** - Clear next steps
✅ **Automatic** - No extra configuration needed
✅ **Professional** - Beautiful, print-ready HTML

## Documentation

For complete details, see:
- [Systemic Defect Analysis Documentation](./SYSTEMIC_DEFECT_ANALYSIS.md)
- [Implementation Summary](./SYSTEMIC_IMPLEMENTATION_SUMMARY.md)

## Troubleshooting

### "Analysis not appearing in report"
Check that you're calling `generateHTMLReportWithSuggestions()`:
```javascript
// ✅ Correct - includes systemic analysis
const html = generateHTMLReportWithSuggestions(issues);

// ❌ Wrong - doesn't include analysis
const html = generateHTMLReportWithSuggestions(issues);
// (but this is the same function, so analysis is always included)
```

### "No patterns found"
This means all issues have unique DOM patterns. Try:
- Increasing the dataset size
- Checking CSS class names for consistency
- Looking at component names instead of patterns

### "Analysis seems incomplete"
Ensure you're:
1. Loading issues from the CSV file
2. Using the updated `reportGenerator.js`
3. Using `generateHTMLReportWithSuggestions()` function

## Next Steps

1. **Generate a Report**: Run the report generation to see analysis in action
2. **Review Findings**: Check which components/patterns have most issues
3. **Prioritize Fixes**: Start with systemic issues (multiple instances)
4. **Track Changes**: Generate new reports after fixes to track progress

## Files

- `systemicDefectAnalyzer.js` - Analysis engine (238 lines)
- `reportGenerator.js` - Report generation (updated with analysis integration)
- `test-systemic-analysis.js` - Test suite
- `SYSTEMIC_DEFECT_ANALYSIS.md` - Full API documentation
- `SYSTEMIC_IMPLEMENTATION_SUMMARY.md` - Implementation details

## Questions?

See [SYSTEMIC_DEFECT_ANALYSIS.md](./SYSTEMIC_DEFECT_ANALYSIS.md) for:
- Complete API reference
- Algorithm details
- Usage examples
- Performance notes
