# 🔧 AI Suggestions - Troubleshooting Guide

## Quick Diagnostic

If something isn't working, follow this step-by-step guide to identify and fix the issue.

## 🚨 Common Issues & Solutions

### Issue #1: "Error: API key not found"

**What it means:**
The application cannot find your Anthropic API key.

**Why it happens:**
- Environment variable not set
- Typo in variable name
- Terminal not restarted after setting variable
- Variable set in wrong shell/terminal

**How to fix:**

**Step 1: Verify environment variable is set**

PowerShell:
```powershell
echo $env:ANTHROPIC_API_KEY
# Should output: sk-ant-...
# If empty: continue to Step 2
```

Command Prompt:
```cmd
echo %ANTHROPIC_API_KEY%
# Should output: sk-ant-...
# If empty: continue to Step 2
```

macOS/Linux:
```bash
echo $ANTHROPIC_API_KEY
# Should output: sk-ant-...
# If empty: continue to Step 2
```

**Step 2: Set the variable again**

Windows PowerShell:
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-YOUR-KEY-HERE"
# Verify with:
echo $env:ANTHROPIC_API_KEY
```

Windows Command Prompt:
```cmd
set ANTHROPIC_API_KEY=sk-ant-YOUR-KEY-HERE
# Verify with:
echo %ANTHROPIC_API_KEY%
```

macOS/Linux:
```bash
export ANTHROPIC_API_KEY="sk-ant-YOUR-KEY-HERE"
# Verify with:
echo $ANTHROPIC_API_KEY
```

**Step 3: Restart everything**
1. Close all terminals
2. Close VS Code
3. Open new terminal
4. Restart server: `node server.js`
5. Restart frontend: `npm run dev`

**If still not working:**
- Check your API key is correct (copy from console.anthropic.com)
- Try using .env file instead (create .env in project root)
- Use Windows > Environment Variables for persistent setup

---

### Issue #2: "Suggestions are undefined" or "No suggestion appears"

**What it means:**
Clicked sparkle icon but nothing happened, or error in suggestion box.

**Why it happens:**
- Server not running
- /generate-suggestion endpoint not found
- Network error
- Invalid issue data

**How to fix:**

**Step 1: Check server is running**
```bash
# Terminal should show:
# Server running on port 3000
# (or similar message)

# If not:
cd AccessibilityProject
node server.js
```

**Step 2: Check browser console for errors**
```
Press F12
Click "Console" tab
Look for red error messages
Take note of the error
```

**Step 3: Check network request**
```
Press F12
Click "Network" tab
Click sparkle icon
Look for "/generate-suggestion" request
Check Status column:
  - 200 = Good, wait for response
  - 400 = Bad request, check issue data
  - 500 = Server error, check server logs
  - Failed = Network error, check connection
```

**Step 4: Check server logs**
```
Look at terminal where server is running
Look for error messages
Common errors:
  - "Cannot find aiSuggestions"
  - "generateSuggestionWithCache is not defined"
  - API errors from Anthropic
```

**Step 5: Verify server.js has correct imports**

Check line 9 of server.js:
```javascript
import { generateSuggestionWithCache } from './aiSuggestions.js';
```

If missing, run:
```bash
# Reinstall server code
# Or manually add import line
```

---

### Issue #3: "Suggestions slow or timing out"

**What it means:**
Clicked sparkle but waiting > 30 seconds, or "timeout" error appears.

**Why it happens:**
- Network connection slow
- Anthropic API slow (rare)
- API quota exceeded
- Server not responding

**How to fix:**

**Step 1: Check internet connection**
```bash
# Test with:
ping google.com
# Should get responses
```

**Step 2: Check Anthropic API status**
Visit: https://status.anthropic.com/
Look for any incidents or outages

**Step 3: Check API quota**
1. Visit https://console.anthropic.com/
2. Check "Usage" section
3. Verify you have available quota
4. Check your account has credit

**Step 4: Try a simpler issue**
Sometimes complex issues take longer.
Try an issue with shorter text.

**Step 5: Check server timeout settings**

In server.js, look for timeout settings:
```javascript
// Default is usually 30 seconds
// If needed, increase to 60 seconds
```

**Step 6: Restart everything**
```bash
# Close server and frontend
Ctrl+C

# Restart fresh
node server.js
npm run dev
```

---

### Issue #4: "Only blank suggestions" or "Undefined suggestion"

**What it means:**
Suggestion appears but shows "undefined", empty, or [object Object]

**Why it happens:**
- Claude API returned unexpected format
- Suggestion not properly formatted
- JSON parsing error
- State not updating correctly

**How to fix:**

**Step 1: Check browser console**
```
F12 → Console tab
Look for JSON errors or parsing errors
```

**Step 2: Verify aiSuggestions.js exists**
```bash
# Check file exists:
ls -la aiSuggestions.js  (macOS/Linux)
dir aiSuggestions.js     (Windows)
# Should show file info
```

**Step 3: Check aiSuggestions.js has correct structure**
```javascript
// Should have these exports:
export async function generateSuggestion(issue) { ... }
export async function generateSuggestionWithCache(issue) { ... }
```

**Step 4: Clear cache and refresh**
```
Browser: Ctrl+Shift+Delete (Clear browsing data)
Or: F12 → Application → Clear All
Then: F5 to refresh
```

**Step 5: Restart server with debug**
```bash
# Add debug logging:
node --inspect server.js
# Then open: chrome://inspect
```

---

### Issue #5: "Localhost refused to connect"

**What it means:**
Frontend can't reach server at localhost:3000

**Why it happens:**
- Server not running
- Server crashed
- Different port used
- Firewall blocking

**How to fix:**

**Step 1: Verify server is running**
```bash
# Check terminal where you ran: node server.js
# Should show: Server running on port 3000
# If not there, restart: node server.js
```

**Step 2: Try accessing server directly**
```
Open browser
Go to: http://localhost:3000
Should see: Cannot GET / (but connection works)
If error: server not running, see Step 1
```

**Step 3: Check port 3000 is available**
```bash
# Windows PowerShell:
netstat -ano | findstr :3000
# Should be empty (port available)

# macOS/Linux:
lsof -i :3000
# If output: something on port 3000, kill it:
kill -9 [PID]
```

**Step 4: Check firewall**
```
Windows:
1. Go to Settings > Security > Windows Defender Firewall
2. Allow app through firewall
3. Add Node.js to list
4. Restart server

macOS:
System Preferences > Security & Privacy > Firewall Options
Add Node.js if needed

Linux:
sudo ufw allow 3000
```

**Step 5: Use different port (if 3000 unavailable)**
```javascript
// In server.js, change:
const port = 3000;  // Change to 3001, 3002, etc.
```

Then update frontend:
```typescript
// In DetailsTable.tsx, change:
'http://localhost:3000/generate-suggestion'
// To:
'http://localhost:3001/generate-suggestion'
```

---

### Issue #6: "TypeError: fetch is not defined"

**What it means:**
Fetch API not available in Node.js context

**Why it happens:**
- Trying to use fetch in wrong place
- Node.js version too old
- Missing polyfill

**How to fix:**

**Step 1: Verify fetch used in right place**
- ✅ Correct: Use fetch in React components (browser)
- ❌ Wrong: Use fetch in server.js (Node.js)

For Node.js:
```javascript
// Use native Node.js HTTP instead:
import https from 'https';
// Or use axios:
import axios from 'axios';
```

**Step 2: Update Node.js**
```bash
# Check version:
node --version
# Should be v18+ (has fetch built-in)

# If older, download latest from nodejs.org
```

---

### Issue #7: "CORS error" or "No 'Access-Control-Allow-Origin'"

**What it means:**
Browser blocking request from frontend to server

**Why it happens:**
- CORS not properly configured
- Frontend and backend on different origins
- CORS headers missing

**How to fix:**

**Step 1: Verify CORS is enabled in server.js**

Check line ~17:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

Should be there. If not, add it.

**Step 2: Check frontend and backend URLs match**

Frontend should request:
```javascript
'http://localhost:3000/generate-suggestion'
```

Server should be running on:
```
http://localhost:3000
```

**Step 3: Check if ports are different**

If frontend on different port:
```javascript
// In server.js, update CORS:
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

**Step 4: Disable CORS in development (temporary)**
```javascript
// In server.js:
app.use(cors()); // Allow all origins (development only!)
```

---

### Issue #8: "Cannot find module '@anthropic-ai/sdk'"

**What it means:**
Anthropic SDK not installed

**Why it happens:**
- npm install not run
- Installation failed
- Wrong directory

**How to fix:**

**Step 1: Install the package**
```bash
cd AccessibilityProject
npm install @anthropic-ai/sdk
```

**Step 2: Verify installation**
```bash
# Check package.json has:
"@anthropic-ai/sdk": "^..."

# Check node_modules:
ls node_modules/@anthropic-ai/sdk
# Should show folder with files
```

**Step 3: If still broken, clean install**
```bash
rm -r node_modules package-lock.json
npm install
```

---

### Issue #9: "suggestion showing old/cached value"

**What it means:**
Different issue showing old suggestion for different issue type

**Why it happens:**
- Cache key collision
- State not updating properly
- Old data in component

**How to fix:**

**Step 1: Clear browser cache**
```
F12 → Application → Clear All
Or: Ctrl+Shift+Delete
Then: F5 refresh
```

**Step 2: Restart server (clears in-memory cache)**
```bash
# Stop server: Ctrl+C
# Start fresh: node server.js
```

**Step 3: Check cache key logic in aiSuggestions.js**
```javascript
// Line ~60, cache key should be:
const cacheKey = `${issue.Rule}||${issue['Violation Type']}`;
// Different issues = different cache keys
```

**Step 4: Disable caching temporarily to test**
```javascript
// In aiSuggestions.js, change:
export async function generateSuggestionWithCache(issue) {
  // Comment out cache:
  // const cacheKey = ...
  return await generateSuggestion(issue);
}
```

---

### Issue #10: "React state not updating after suggestion"

**What it means:**
Suggestion generates but doesn't appear in UI

**Why it happens:**
- State update not triggering re-render
- Component not re-mounting
- Wrong state variable

**How to fix:**

**Step 1: Check state is being updated**

In DetailsTable.tsx, search for:
```typescript
setDetailsWithSuggestions(updatedDetails);
```

Should be called after suggestion received.

**Step 2: Verify state hook**
```typescript
const [detailsWithSuggestions, setDetailsWithSuggestions] = useState<any[]>(details);
```

Should be there.

**Step 3: Check dependency arrays**
```typescript
// Should have proper dependencies:
useEffect(() => { ... }, [detailsWithSuggestions]);
```

**Step 4: Force re-render**
```
Refresh page: F5
Or: Clear cache and refresh
```

---

## 📋 Diagnostic Checklist

Run through this checklist to identify the issue:

- [ ] API key set? (`echo $env:ANTHROPIC_API_KEY`)
- [ ] Server running? (Terminal shows "Server running on port 3000")
- [ ] Frontend running? (Can access http://localhost:5173)
- [ ] No TypeScript errors? (IDE shows no red squiggles)
- [ ] Browser console clean? (F12 → Console, no red errors)
- [ ] Network request success? (F12 → Network, shows 200 status)
- [ ] Server logs clean? (Server terminal shows no errors)
- [ ] API key valid? (Check console.anthropic.com)
- [ ] aiSuggestions.js exists? (File should be in project root)
- [ ] server.js has imports? (Line 9 should import aiSuggestions)

If all ✓, feature should work!

---

## 🔍 Advanced Debugging

### Enable Debug Logging

In aiSuggestions.js, add logging:
```javascript
export async function generateSuggestion(issue) {
  console.log('generateSuggestion called with:', issue);
  try {
    const prompt = `...`;
    console.log('Prompt:', prompt);
    
    const message = await client.messages.create({...});
    console.log('Claude response:', message);
    
    return suggestion;
  } catch (error) {
    console.error('Full error:', error);
    throw error;
  }
}
```

### Check API Response

In DetailsTable.tsx, add logging:
```typescript
const generateSuggestion = async (index: number) => {
  try {
    const response = await fetch('http://localhost:3000/generate-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue: detailsWithSuggestions[index] })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    // ... rest of code
  }
};
```

---

## 📞 Still Need Help?

### Check Documentation
- See: `AI_QUICK_START.md` (Quick reference)
- See: `AI_SUGGESTIONS_SETUP.md` (Detailed setup)
- See: `IMPLEMENTATION_SUMMARY.md` (Technical details)

### External Resources
- Anthropic API Status: https://status.anthropic.com/
- Anthropic Docs: https://docs.anthropic.com/
- Node.js Docs: https://nodejs.org/
- React Docs: https://react.dev/

### Common Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| API key error | `$env:ANTHROPIC_API_KEY = "your-key"` |
| Server won't start | `cd AccessibilityProject && node server.js` |
| Localhost connection error | `npm run dev` in another terminal |
| Nothing appears on click | Restart both server and frontend |
| Slow suggestions | First one takes 2-3s, then instant (normal) |
| Blank suggestion | Refresh browser, clear cache |
| Missing aiSuggestions.js | Check file exists in project root |
| TypeScript error | `npm install --save-dev typescript` |

---

**If you still have issues, check your browser console (F12) for specific error messages and search the documentation files.**

Good luck! 🚀
