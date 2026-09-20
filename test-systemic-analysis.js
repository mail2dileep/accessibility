import { 
  clusterDOMPatterns, 
  detectSharedComponents, 
  identifySystemicDefects 
} from './systemicDefectAnalyzer.js';
import { readIssuesFromCSV } from './reportGenerator.js';

console.log('🔍 Testing Systemic Defect Analysis...\n');

const csvPath = './Output/test-results.csv';

try {
  const issues = await readIssuesFromCSV(csvPath);
  console.log(`✓ Loaded ${issues.length} issues from CSV\n`);

  // Test 1: Cluster DOM Patterns
  console.log('=== 1. DOM Pattern Clustering ===');
  const patterns = clusterDOMPatterns(issues);
  console.log(`Found ${patterns.length} DOM patterns`);
  patterns.slice(0, 3).forEach(p => {
    console.log(`  • ${p.pattern}: ${p.count} occurrences (${p.severity})`);
  });

  // Test 2: Detect Shared Components
  console.log('\n=== 2. Shared Components Detection ===');
  const components = detectSharedComponents(issues);
  console.log(`Found ${components.length} shared components`);
  components.slice(0, 3).forEach(c => {
    console.log(`  • <${c.tag}> (${c.classes}): ${c.issueCount} issues across ${c.urlsAffected} URLs`);
  });

  // Test 3: Identify Systemic Defects
  console.log('\n=== 3. Systemic Defects Identification ===');
  const analysis = identifySystemicDefects(issues);
  console.log(`Top concern: "${analysis.systemicSummary.topConcern}"`);
  console.log(`Prevalence: ${analysis.systemicSummary.prevalence}`);
  console.log(`Affected URLs: ${analysis.systemicSummary.affectedUrls}`);
  console.log(`Critical issues: ${analysis.systemicSummary.criticalCount}`);
  
  console.log('\nTop 3 systemic rules:');
  analysis.systemicRules.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i+1}. ${r.rule}: ${r.occurrences} occurrences (${r.percentage}%)`);
  });

  console.log('\nTop 3 problematic URLs:');
  analysis.problematicUrls.slice(0, 3).forEach((url, i) => {
    console.log(`  ${i+1}. ${url.url}: ${url.totalIssues} issues, ${url.criticalIssues} critical`);
  });

  console.log('\n✅ All systemic defect analysis tests passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
}
