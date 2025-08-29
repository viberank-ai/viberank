import { generateJsonLd } from './src/jsonld';

async function main() {
  try {
    const result = await generateJsonLd('../../data/brand.json', '../../data/queries-tagged.json');
    console.log('✅ JSON-LD generation completed successfully');
    console.log('Organization type:', result.org['@type']);
    console.log('Products count:', result.prods.length);
    console.log('FAQ questions:', result.faq.mainEntity.length);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();