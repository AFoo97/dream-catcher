import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Call Groq (OpenAI-compatible) for dream interpretation
export async function getDreamInterpretation(dreamText) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Server misconfigured: GROQ_API_KEY is missing');
  }

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  try {
    const message = await client.chat.completions.create({
      model,
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content: 'You are a thoughtful dream interpreter. Be insightful but gentle, and consider common dream symbolism. Keep your interpretation to 2-3 paragraphs.'
        },
        {
          role: 'user',
          content: `Dream: ${dreamText}`
        }
      ]
    });
    return message.choices[0].message.content.trim();
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`API error: ${error.message}`);
  }
}
