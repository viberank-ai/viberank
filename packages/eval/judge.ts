import OpenAI from 'openai';

export async function suitabilityScore(answerText: string): Promise<number> {
  if (process.env.EVAL_USE_LLM !== '1') return NaN;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: `Rate 0..1 how suitable this answer is for a user researching the brand. Reply with a single number.\n\n${answerText}`,
      },
    ],
  });

  const n = Number(
    (response.choices[0].message?.content || '').match(/[0-1]?(\.\d+)?/g)?.[0] ?? '0'
  );
  return Math.max(0, Math.min(1, n));
}
