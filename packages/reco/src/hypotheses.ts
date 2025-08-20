import fs from 'fs/promises';
import path from 'path';
import crypto from 'node:crypto';
import { Brand } from '@viberank/types';
import { AnalysisRow } from '@viberank/types';
import { Hypothesis, Evidence, ReasonCode } from './types';
import { htmlToText } from 'html-to-text';
import { classify } from '@viberank/analysis'; // respects ANALYSIS_DISABLE_LLM

type Report = { rows: AnalysisRow[] };

const LOW_SCORE = Number(process.env.RECO_LOW_SCORE ?? 50);

function id(code: ReasonCode) {
  return `${code}-${crypto.randomUUID().slice(0, 8)}`;
}

function languageMismatch(q: string) {
  // naive non-English hint: accented chars or leading inverted punctuation
  // Using ASCII range check without control characters
  return /[^\x20-\x7E]/.test(q) || /^[¿¡]/.test(q.trim());
}

export async function generateHypotheses(
  reportPath = 'data/report.json',
  brandPath = 'data/brand.json',
  snapshotsGlob?: string[] // optional: pass latest snapshot files if available
): Promise<Hypothesis[]> {
  const brand: Brand = JSON.parse(await fs.readFile(brandPath, 'utf-8'));
  const report: Report = await fs.readFile(reportPath).then((b) => JSON.parse(b.toString()));

  const evidences: Evidence[] = report.rows
    .filter((r) => r.score < LOW_SCORE || (r.present && !r.authority))
    .map((r) => ({
      query: r.query,
      surface: r.surface,
      score: r.score,
      present: r.present,
      authority: r.authority,
    }));

  const groups: Record<ReasonCode, Evidence[]> = {
    NO_AUTHORITY_CITATION: evidences.filter((e) => e.present && !e.authority),
    NO_BRAND_MENTION: report.rows
      .filter((r) => !r.present)
      .map((r) => ({
        query: r.query,
        surface: r.surface,
        score: r.score,
        present: r.present,
        authority: r.authority,
      })),
    LANGUAGE_MISMATCH: evidences.filter((e) => languageMismatch(e.query)),
    PRODUCT_GAP: evidences.filter(
      (e) =>
        brand.products?.length &&
        brand.products.every((p) => !e.query.toLowerCase().includes(p.toLowerCase()))
    ),
    AMBIGUOUS_BRAND: evidences.filter(
      (e) =>
        brand.altSpellings?.length &&
        brand.altSpellings.some((a) => e.query.toLowerCase().includes(a.toLowerCase()))
    ),
    COMPETITOR_DOMINANCE: [], // filled below if we have snapshots (optional)
    LOW_SENTIMENT: [], // filled below by sampling answers (optional)
  };

  // Optional deep checks: sentiment & competitor mention via snapshots
  // We only run if data/snapshots exist; keep deterministic (ANALYSIS_DISABLE_LLM=1 by default)
  if (snapshotsGlob?.length) {
    // Lazily load and index latest snapshot answers per (query,surface)
    const answers: Record<string, string> = {};
    for (const f of snapshotsGlob) {
      try {
        const arr = JSON.parse(await fs.readFile(f, 'utf-8')) as Array<{
          query: string;
          surface: string;
          answerHtml: string;
        }>;
        for (const s of arr) answers[`${s.query}::${s.surface}`] = s.answerHtml;
      } catch {
        // Ignore errors reading snapshot files
      }
    }
    // LOW_SENTIMENT
    for (const e of evidences) {
      const key = `${e.query}::${e.surface}`;
      const html = answers[key];
      if (!html) continue;
      const txt = htmlToText(html, { wordwrap: false });
      const sent = await classify(txt); // quick & deterministic
      if (sent.polarity < 0.0) groups.LOW_SENTIMENT.push(e);
    }
    // COMPETITOR_DOMINANCE — heuristic: query mentions competitor by name
    for (const e of evidences) {
      if ((brand.competitors || []).some((c) => e.query.toLowerCase().includes(c.toLowerCase()))) {
        groups.COMPETITOR_DOMINANCE.push(e);
      }
    }
  }

  // Compose hypotheses with canned titles/descriptions
  const out: Hypothesis[] = [];
  const add = (code: ReasonCode, title: string, description: string, list: Evidence[]) => {
    if (!list.length) return;
    out.push({
      id: id(code),
      code,
      title,
      description,
      count: list.length,
      sample: list.slice(0, 5),
    });
  };

  add(
    'NO_AUTHORITY_CITATION',
    'Branded sources not cited',
    'Answers discuss the brand but link to third-party sites; adding authoritative brand pages and schema may improve citation.',
    groups.NO_AUTHORITY_CITATION
  );

  add(
    'NO_BRAND_MENTION',
    'Brand not represented for these queries',
    'The brand is missing in answers; likely a content gap or query intents not covered by current pages.',
    groups.NO_BRAND_MENTION
  );

  add(
    'LOW_SENTIMENT',
    'Tone or sentiment may discourage citation',
    'Negative or hedged language around the brand can reduce perceived authority.',
    groups.LOW_SENTIMENT
  );

  add(
    'LANGUAGE_MISMATCH',
    'Language/locale mismatch',
    'Queries appear non‑English or mixed locale; localized content or hreflang may be required.',
    groups.LANGUAGE_MISMATCH
  );

  add(
    'PRODUCT_GAP',
    'No product‑level coverage',
    'Queries do not match any known product; build product or use‑case pages aligned to search intent.',
    groups.PRODUCT_GAP
  );

  add(
    'AMBIGUOUS_BRAND',
    'Name ambiguity',
    'Alternate spellings or generic terms may confuse models; reinforce disambiguation in titles and schema.',
    groups.AMBIGUOUS_BRAND
  );

  add(
    'COMPETITOR_DOMINANCE',
    'Competitor‑framed intent',
    'Many queries frame the brand versus competitors; comparison pages and structured data can help.',
    groups.COMPETITOR_DOMINANCE
  );

  // Persist findings
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(path.join('data', 'findings.json'), JSON.stringify(out, null, 2));
  return out;
}
