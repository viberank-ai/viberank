const { generateJsonLd } = require('./packages/reco/src/jsonld.ts');

async function test() {
  try {
    await generateJsonLd();
    console.log('✓ JSON-LD generation completed successfully');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

test();