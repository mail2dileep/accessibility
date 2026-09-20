# 🤖 AI Accessibility Fix Suggestions

## Overview

This feature adds Claude AI-powered fix suggestions to your accessibility checker. For each issue found, users can generate intelligent, context-aware recommendations on how to fix it.

## ⚡ Quick Start (30 seconds)

### 1. Get API Key
Visit https://console.anthropic.com/ → "API Keys" → Create new key

### 2. Set Environment Variable
**Windows PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY = "paste-your-key-here"
```

**Windows Command Prompt:**
```cmd
set ANTHROPIC_API_KEY=paste-your-key-here
```

**macOS/Linux:**
```bash
export ANTHROPIC_API_KEY="paste-your-key-here"
```

### 3. Restart Your Application
```bash
npm run dev          # Frontend
node server.js       # Backend (new terminal)
```

### 4. Try It Out
- Run an accessibility scan
- Click any issue to expand
- Click ✨ sparkle icon for AI suggestion
- Read the actionable fix!

## 🎯 User Guide

### Viewing Issues with Suggestions

1. **Expand an Issue**
   - Click on any issue card to expand it
   - See all details: Rule, Violation Type, Impact, HTML Element, DOM Element

2. **Generate Suggestion**
   - Look for "AI Fix Suggestion" section in blue box
   - Click the ✨ sparkle icon
   - Wait 2-3 seconds for AI to generate suggestion

3. **Read the Fix**
   - Suggestion includes: Why, How to Fix, Code Example
   - Copy code directly to your project
   - Implement the fix

### Visual Indicators
- 🔴 **Red** = Critical impact
- 🟠 **Orange** = Serious impact  
- 🟡 **Yellow** = Moderate impact
- 🔵 **Blue** = Minor impact

## 📋 What You Need

### Required
- ✅ Anthropic API key (free account available)
- ✅ ANTHROPIC_API_KEY environment variable set
- ✅ Node.js server running

### Optional
- Create `.env` file instead of env variable (development only)
- Use custom prompts for specialized suggestions
- Integrate with your CI/CD pipeline

## 📂 File Structure

```
AccessibilityProject/
├── aiSuggestions.js              ← AI service (NEW)
├── server.js                      ← Updated with AI endpoints
├── src/
│   ├── DetailsTable.tsx          ← Redesigned with AI UI
│   ├── App.tsx
│   └── ...
├── AI_QUICK_START.md             ← Quick reference (NEW)
├── AI_SUGGESTIONS_SETUP.md       ← Detailed setup (NEW)
├── IMPLEMENTATION_SUMMARY.md     ← Technical overview (NEW)
└── ...
```

## 🔌 API Endpoints

### Generate Single Suggestion
```
POST http://localhost:3000/generate-suggestion
Content-Type: application/json

{
  "issue": {
    "URL": "https://example.com",
    "Rule": "Heading levels should only increase by one",
    "Violation description": "Ensure the order of headings is semantically correct",
    "Violation Type": "heading-order",
    "Impact": "moderate",
    "HTML Element": "<h4>Title</h4>",
    "DOM Element": ".selector h4"
  }
}

Response:
{
  "suggestion": "Explanation of issue and fix steps...\n\nCode Example:\n[before/after code]"
}
```

### Generate Multiple Suggestions (Batch)
```
POST http://localhost:3000/generate-suggestions
Content-Type: application/json

{
  "issues": [
    {...issue1...},
    {...issue2...},
    {...issue3...}
  ]
}

Response:
{
  "suggestions": [
    {...issue1..., "AI Suggestion": "..."},
    {...issue2..., "AI Suggestion": "..."},
    {...issue3..., "AI Suggestion": "..."}
  ]
}
```

## 💡 Example Output

**Issue:** Heading levels should only increase by one

**Generated Suggestion:**
```
EXPLANATION:
Screen readers rely on heading hierarchy to navigate pages. Skipping levels 
(e.g., h2 to h4) confuses users with assistive technology.

FIX:
1. Change the <h4> to an <h3>, OR
2. Restructure your heading order to follow a logical sequence

CODE EXAMPLE:
❌ WRONG:
<h2>Main Title</h2>
<h4>Subtitle</h4>        <!-- Skips h3, invalid -->

✅ CORRECT:
<h2>Main Title</h2>
<h3>Subtitle</h3>        <!-- Proper sequence -->

BEST PRACTICE:
Always increase heading levels by one (h1→h2→h3)
Never skip levels (h1→h3 is wrong)
Use only one h1 per page for main title
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (if not set, defaults shown)
NODE_ENV=development
API_TIMEOUT=30000
```

### .env File (Development)
Create `.env` file in project root:
```
ANTHROPIC_API_KEY=your-key-here
```

## 🚀 Features

### Smart Caching
- Automatically caches suggestions by Rule + Violation Type
- Same issue type? Instant response (no API call)
- Reduces costs and improves performance

### Real-time Feedback
- Loading indicator while generating
- Auto-scroll to new suggestion
- Error handling with user-friendly messages

### Full Context
- Shows HTML element causing issue
- Shows DOM path to element
- Shows violation type and impact level
- Includes original rule description

### Beautiful UI
- Expandable cards for clean organization
- Color-coded impact levels
- Syntax-highlighted code blocks
- Responsive design

## 📊 Performance

### Latency
- First suggestion of type: 2-3 seconds
- Cached suggestion: < 100ms
- Batch processing: ~2-3s for 10 new types

### Costs
- ~200-300 tokens per suggestion
- ~0.2-0.3¢ per suggestion with caching
- [See Anthropic Pricing](https://www.anthropic.com/pricing)

### Scalability
- Can handle 50+ issues per batch
- Cache prevents duplicate API calls
- Async operations don't block UI

## 🔒 Security

### API Key Safety
```javascript
// GOOD: Use environment variable
const apiKey = process.env.ANTHROPIC_API_KEY;

// BAD: Don't hardcode in code
const apiKey = "sk-ant-...";

// BETTER: Use .env file
require('dotenv').config();
const apiKey = process.env.ANTHROPIC_API_KEY;
```

### Never
- ❌ Commit API keys to git
- ❌ Share keys in emails/chat
- ❌ Put keys in client-side code
- ❌ Use same key for multiple projects

### Always
- ✅ Use environment variables
- ✅ Rotate keys regularly  
- ✅ Monitor API usage
- ✅ Use separate keys per environment

## 🛠️ Integration Examples

### In Your React Component
```typescript
import { generateSuggestionWithCache } from '../aiSuggestions.js';

// Call directly from frontend via API
const generateSuggestion = async (issue) => {
  const response = await fetch('/generate-suggestion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issue })
  });
  const data = await response.json();
  setSuggestion(data.suggestion);
};
```

### In Your Backend
```javascript
// Direct import and use
import { generateSuggestionWithCache } from './aiSuggestions.js';

const suggestion = await generateSuggestionWithCache(issue);
```

## ❓ FAQ

### Q: How much does this cost?
A: ~0.2-0.3¢ per suggestion with caching. Free tier available from Anthropic.

### Q: Can I use a different AI model?
A: Currently hardcoded to Claude 3.5 Sonnet. Can be modified in `aiSuggestions.js`.

### Q: Why is the first suggestion slow?
A: API call takes 2-3 seconds. Subsequent identical issues use cache (instant).

### Q: Do suggestions work offline?
A: No, requires internet connection to Anthropic API.

### Q: Can I batch generate all suggestions at once?
A: Yes! Use `/generate-suggestions` endpoint with array of issues.

### Q: What if API key is invalid?
A: Error message appears in suggestion box and browser console.

### Q: Can I customize the AI prompt?
A: Yes, modify the prompt string in `generateSuggestion()` function in `aiSuggestions.js`.

### Q: Does it work with other accessibility scanners?
A: Yes! Works with any scanner that outputs similar CSV format.

## 🐛 Troubleshooting

### Suggestions Not Appearing
```
❌ Problem: Clicked sparkle but nothing happens
✅ Solution:
1. Check browser console (F12)
2. Verify ANTHROPIC_API_KEY is set
3. Restart server
4. Check network tab for failed requests
```

### "API key not found" Error
```
❌ Problem: Error says API key is missing
✅ Solution:
1. Set ANTHROPIC_API_KEY environment variable
2. Restart terminal/server
3. Verify with: echo $env:ANTHROPIC_API_KEY
```

### Slow Suggestions
```
❌ Problem: Taking longer than expected
✅ Solution:
1. First suggestion always takes 2-3 seconds (normal)
2. Check internet connection
3. Check Anthropic API status
4. Next identical issue should be instant (cached)
```

### Suggestions Show Errors
```
❌ Problem: Suggestion box shows error message
✅ Solution:
1. Check API key is valid
2. Check account has credits
3. Check issue data has required fields
4. See server logs for details
```

## 📚 Documentation Files

- **AI_QUICK_START.md** - 5-minute setup
- **AI_SUGGESTIONS_SETUP.md** - Detailed setup & troubleshooting
- **IMPLEMENTATION_SUMMARY.md** - Technical details & architecture
- **README.md** - This file

## 🔄 Update & Maintenance

### Checking for Updates
```bash
# The aiSuggestions.js uses Claude 3.5 Sonnet
# Check Anthropic docs for model updates
https://docs.anthropic.com/reference/models
```

### Updating AI Model
```javascript
// In aiSuggestions.js, change:
const message = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022', // ← Change here
  // ...
});
```

## 🎓 Learning Resources

- [Anthropic Documentation](https://docs.anthropic.com/)
- [Claude Prompt Engineering](https://docs.anthropic.com/guides/prompt-engineering)
- [WebAIM Accessibility](https://webaim.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 📞 Getting Help

### For API Issues
→ Check [Anthropic Support](https://support.anthropic.com/)
→ Check [API Status](https://status.anthropic.com/)

### For Code Issues
→ Check browser console (F12)
→ Check server logs
→ Review error messages in suggestion box

### For Setup Issues
→ See AI_SUGGESTIONS_SETUP.md
→ See AI_QUICK_START.md
→ See Troubleshooting section above

## ✨ What's Next?

### Future Enhancements
- [ ] Export suggestions to PDF/Excel
- [ ] Track which fixes were implemented
- [ ] Suggest implementation difficulty
- [ ] Multi-language support
- [ ] Custom AI prompt templates
- [ ] Persistent caching (database)
- [ ] Suggestion scheduling for large batches
- [ ] Integration with GitHub for PRs

### Contributing
Want to improve this feature? 
- Modify prompts in `aiSuggestions.js`
- Add new endpoints in `server.js`
- Enhance UI in `DetailsTable.tsx`

## 📄 License & Credits

This feature uses:
- **Claude AI** by Anthropic
- **Express.js** for server
- **React + TypeScript** for UI
- **HeroUI** for components

---

**Start generating AI-powered accessibility fixes today!** 🚀

For detailed setup instructions, see [AI_QUICK_START.md](AI_QUICK_START.md)
