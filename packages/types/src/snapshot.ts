export type Surface = 'google_ai' | 'bing_copilot' | 'chatgpt' | 'perplexity';

export interface Snapshot {
  id: string;
  surface: Surface;
  query: string;
  answeredAt: string; // ISO
  answerHtml: string; // html or markdown
  citations: string[];
  followUps?: string[];
}

export interface AnalysisRow {
  query: string;
  surface: Surface;
  score: number; // 0..100
  present: boolean;
  authority: boolean;
}
