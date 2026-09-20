# 🎯 AI Suggestions - Visual Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Application                       │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  App.tsx (Main Component)                     │ │   │
│  │  │  - Manages charts and scan state             │ │   │
│  │  │  - Handles URL input                         │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                      ↓                               │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  DetailsTable.tsx (NEW DESIGN)                │ │   │
│  │  │  - Expandable cards for each issue            │ │   │
│  │  │  - "AI Fix Suggestion" section                │ │   │
│  │  │  - Sparkle icon to trigger generation         │ │   │
│  │  │  - Loading state during API call              │ │   │
│  │  │  - Display suggestion when ready              │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                      ↓ HTTP POST                             │
│          /generate-suggestion                                │
│          {issue: {...}}                                      │
└─────────────────────────────────────────────────────────────┘
              ↓                           ↑
    Request with issue data    Response with suggestion
              ↓                           ↑
┌─────────────────────────────────────────────────────────────┐
│              NODE.JS SERVER (Express)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  server.js                                           │   │
│  │  ├─ Existing Endpoints:                             │   │
│  │  │  • /run-script (accessibility scan)              │   │
│  │  │  • /crawl-site (site crawler)                    │   │
│  │  │  • /generate-report (create charts)              │   │
│  │  │  • /slice-details (get issue details)            │   │
│  │  │                                                   │   │
│  │  └─ NEW Endpoints: (AI Suggestions)                 │   │
│  │     • /generate-suggestion (single)                 │   │
│  │     • /generate-suggestions (batch)                 │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  POST /generate-suggestion Handler           │  │   │
│  │  │  1. Receive issue data from client            │  │   │
│  │  │  2. Call generateSuggestionWithCache()        │  │   │
│  │  │  3. Return suggestion to client               │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                      ↓                              │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  aiSuggestions.js (NEW AI SERVICE)           │  │   │
│  │  │  ┌──────────────────────────────────────────┐│  │   │
│  │  │  │ generateSuggestionWithCache(issue)       ││  │   │
│  │  │  │ 1. Check cache (Rule + ViolationType)    ││  │   │
│  │  │  │    ├─ Hit: Return cached (instant!)     ││  │   │
│  │  │  │    └─ Miss: Continue                     ││  │   │
│  │  │  │ 2. Call Claude API with prompt           ││  │   │
│  │  │  │ 3. Store result in cache                 ││  │   │
│  │  │  │ 4. Return suggestion                     ││  │   │
│  │  │  └──────────────────────────────────────────┘│  │   │
│  │  │                      ↓                        │  │   │
│  │  │  ┌──────────────────────────────────────────┐│  │   │
│  │  │  │  generateSuggestion(issue)               ││  │   │
│  │  │  │  1. Format issue data into prompt        ││  │   │
│  │  │  │  2. Send to Anthropic API                ││  │   │
│  │  │  │  3. Parse response                       ││  │   │
│  │  │  │  4. Return formatted suggestion          ││  │   │
│  │  │  └──────────────────────────────────────────┘│  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                      ↓                              │   │
│  │           Suggestion Cache (In-Memory)             │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │ {                                            │  │   │
│  │  │   "heading-order||heading-order": "Fix...", │  │   │
│  │  │   "color-contrast||color": "Increase...",   │  │   │
│  │  │   ...                                        │  │   │
│  │  │ }                                            │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              ↓                           ↑
    POST /generate-suggestion   {suggestion: "..."}
    (with issue data)
              ↓                           ↑
    ┌─────────────────────────────────┐
    │   ANTHROPIC API (Claude AI)     │
    │                                 │
    │  Claude 3.5 Sonnet Model        │
    │  ├─ Receives prompt             │
    │  ├─ Analyzes accessibility issue│
    │  ├─ Generates fix suggestion    │
    │  └─ Returns formatted response  │
    └─────────────────────────────────┘
```

## User Flow Diagram

```
START
  ↓
[Open Accessibility Checker]
  ↓
[Input URLs or Load Results]
  ↓
[Run Scan] → CSV files stored in Output/
  ↓
[View Report] → Charts and Summary
  ↓
[Click on Issue] → DetailsTable Expands
  ↓
[See Issue Details]
  ├─ Rule name
  ├─ Violation type
  ├─ Impact level (color coded)
  ├─ HTML element
  ├─ DOM path
  └─ "AI Fix Suggestion" section (blue box)
  ↓
[Click ✨ Sparkle Icon]
  ↓
[Loading State]
  ├─ Shows spinner
  └─ Waits for AI response
  ↓
[Suggestion Appears]
  ├─ Shows explanation
  ├─ Shows fix steps
  ├─ Shows code example
  └─ Auto-scrolls into view
  ↓
[User Reads & Implements Fix]
  ↓
[Next Issue... (repeat)] 
  or [Click identical issue type]
     → Instant suggestion (cached!)
  ↓
END
```

## Component Interaction Diagram

```
┌──────────────┐
│   App.tsx    │ Main component, manages state
└──────┬───────┘
       │
       ├─→ [Charts] Doughnut charts by issue type
       │
       ├─→ [DetailsTable] ← REDESIGNED FOR AI
       │    │
       │    └─→ DetailsTableCard (for each issue)
       │         │
       │         ├─ Header (clickable to expand)
       │         │  ├─ Rule name
       │         │  ├─ Impact badge (color coded)
       │         │  └─ Chevron icon
       │         │
       │         └─ Expanded Content
       │            ├─ Violation Type
       │            ├─ Impact Level
       │            ├─ HTML Element (code block)
       │            ├─ DOM Element (code block)
       │            │
       │            └─ AI Suggestion Section ← NEW
       │               ├─ Title + Lightbulb icon
       │               ├─ Sparkle button (if not loaded)
       │               │  └─ POST /generate-suggestion
       │               │     └─ aiSuggestions.generateSuggestionWithCache()
       │               │        ├─ Check cache
       │               │        ├─ Call Claude API (if needed)
       │               │        └─ Return suggestion
       │               │
       │               └─ Display suggestion (formatted text)
       │
       └─→ [Server Backend]
            ├─ GET /slice-details
            │  └─ Returns issues with all details
            │
            └─ POST /generate-suggestion ← NEW
               └─ aiSuggestions.js
                  ├─ generateSuggestionWithCache()
                  ├─ generateSuggestion()
                  └─ Anthropic API call
```

## State Management Flow

```
Frontend State (React):
┌────────────────────────────────────────┐
│ const [details, setDetails] = useState  │  ← Issue data from CSV
│ const [expandedRows, setExpandedRows]   │  ← Which cards are open
│ const [loadingSuggestions, setLoading]  │  ← Which are loading
│ const [detailsWithSuggestions, setD..]  │  ← Issues + suggestions
└────────────────────────────────────────┘
         ↓
    User clicks sparkle
         ↓
POST /generate-suggestion with issue
         ↓
Backend generates suggestion
         ↓
Response with suggestion
         ↓
Update detailsWithSuggestions state
         ↓
Re-render with new suggestion visible
```

## File Organization

```
Before Implementation:
AccessibilityProject/
├── src/
│   ├── App.tsx                    (main app)
│   ├── DetailsTable.tsx           (table layout - OLD)
│   └── ...
├── server.js                      (basic endpoints)
└── ...

After Implementation:
AccessibilityProject/
├── src/
│   ├── App.tsx                    (unchanged)
│   ├── DetailsTable.tsx           (REDESIGNED - cards + AI)
│   └── ...
├── aiSuggestions.js               (NEW - AI service)
├── server.js                      (UPDATED - new endpoints)
├── AI_QUICK_START.md              (NEW - quick setup)
├── AI_SUGGESTIONS_SETUP.md        (NEW - detailed guide)
├── IMPLEMENTATION_SUMMARY.md      (NEW - technical)
├── AI_FEATURES_README.md          (NEW - feature docs)
└── IMPLEMENTATION_CHECKLIST.md    (NEW - checklist)
```

## Setup Process Flowchart

```
START: Want AI Suggestions?
  ↓
[Get Anthropic API Key]
  https://console.anthropic.com/ → Create Key → Copy
  ↓
[Set Environment Variable]
  ├─ Windows PowerShell: $env:ANTHROPIC_API_KEY = "..."
  ├─ Windows CMD: set ANTHROPIC_API_KEY=...
  ├─ macOS/Linux: export ANTHROPIC_API_KEY=...
  └─ Restart Terminal/IDE
  ↓
[Start Server]
  node server.js
  ↓
  Should see:
  ✅ No errors
  ✅ "Server running on port 3000"
  ✓
[Start Frontend]
  npm run dev
  ↓
  Should see:
  ✅ No TypeScript errors
  ✅ App loads on localhost:5173
  ✅ No console errors
  ↓
[Test Feature]
  1. Run accessibility scan
  2. Click any issue
  3. Click sparkle icon
  4. Wait 2-3 seconds
  5. See AI suggestion
  ↓
✅ SUCCESS!
```

## API Request-Response Cycle

```
SINGLE SUGGESTION REQUEST:
────────────────────────────

Browser Console:
fetch('/generate-suggestion', {
  method: 'POST',
  body: JSON.stringify({
    issue: {
      Rule: "Heading levels should only increase by one",
      "Violation description": "Ensure heading order is correct",
      "Violation Type": "heading-order",
      Impact: "moderate",
      "HTML Element": "<h4>Title</h4>",
      "DOM Element": ".selector > h4"
    }
  })
})

        ↓ HTTP POST ↓

Server Processing:
POST /generate-suggestion
├─ Parse request body
├─ Extract issue object
├─ Call generateSuggestionWithCache()
│  ├─ Check: cache["heading-order||heading-order"]?
│  ├─ If yes: Return cached suggestion (instant)
│  ├─ If no: Call Anthropic API
│  │   ├─ Format prompt with issue details
│  │   ├─ POST to Claude with prompt
│  │   ├─ Receive suggestion (~2-3 seconds)
│  │   └─ Cache it for future use
│  └─ Return suggestion
└─ Send response

        ↓ HTTP Response ↓

Browser:
{
  suggestion: "EXPLANATION:\nHeading order is important...\n\nFIX:\nChange <h4> to <h3>...\n\nCODE:\n<h3>Title</h3>"
}

        ↓ React Update ↓

Frontend:
├─ Stop loading animation
├─ Update state with suggestion
├─ Re-render DetailsTable
├─ Show suggestion in blue box
└─ Auto-scroll into view
```

## Cache Behavior Illustration

```
FIRST REQUEST for "heading-order":
┌─────────────────────────────────┐
│  generateSuggestionWithCache()  │
│  ┌──────────────────────────┐   │
│  │ Check cache              │   │
│  │ "heading-order||..." = ? │   │
│  │ → NOT FOUND              │   │
│  └──────┬───────────────────┘   │
│         ↓                        │
│  ┌──────────────────────────┐   │
│  │ Call Anthropic API       │   │
│  │ (2-3 seconds)            │   │
│  └──────┬───────────────────┘   │
│         ↓                        │
│  ┌──────────────────────────┐   │
│  │ Store in cache:          │   │
│  │ "heading-order||..." =   │   │
│  │ "Fix heading levels..."  │   │
│  └──────┬───────────────────┘   │
│         ↓                        │
│  ┌──────────────────────────┐   │
│  │ Return suggestion        │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
TIME: ~2-3 seconds

SECOND REQUEST for SAME "heading-order":
┌─────────────────────────────────┐
│  generateSuggestionWithCache()  │
│  ┌──────────────────────────┐   │
│  │ Check cache              │   │
│  │ "heading-order||..." = ? │   │
│  │ → FOUND! ✓               │   │
│  └──────┬───────────────────┘   │
│         ↓                        │
│  ┌──────────────────────────┐   │
│  │ Return cached suggestion │   │
│  │ (no API call needed)     │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
TIME: < 100ms (instant!)
```

## Color Coding System

```
Impact Level → Color → Severity
─────────────────────────────────
CRITICAL  → 🔴 RED      (urgent fix needed)
SERIOUS   → 🟠 ORANGE   (important fix)
MODERATE  → 🟡 YELLOW   (fix recommended)
MINOR     → 🔵 BLUE     (nice to have)

In UI: Badge shows in issue card header
```

## Troubleshooting Tree

```
AI Suggestion Not Appearing?
│
├─ Check 1: API Key Set?
│  ├─ YES → Continue
│  └─ NO → Set ANTHROPIC_API_KEY env var, restart terminal
│
├─ Check 2: Server Running?
│  ├─ YES → Continue
│  └─ NO → Run: node server.js
│
├─ Check 3: Browser Console Error?
│  ├─ YES → Read error message, see troubleshooting guide
│  └─ NO → Continue
│
├─ Check 4: Network Tab (F12)?
│  ├─ 200 OK → Suggestion should appear, wait 2-3s
│  ├─ 400 → Bad request, check issue data
│  ├─ 401 → Invalid API key
│  └─ 500 → Server error, check server logs
│
└─ Check 5: Server Logs?
   ├─ Error visible → Fix and restart
   └─ No error → Clear cache, refresh browser
```

---

**Ready to use?** Start with **AI_QUICK_START.md** for 5-minute setup!
