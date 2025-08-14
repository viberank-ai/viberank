declare module 'vader-sentiment' {
  interface SentimentAnalysis {
    compound: number;
    pos: number;
    neu: number;
    neg: number;
  }

  interface Vader {
    SentimentIntensityAnalyzer: {
      polarity_scores: (text: string) => SentimentAnalysis;
    };
  }

  const vader: Vader;
  export = vader;
}
