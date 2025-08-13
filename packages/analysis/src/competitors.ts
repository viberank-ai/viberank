import { Brand } from '@viberank/types';
import OpenAI from 'openai';
import { htmlToText } from 'html-to-text';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractCompetitors(html: string, brand: Brand): Promise<string[]> {
  const text = htmlToText(html, { wordwrap: false }).slice(0, 4000);
  const prompt = `
    Identify competitor brand names mentioned in the following text that are NOT ${brand.name}.
    Return as JSON array of strings.
    Text: """${text}"""
  `;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });
  try {
    const list = JSON.parse(response.choices[0].message?.content || '[]');
    return list.filter((c: string) => typeof c === 'string');
  } catch {
    // fallback heuristic: intersection with known competitors list
    return brand.competitors.filter((c) => text.toLowerCase().includes(c.toLowerCase()));
  }
}
