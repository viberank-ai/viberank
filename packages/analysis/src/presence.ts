import { Brand } from '@viberank/types';
import { htmlToText } from 'html-to-text';

export interface PresenceResult {
  present: boolean;
  authority: boolean; // true if brand's domain cited
}

export function detectPresence(html: string, brand: Brand): PresenceResult {
  const text = htmlToText(html, { wordwrap: false }).toLowerCase();
  const present = [brand.name, ...brand.altSpellings].some((n) => text.includes(n.toLowerCase()));

  const authorityDomains = brand.name.replace(/\s+/g, '').toLowerCase() + '.com';

  const authority =
    html.includes(`href="https://${authorityDomains}`) ||
    html.includes(`href="http://${authorityDomains}`);

  return { present, authority };
}
