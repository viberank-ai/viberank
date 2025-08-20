// import { AnalysisRow } from '@viberank/types'; // Exported for consumers

export type ReasonCode =
  | 'NO_AUTHORITY_CITATION'
  | 'NO_BRAND_MENTION'
  | 'LOW_SENTIMENT'
  | 'LANGUAGE_MISMATCH'
  | 'PRODUCT_GAP'
  | 'AMBIGUOUS_BRAND'
  | 'COMPETITOR_DOMINANCE';

export interface Evidence {
  query: string;
  surface: string;
  score: number;
  present: boolean;
  authority: boolean;
}

export interface Hypothesis {
  id: string;
  code: ReasonCode;
  title: string; // human-readable
  description: string; // 1-2 sentences
  count: number; // affected rows count
  sample: Evidence[]; // small sample (<=5) of evidences
}
