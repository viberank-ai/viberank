import { generateJsonLd } from './packages/reco/src/jsonld.js';

async function test() {
  try {
    await generateJsonLd();
    console.log('✓ JSON-LD generation completed successfully');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

test();