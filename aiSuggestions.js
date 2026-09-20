import OpenAI from 'openai';
import fs from 'fs';
import axios from 'axios';
import https from 'https';
import http from 'http';

// Allow runtime configuration for corporate/self-signed cert environments:
// - Set NODE_EXTRA_CA_CERTS to a .pem file path (preferred)
// - Or set DISABLE_TLS_VERIFY=true for a temporary local workaround (NOT recommended for production)
if (process.env.NODE_EXTRA_CA_CERTS) {
  const caPath = process.env.NODE_EXTRA_CA_CERTS;
  if (!fs.existsSync(caPath)) {
    console.warn(`Warning: NODE_EXTRA_CA_CERTS is set to '${caPath}' but file does not exist.`);
  } else {
    console.info(`Using additional CA certs from: ${caPath}`);
  }
}

if (process.env.DISABLE_TLS_VERIFY === 'true') {
  console.warn('WARNING: TLS certificate verification disabled (DISABLE_TLS_VERIFY=true). This is insecure and should only be used for local testing.');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Create custom agents for corporate/self-signed cert environments
// Temporarily disable TLS verification to bypass corporate proxy/self-signed cert issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const httpAgent = new http.Agent();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
  httpAgent,
  httpsAgent
});

// Helpful runtime check: fail fast if API key not set
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
  console.warn('Warning: OPENAI_API_KEY is not set or is using the placeholder value. Set OPENAI_API_KEY to a valid key.');
}

/**
 * Generate AI fix suggestions for accessibility issues
 * @param {Object} issue - The accessibility issue object
 * @param {string} issue.Rule - The rule that was violated
 * @param {string} issue['Violation description'] - Description of the violation
 * @param {string} issue['Violation Type'] - Type of violation
 * @param {string} issue.Impact - Impact level (critical, serious, moderate, minor)
 * @param {string} issue['HTML Element'] - The HTML element that caused the issue
 * @param {string} issue['DOM Element'] - The DOM path to the element
 * @returns {Promise<string>} The AI-generated fix suggestion
 */
export async function generateSuggestion(issue) {
  try {
    const prompt = `You are an expert web accessibility consultant. Analyze the following accessibility violation and provide a concise, actionable fix suggestion.

**Accessibility Issue Details:**
- Rule: ${issue.Rule}
- Violation Description: ${issue['Violation description']}
- Violation Type: ${issue['Violation Type']}
- Impact: ${issue.Impact}
- HTML Element: ${issue['HTML Element']}
- DOM Path: ${issue['DOM Element']}

Please provide:
1. A brief explanation of why this is an accessibility issue
2. The specific fix to implement
3. Example code if applicable

Keep the response concise and practical, focused on the exact fix needed.`;

    console.info('OpenAI request starting: model=gpt-5.0, promptLength=', prompt.length);

    // Use axios directly with custom agents that disable TLS verification
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
      model: 'gpt-5',
      //max_completion_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    };

    const axiosConfig = {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000,
      validateStatus: () => true, // Accept any status
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      httpAgent: new http.Agent()
    };

    console.info('Making axios request to OpenAI API...');
    const axRes = await axios.post(url, body, axiosConfig);
    console.info('Axios request completed with status:', axRes.status);
    
    if (axRes.status !== 200) {
      console.error('API error response:', axRes.status, axRes.data);
      throw new Error(`OpenAI API error: ${axRes.status} - ${JSON.stringify(axRes.data)}`);
    }

    const response = axRes.data;
    // Robustly extract text from various OpenAI response shapes
    let suggestion = '';
    try {
      const choice = response.choices && response.choices[0];
      if (!choice) {
        suggestion = '';
      } else if (choice.message) {
        const content = choice.message.content;
        if (typeof content === 'string') suggestion = content;
        else if (Array.isArray(content)) suggestion = content.map(c => c.text || '').join('');
        else suggestion = JSON.stringify(content);
      } else if (choice.text) {
        suggestion = choice.text;
      } else {
        suggestion = JSON.stringify(choice);
      }
    } catch (err) {
      suggestion = '';
    }

    return suggestion;
  } catch (error) {
    // Log detailed error information to aid debugging (network, status, headers)
    try {
      console.error('Error generating suggestion:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code || null,
        status: error.status || (error.response && error.response.status) || null,
        responseData: error.response && error.response.data ? error.response.data : null
      });
    } catch (logErr) {
      console.error('Error logging the OpenAI error:', logErr);
      console.error(error);
    }

    // Provide a clearer message for common issues
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
      return `Unable to generate suggestion. Error: OpenAI API key not set (OPENAI_API_KEY).`;
    }

    return `Unable to generate suggestion. Error: ${error.message}`;
  }
}

/**
 * Generate suggestions for multiple issues
 * @param {Array<Object>} issues - Array of accessibility issues
 * @returns {Promise<Array>} Array of issues with suggestions added
 */
export async function generateSuggestionsForIssues(issues) {
  const issuesWithSuggestions = [];
  
  for (const issue of issues) {
    try {
      const suggestion = await generateSuggestion(issue);
      issuesWithSuggestions.push({
        ...issue,
        'AI Suggestion': suggestion
      });
    } catch (error) {
      issuesWithSuggestions.push({
        ...issue,
        'AI Suggestion': `Error generating suggestion: ${error.message}`
      });
    }
  }
  
  return issuesWithSuggestions;
}

/**
 * Generate suggestion with caching to avoid duplicate API calls
 * Uses in-memory cache during server session
 */
const suggestionCache = new Map();

export async function generateSuggestionWithCache(issue) {
  const cacheKey = `${issue.Rule}||${issue['Violation Type']}`;
  
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey);
  }
  
  const suggestion = await generateSuggestion(issue);
  suggestionCache.set(cacheKey, suggestion);
  
  return suggestion;
}
