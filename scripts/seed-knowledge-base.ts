#!/usr/bin/env tsx

import { seedKnowledgeBase } from '../lib/db/seed-knowledge-base';

async function main() {
  try {
    console.log('Starting knowledge base seeding...');
    const result = await seedKnowledgeBase();
    console.log('✅ Knowledge base seeded successfully!');
    console.log(`📊 Seeded ${result.guidelines} guidelines, ${result.interactions} drug interactions, ${result.trials} clinical trials, and ${result.articles} articles`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding knowledge base:', error);
    process.exit(1);
  }
}

main();