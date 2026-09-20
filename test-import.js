try {
  console.log('Attempting to import aiSuggestions...');
  const { generateSuggestionWithCache } = await import('./aiSuggestions.js');
  console.log('SUCCESS: aiSuggestions imported');
} catch (err) {
  console.error('IMPORT ERROR:', err.message);
  console.error(err.stack);
}
