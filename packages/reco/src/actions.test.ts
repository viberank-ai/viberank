import { expect, it } from 'vitest';
import fs from 'fs/promises';
import { actionsForHypothesis, generateActions } from './actions';

it('maps NO_AUTHORITY_CITATION to schema/content/outreach actions', () => {
  const acts = actionsForHypothesis({
    id: 'h1',
    code: 'NO_AUTHORITY_CITATION',
    title: '',
    description: '',
    count: 3,
    sample: [],
  });
  const types = acts.map((a) => a.type);
  expect(types).toContain('Schema');
  expect(types).toContain('Content');
  expect(types).toContain('Outreach');
  expect(acts.length).toBe(3);
});

it('maps NO_BRAND_MENTION to content gap action', () => {
  const acts = actionsForHypothesis({
    id: 'h2',
    code: 'NO_BRAND_MENTION',
    title: '',
    description: '',
    count: 5,
    sample: [],
  });
  expect(acts.length).toBe(1);
  expect(acts[0].type).toBe('Content');
  expect(acts[0].title).toContain('intent‑matched pages');
});

it('maps LOW_SENTIMENT to reputation action', () => {
  const acts = actionsForHypothesis({
    id: 'h3',
    code: 'LOW_SENTIMENT',
    title: '',
    description: '',
    count: 2,
    sample: [],
  });
  expect(acts.length).toBe(1);
  expect(acts[0].type).toBe('Reputation');
  expect(acts[0].steps).toContain('Add verified testimonials');
});

it('maps LANGUAGE_MISMATCH to internationalization action', () => {
  const acts = actionsForHypothesis({
    id: 'h4',
    code: 'LANGUAGE_MISMATCH',
    title: '',
    description: '',
    count: 1,
    sample: [],
  });
  expect(acts.length).toBe(1);
  expect(acts[0].type).toBe('Internationalization');
  expect(acts[0].steps).toContain('Add hreflang tags');
});

it('maps PRODUCT_GAP to use-case content action', () => {
  const acts = actionsForHypothesis({
    id: 'h5',
    code: 'PRODUCT_GAP',
    title: '',
    description: '',
    count: 4,
    sample: [],
  });
  expect(acts.length).toBe(1);
  expect(acts[0].type).toBe('Content');
  expect(acts[0].title).toContain('product/use‑case pages');
});

it('maps AMBIGUOUS_BRAND to disambiguation action', () => {
  const acts = actionsForHypothesis({
    id: 'h6',
    code: 'AMBIGUOUS_BRAND',
    title: '',
    description: '',
    count: 2,
    sample: [],
  });
  expect(acts.length).toBe(1);
  expect(acts[0].type).toBe('Content');
  expect(acts[0].steps).toContain('Standardize brand name variants');
});

it('maps COMPETITOR_DOMINANCE to comparison pages action', () => {
  const acts = actionsForHypothesis({
    id: 'h7',
    code: 'COMPETITOR_DOMINANCE',
    title: '',
    description: '',
    count: 3,
    sample: [],
  });
  expect(acts.length).toBe(1);
  expect(acts[0].type).toBe('Content');
  expect(acts[0].title).toContain('comparison pages');
});

it('returns empty array for unknown hypothesis code', () => {
  const acts = actionsForHypothesis({
    id: 'h8',
    code: 'UNKNOWN_CODE' as never,
    title: '',
    description: '',
    count: 1,
    sample: [],
  });
  expect(acts.length).toBe(0);
});

it('generates actions from findings and writes actions.raw.json', async () => {
  // Ensure findings.json exists (created from hypotheses test)
  const findingsExist = await fs
    .access('data/findings.json')
    .then(() => true)
    .catch(() => false);
  if (!findingsExist) {
    await fs.mkdir('data', { recursive: true });
    await fs.writeFile(
      'data/findings.json',
      JSON.stringify([
        {
          id: 'test-1',
          code: 'NO_AUTHORITY_CITATION',
          title: 'Test',
          description: 'Test',
          count: 1,
          sample: [],
        },
      ])
    );
  }

  const actions = await generateActions();
  expect(actions.length).toBeGreaterThan(0);

  // Check that actions.raw.json was created
  const actionsFile = await fs.readFile('data/actions.raw.json', 'utf-8');
  const savedActions = JSON.parse(actionsFile);
  expect(savedActions.length).toBe(actions.length);
  expect(savedActions[0]).toHaveProperty('type');
  expect(savedActions[0]).toHaveProperty('steps');
});
