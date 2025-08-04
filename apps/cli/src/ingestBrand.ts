#!/usr/bin/env node
import { Command } from 'commander';
import { BrandSchema } from '../../../packages/types/src/brand.js';
import fs from 'fs/promises';

const program = new Command();
program
  .requiredOption('-n, --name <string>')
  .option('-a, --alt <values...>')
  .option('-p, --product <values...>')
  .option('-c, --competitor <values...>')
  .parse();

const opts = program.opts();
const brand = BrandSchema.parse({
  name: opts.name,
  altSpellings: opts.alt,
  products: opts.product,
  competitors: opts.competitor,
});
await fs.mkdir('data', { recursive: true });
await fs.writeFile('data/brand.json', JSON.stringify(brand, null, 2));
console.log('✅  data/brand.json written');
