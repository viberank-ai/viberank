import fs from 'fs/promises';
import { Hypothesis } from './types';

export type ActionType =
  | 'Content'
  | 'Schema'
  | 'Outreach'
  | 'Technical'
  | 'Internationalization'
  | 'Reputation';

export interface Action {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  steps: string[]; // concrete steps
  related: string[]; // hypothesis ids
  effort: 1 | 2 | 3 | 4 | 5; // coarse estimate used by ICE later
}

let uid = 0;
const id = (p: string) => `${p}-${++uid}`;

export function actionsForHypothesis(h: Hypothesis): Action[] {
  switch (h.code) {
    case 'NO_AUTHORITY_CITATION':
      return [
        {
          id: id('schema'),
          type: 'Schema',
          title: 'Add Organization/Product JSON‑LD to key pages',
          description: 'Expose authoritative identity to LLMs and search surfaces.',
          steps: [
            'Add Organization JSON‑LD to homepage and About page',
            'Add Product JSON‑LD to product pages with offers, review snippets',
            'Ensure canonical URLs and sameAs profiles',
          ],
          related: [h.id],
          effort: 2,
        },
        {
          id: id('content'),
          type: 'Content',
          title: 'Publish authoritative "What is <Brand>?" resource',
          description: 'High‑signal explainer that answers common intent.',
          steps: [
            'Create pillar page answering top 5 FAQs (from query set)',
            'Include citations to docs, case studies, awards',
            'Link prominently from nav/footer',
          ],
          related: [h.id],
          effort: 3,
        },
        {
          id: id('outreach'),
          type: 'Outreach',
          title: 'Secure citations on high‑trust directories',
          description: 'Seed authority by updating/adding profiles.',
          steps: ['Update Crunchbase/LinkedIn profiles', 'Submit to relevant industry directories'],
          related: [h.id],
          effort: 2,
        },
      ];
    case 'NO_BRAND_MENTION':
      return [
        {
          id: id('content-gap'),
          type: 'Content',
          title: 'Create intent‑matched pages for missing queries',
          description: 'Cover comparison/how‑to/definition intents not represented.',
          steps: [
            'Cluster queries by intent',
            'Draft pages for each cluster',
            'Interlink from related pages',
          ],
          related: [h.id],
          effort: 4,
        },
      ];
    case 'LOW_SENTIMENT':
      return [
        {
          id: id('reputation'),
          type: 'Reputation',
          title: 'Strengthen social proof & address objections',
          description: 'Raise sentiment signal with testimonials and transparent docs.',
          steps: [
            'Add verified testimonials',
            'Publish pricing/limitations openly',
            'Respond to common objections FAQ',
          ],
          related: [h.id],
          effort: 3,
        },
      ];
    case 'LANGUAGE_MISMATCH':
      return [
        {
          id: id('i18n'),
          type: 'Internationalization',
          title: 'Add localized pages + hreflang',
          description: 'Serve ES/FR where queries indicate non‑English.',
          steps: [
            'Translate top pages to target languages',
            'Add hreflang tags',
            'Ensure currency/date locale',
          ],
          related: [h.id],
          effort: 3,
        },
      ];
    case 'PRODUCT_GAP':
      return [
        {
          id: id('use-cases'),
          type: 'Content',
          title: 'Ship product/use‑case pages',
          description: 'Bridge product‑specific intents with dedicated pages.',
          steps: [
            'One page per product/use‑case',
            'Comparison tables vs competitors',
            'Schema for Product',
          ],
          related: [h.id],
          effort: 4,
        },
      ];
    case 'AMBIGUOUS_BRAND':
      return [
        {
          id: id('disambiguate'),
          type: 'Content',
          title: 'Disambiguate brand naming site‑wide',
          description: 'Reduce confusion by consistent name usage and headings.',
          steps: [
            'Standardize brand name variants',
            'Add "About" section clarifying domain of use',
          ],
          related: [h.id],
          effort: 2,
        },
      ];
    case 'COMPETITOR_DOMINANCE':
      return [
        {
          id: id('comparisons'),
          type: 'Content',
          title: 'Create comparison pages ("<Brand> vs <Competitor>")',
          description: 'Compete directly on comparison intent.',
          steps: [
            'Target top 3 competitor pairings',
            'Include feature matrix & citations',
            'Add schema: FAQ',
          ],
          related: [h.id],
          effort: 4,
        },
      ];
    default:
      return [];
  }
}

export async function generateActions(findingsPath = 'data/findings.json') {
  const findings = JSON.parse(await fs.readFile(findingsPath, 'utf-8')) as Hypothesis[];
  const actions = findings.flatMap(actionsForHypothesis);
  await fs.writeFile('data/actions.raw.json', JSON.stringify(actions, null, 2));
  return actions;
}
