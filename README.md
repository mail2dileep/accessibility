# Accessibility Project

End-to-end web accessibility scanner and reporting UI. The app crawls URLs, runs axe-core checks via Selenium, summarizes results into charts, and provides AI fix suggestions and systemic defect analysis.

## What This Does

- Collects URLs from user input or a crawl
- Runs axe-core accessibility tests in a headless browser
- Produces CSV output and chart-ready summaries
- Renders interactive charts and issue details in a React UI
- Optionally generates AI suggestions per issue
- Generates an HTML report with AI suggestions and systemic defect analysis

## Architecture At A Glance

- Frontend: React + Vite UI (charts, details, AI suggestion actions)
- Backend: Express server orchestrates scans and data endpoints
- Scanner: Selenium + axe-core produces Output/test-results.csv
- Reporting: CSV summaries and HTML reports

## Quick Start

### Prerequisites

- Node.js 18+ recommended
- A working browser driver for Selenium (GeckoDriver for Firefox or ChromeDriver for Chrome)
- Optional: OpenAI API key for AI suggestions

### Install

```bash
npm install
```

### Run The App

```bash
# Terminal 1
node server.js

# Terminal 2
npm run dev
```

Open the UI at http://localhost:5173

## Usage

### 1) Scan A List Of URLs

- Paste URLs into the input box in the UI
- Click Run Scan
- Use Generate Report to load charts

### 2) Crawl A Site

- Paste a single start URL
- Click Crawl Site
- After crawl completes, the scan runs automatically

### 3) View Issue Details

- Click chart slices to fetch issue rows
- Expand issue cards to see details and AI suggestions

### 4) Generate HTML Report With AI Suggestions

- From the backend, call:

```text
GET http://localhost:3000/generate-report-with-suggestions
```

This generates accessibility-report-with-suggestions.html at the project root.

## AI Suggestions

AI suggestions use the OpenAI API. Set the API key before running the server:

```powershell
$env:OPENAI_API_KEY = "your-key-here"
```

Optional TLS settings for corporate/self-signed cert environments:

```powershell
$env:NODE_EXTRA_CA_CERTS = "C:\\path\\to\\ca.pem"
$env:DISABLE_TLS_VERIFY = "true"
```

## Key Endpoints

- POST /run-script: run accessibility scan on provided URLs
- POST /crawl-site: crawl a domain, then run scan
- GET /generate-report: build chart-data.json from CSV summaries
- GET /slice-details: fetch issue rows for a chart slice
- POST /generate-suggestion: AI suggestion for one issue
- POST /generate-suggestions: AI suggestions for a list of issues
- GET /generate-report-with-suggestions: HTML report with AI suggestions and systemic analysis

## Outputs

- Output/test-results.csv: raw axe-core results
- all_column_summaries.csv: summary stats for first six columns
- chart-data.json: chart-ready data for the UI
- accessibility-report-with-suggestions.html: downloadable AI report
- summary_report_fully_interactive.html: standalone HTML report

## Important Files

- server.js: Express server and endpoints
- WebAccessibility_final.cjs: Selenium + axe-core scan runner
- Crawler.cjs: URL crawler with sitemap support
- csvjson.cjs: CSV summary to chart data converter
- reportGenerator.js: HTML report generator with systemic analysis
- aiSuggestions.js: OpenAI suggestion generation and caching
- src/App.tsx: UI logic for scans and charts
- src/DetailsTable.tsx: issue cards and AI suggestion UI

## Troubleshooting

- If scans fail, verify the browser driver is installed and on PATH
- The scan runner uses headless Chrome and should continue when Windows is locked, but it will still pause if the machine goes to sleep or hibernates
- If AI suggestions fail, confirm OPENAI_API_KEY is set
- If TLS errors occur, set NODE_EXTRA_CA_CERTS or DISABLE_TLS_VERIFY for local testing

## Documentation Index

See DOCUMENTATION_INDEX.md for deeper guides and feature references.

