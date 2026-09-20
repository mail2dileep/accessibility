import express from 'express';
import { generateSuggestionWithCache } from './aiSuggestions.js';

console.log('Starting minimal test server...');

const app = express();
app.use(express.json());

app.post('/generate-suggestion', async (req, res) => {
  try {
    const { issue } = req.body;
    if (!issue) {
      return res.status(400).json({ error: 'No issue provided' });
    }
    const suggestion = await generateSuggestionWithCache(issue);
    res.json({ suggestion });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
