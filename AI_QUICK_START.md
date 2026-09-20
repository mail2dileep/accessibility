# Quick Start: AI Suggestions Feature

## ⚡ 5-Minute Setup

### Step 1: Get Claude API Key
1. Go to https://console.anthropic.com/
2. Sign in (create account if needed)
3. Click "API Keys" in left menu
4. Click "Create Key"
5. Copy the key

### Step 2: Set Environment Variable (Choose ONE)

**Option A: PowerShell (Windows)**
```powershell
$env:ANTHROPIC_API_KEY = "your-key-here"
```

**Option B: Windows Permanent Setup**
- Search "Environment Variables" in Windows
- Click "Edit system environment variables"
- Click "Environment Variables..."
- Under "System variables" click "New..."
- Name: `ANTHROPIC_API_KEY`
- Value: `your-key-here`
- Click OK, restart terminal

**Option C: macOS/Linux**
```bash
export ANTHROPIC_API_KEY="your-key-here"
```

### Step 3: Start Your Application
```bash
npm run dev   # Frontend
node server.js  # Backend (in another terminal)
```

### Step 4: Test the Feature
1. Run an accessibility scan
2. Click on any issue to expand it
3. Click the ✨ sparkle icon in the "AI Fix Suggestion" box
4. Wait 2-3 seconds for AI suggestion to appear

## 🎯 What's New

### New Components
- **DetailsTable.tsx**: Shows issues in expandable cards with AI suggestions
- **aiSuggestions.js**: Backend service for generating suggestions
- **Server endpoints**: `/generate-suggestion` and `/generate-suggestions`

### User Features
- Click to expand any issue
- One-click suggestion generation
- Color-coded impact levels
- Syntax-highlighted HTML elements
- Cached suggestions for fast repeated access

### Developer Features
- Reusable `generateSuggestionWithCache()` function
- Batch processing support
- Easy integration with existing code
- Built-in error handling

## 💡 How It Works

1. User sees accessibility issue (e.g., "Heading order invalid")
2. Clicks sparkle icon to generate suggestion
3. Frontend sends issue details to backend
4. Backend calls Claude AI with contextual prompt
5. Claude generates actionable fix steps
6. Suggestion appears in expandable section
7. Future requests for same issue use cache (fast!)

## 📊 Example Suggestion

**Issue:** Heading levels should only increase by one
**Violation:** `<h2>` followed by `<h4>` (skips h3)

**AI Suggestion:**
```
1. WHY: Screen readers rely on heading hierarchy for navigation
2. FIX: Change <h4> to <h3> OR restructure heading order
3. CODE:
   <!-- Before -->
   <h2>Title</h2>
   <h4>Subtitle</h4>
   
   <!-- After -->
   <h2>Title</h2>
   <h3>Subtitle</h3>
```

## 🔑 Environment Variables Needed

- `ANTHROPIC_API_KEY`: Your Claude API key (required)

## ⚙️ Server Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/generate-suggestion` | POST | Single issue suggestion |
| `/generate-suggestions` | POST | Batch suggestions |
| `/slice-details` | GET | Get issue details (updated) |

## 📝 Files You Modified/Created

```
NEW:
- aiSuggestions.js (AI service)
- AI_SUGGESTIONS_SETUP.md (documentation)
- AI_QUICK_START.md (this file)

MODIFIED:
- server.js (added endpoints)
- src/DetailsTable.tsx (complete redesign)
```

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "API key not found" | Set `ANTHROPIC_API_KEY` env var, restart terminal |
| Suggestions slow | Normal! First one takes 2-3s, then cached |
| No suggestions appear | Check browser console for errors, restart server |
| "Error generating suggestion" | Check API key validity, check credits |

## 🚀 Next Steps

1. ✅ Set API key
2. ✅ Start server: `node server.js`
3. ✅ Run accessibility scan
4. ✅ Click sparkle icon on any issue
5. ✅ View AI-generated fix suggestions

## 💰 Cost Info

- Claude API charges per token (~1-10k tokens = 1¢)
- Each suggestion uses ~200-300 tokens
- Cost ~0.2-0.3¢ per suggestion
- [Check current pricing](https://www.anthropic.com/pricing)

## 📞 Support

**Getting Help:**
- Check `AI_SUGGESTIONS_SETUP.md` for detailed docs
- See server logs: `node server.js` output
- Browser console: F12 → Console tab
- API Status: https://status.anthropic.com/

**Reporting Issues:**
- Check error messages in console
- Verify API key is correct
- Restart server
- Clear browser cache

---

**Ready?** Set your API key and start generating suggestions! 🎉
