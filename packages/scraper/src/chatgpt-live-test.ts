#!/usr/bin/env tsx

/**
 * Live test for ChatGPT Browse scraper
 *
 * Usage:
 * 1. Set CHATGPT_COOKIE environment variable with your session token
 * 2. Run: tsx packages/scraper/src/chatgpt-live-test.ts
 */

import { chatGPTBrowse } from './chatgpt';

async function testChatGPT() {
  if (!process.env.CHATGPT_COOKIE) {
    console.error('❌ CHATGPT_COOKIE environment variable is required');
    console.log('Get it from browser: Application > Cookies > __Secure-next-auth.session-token');
    process.exit(1);
  }

  const testQuery = 'What are the latest developments in AI in 2024?';
  console.log(`🧪 Testing ChatGPT Browse with query: "${testQuery}"`);
  console.log('⏳ This may take 45+ seconds...\n');

  try {
    const result = await chatGPTBrowse(testQuery);

    console.log('✅ Success! ChatGPT Browse scraper working\n');
    console.log('📝 Answer:');
    console.log(result.answer);
    console.log('\n🔗 Citations:');
    result.citations.forEach((citation, i) => {
      console.log(`${i + 1}. ${citation}`);
    });
    console.log(`\n📊 Found ${result.citations.length} citations`);
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔍 Possible issues:');
    console.log('- Invalid or expired CHATGPT_COOKIE');
    console.log('- ChatGPT UI changed (selectors need updating)');
    console.log('- Rate limiting or session blocked');
    console.log('- Network connectivity issues');
  }
}

testChatGPT();
