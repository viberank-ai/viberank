import vader from 'vader-sentiment';
import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface SentimentResult {
  polarity: number; // -1 … 1 (compound)
  stance: 'positive' | 'neutral' | 'negative' | 'mixed';
}

/** Hybrid classifier */
export async function classify(text: string): Promise<SentimentResult> {
  const vaderRes = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  const { compound } = vaderRes;

  // simple mapping
  const quickStance = compound >= 0.2 ? 'positive' : compound <= -0.2 ? 'negative' : 'neutral';

  if (Math.abs(compound) >= 0.25) {
    return { polarity: compound, stance: quickStance as SentimentResult['stance'] };
  }

  // Skip LLM call if disabled for deterministic evaluation
  if (process.env.ANALYSIS_DISABLE_LLM === '1') {
    return { polarity: compound, stance: quickStance as SentimentResult['stance'] };
  }

  /* Fallback: ask LLM for subtle sentiment */
  const prompt = `
    Classify the overall sentiment toward the subject in one word: positive, negative, neutral, or mixed.
    Text: """${text.replace(/\n/g, ' ')}"""
  `;
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });
  const stance = (response.choices[0].message?.content || 'neutral')
    .trim()
    .toLowerCase()
    .replace('.', '') as SentimentResult['stance'];
  return { polarity: compound, stance };
}
