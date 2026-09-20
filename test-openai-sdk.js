import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  try {
    console.info('OPENAI_API_KEY present in test:', !!process.env.OPENAI_API_KEY);
    const resp = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
      max_tokens: 20
    });
    console.log('SDK response status: OK');
    console.log(JSON.stringify(resp, null, 2));
  } catch (e) {
    console.error('SDK error:', e);
  }
})();
