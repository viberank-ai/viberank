#!/usr/bin/env tsx

import { generateActions } from './actions';

async function main() {
  try {
    const actions = await generateActions();
    console.log(`✅ Generated ${actions.length} actions and saved to data/actions.raw.json`);

    // Show summary by type
    const byType: Record<string, number> = {};
    actions.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    console.log('\n📊 Actions by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  } catch (error) {
    console.error('❌ Failed to generate actions:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
