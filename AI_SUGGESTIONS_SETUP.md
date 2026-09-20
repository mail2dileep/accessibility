# AI Accessibility Fix Suggestions - Setup Guide

## Overview
This feature adds AI-powered fix suggestions to each accessibility issue using OpenAI. Users can generate intelligent, context-aware recommendations for fixing each accessibility violation.

## Installation Steps

### 1. Install Dependencies
The OpenAI SDK is used. If needed, run:
```bash
npm install openai
```

### 2. Set API Key
You need to set your OpenAI API key as an environment variable:

#### On Windows (PowerShell):
```powershell
$env:OPENAI_API_KEY = "your-api-key-here"
```

#### On Windows (Command Prompt):
```cmd
set ANTHROPIC_API_KEY=your-api-key-here
```

#### On Windows (Persistent):
1. Open Environment Variables (search for "Environment Variables")
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Click "New" under System variables
5. Variable name: `ANTHROPIC_API_KEY`
6. Variable value: `your-actual-api-key`
7. Click OK and restart your terminal

#### On macOS/Linux:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 3. Get Your API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
1. Visit [OpenAI](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to "API Keys"
4. Create a new API key
5. Copy and save it securely

## Files Modified/Added

### New Files:
- **`aiSuggestions.js`** - Main AI suggestions service module
  - `generateSuggestion(issue)` - Generate suggestion for single issue
  - `generateSuggestionWithCache(issue)` - Generate with caching
  - `generateSuggestionsForIssues(issues)` - Batch generation

### Modified Files:

1. **`server.js`**
   - Added import for `aiSuggestions.js`
   - Added `/generate-suggestion` endpoint - Generate single suggestion
   - Added `/generate-suggestions` endpoint - Batch generate suggestions
   - Updated `/slice-details` endpoint - Include HTML Element, DOM Element, Messages

2. **`src/DetailsTable.tsx`**
   - Complete redesign to display issues in expandable cards
   - Added suggestion generation UI with loading states
   - Displays suggestions with syntax highlighting
   - Shows impact level with color coding

## Usage

### In the UI:
1. Run your accessibility scan or load existing results
2. Click on any issue to expand it
3. You'll see "AI Fix Suggestion" section with a lightbulb icon
4. Click the sparkle icon to generate an AI suggestion
5. The suggestion will appear with actionable fix steps

### For Developers:

#### Generate suggestion for single issue:
```javascript
import { generateSuggestionWithCache } from './aiSuggestions.js';

const issue = {
  Rule: "Heading levels should only increase by one",
  'Violation description': "Ensure the order of headings is semantically correct",
  'Violation Type': "heading-order",
  Impact: "moderate",
  'HTML Element': "<h4>Title</h4>",
  'DOM Element': ".selector > h4"
};

const suggestion = await generateSuggestionWithCache(issue);
console.log(suggestion);
```

#### Via API:
```javascript
const response = await fetch('http://localhost:3000/generate-suggestion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ issue: issueObject })
});

const data = await response.json();
console.log(data.suggestion);
```

## Features

### 1. Smart Caching
- Suggestions are cached by Rule + Violation Type
- Prevents duplicate API calls for similar issues
- Reduces costs and improves performance

### 2. Batch Processing
- Generate suggestions for multiple issues at once
- Useful for generating reports

### 3. Error Handling
- Graceful fallbacks if API fails
- User-friendly error messages

### 4. Performance Optimizations
- Async/await for non-blocking operations
- Lazy loading - suggestions generated on demand
- Cache prevents redundant API calls

## AI Suggestion Content

Each suggestion includes:
1. **Explanation** - Why the issue is an accessibility problem
2. **Specific Fix** - Exact steps to resolve the issue
3. **Code Example** - Sample implementation when applicable

### Example:
```
Explanation: Heading order is important for screen reader users who rely on heading 
hierarchy to navigate pages.

Specific Fix: Change the <h4> to an <h3> OR restructure the heading levels so they 
follow a logical sequence without skipping levels.

Example Code:
<!-- Before -->
<h2>Main Title</h2>
<h4>Subtitle</h4>  <!-- Invalid: skips h3 -->

<!-- After -->
<h2>Main Title</h2>
<h3>Subtitle</h3>  <!-- Valid: correct sequence -->
```

## API Endpoints

### POST /generate-suggestion
Generate AI suggestion for a single issue.

**Request:**
```json
{
  "issue": {
    "Rule": "...",
    "Violation description": "...",
    "Violation Type": "...",
    "Impact": "...",
    "HTML Element": "...",
    "DOM Element": "..."
  }
}
```

**Response:**
```json
{
  "suggestion": "AI-generated fix suggestion text..."
}
```

### POST /generate-suggestions
Generate suggestions for multiple issues (batch processing).

**Request:**
```json
{
  "issues": [
    { "Rule": "...", ... },
    { "Rule": "...", ... }
  ]
}
```

**Response:**
```json
{
  "suggestions": [
    { ...issue1, "AI Suggestion": "..." },
    { ...issue2, "AI Suggestion": "..." }
  ]
}
```

## Troubleshooting

### "Error: API key not found"
- Ensure `OPENAI_API_KEY` environment variable is set
- Restart your terminal after setting the variable
- Check that the API key is valid

### Suggestions are slow to generate
- This is normal - first request takes ~2-3 seconds
- Subsequent similar issues use cache - much faster
- Consider batch generating suggestions when possible

### "Unable to generate suggestion" error
- Check your API key validity
- Check your account has available credits
- Check internet connection
- View server logs for more details

## Future Enhancements

Potential improvements:
1. Generate suggestions for all issues at once
2. Store suggestions in CSV for reporting
3. Categorize suggestions by difficulty level
4. Suggest best practices beyond fixes
5. Track which suggestions were implemented
6. Integration with GitHub/GitLab for auto-fixes

## Costs
- OpenAI API usage is billed per model and usage
- Each suggestion typically uses 200-300 tokens
- Visit [OpenAI Pricing](https://openai.com/pricing) for current rates

## Support
For issues with:
- **OpenAI**: https://platform.openai.com/docs
- **Project Code**: Check server logs and browser console for errors
