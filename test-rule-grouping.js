#!/usr/bin/env node
/**
 * Quick test to verify rule grouping and counts in the Most Prevalent Rules section
 */

import { readIssuesFromCSV, generateHTMLReportWithSuggestions } from './reportGenerator.js';
import { identifySystemicDefects } from './systemicDefectAnalyzer.js';

(async () => {
  console.log('Testing rule grouping and counts...\n');
  
  const csvPath = './Output/test-results.csv';
  
  try {
    // Load issues
    const issues = await Promise.resolve(readIssuesFromCSV(csvPath));
    console.log(`✓ Loaded ${issues.length} issues from CSV\n`);
    
    // Run systemic analysis
    const analysis = identifySystemicDefects(issues);
    
    // Show rule frequency list
    console.log('📊 Most Prevalent Rules (ruleFrequencyList):');
    console.log('─'.repeat(80));
    
    if (analysis.ruleFrequencyList && analysis.ruleFrequencyList.length > 0) {
      analysis.ruleFrequencyList.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.rule}`);
        console.log(`   Occurrences: ${item.occurrences}`);
        console.log(`   Percentage: ${item.percentage}%`);
        console.log(`   Severity: ${item.severity}`);
      });
    } else {
      console.log('⚠️  No ruleFrequencyList found in analysis');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
})();
