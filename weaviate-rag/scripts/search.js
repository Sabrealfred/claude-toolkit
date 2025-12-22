#!/usr/bin/env node
/**
 * CLI Search tool for Weaviate RAG
 *
 * Usage:
 *   node search.js "authentication logic"
 *   node search.js "billing service" --project matwal-premium --limit 5
 *   node search.js "Client type" --types
 */

import weaviate from 'weaviate-ts-client';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage: node search.js <query> [options]');
    console.log('\nOptions:');
    console.log('  --project <name>  Project to search (default: matwal-premium)');
    console.log('  --limit <n>       Max results (default: 5)');
    console.log('  --types           Search type definitions instead of code');
    console.log('  --alpha <n>       0=keyword, 1=semantic (default: 0.5)');
    process.exit(0);
  }

  // Parse arguments
  let query = '';
  let project = 'matwal-premium';
  let limit = 5;
  let searchTypes = false;
  let alpha = 0.5;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project' && args[i + 1]) {
      project = args[++i];
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i]);
    } else if (args[i] === '--types') {
      searchTypes = true;
    } else if (args[i] === '--alpha' && args[i + 1]) {
      alpha = parseFloat(args[++i]);
    } else if (!args[i].startsWith('--')) {
      query = args[i];
    }
  }

  if (!query) {
    console.error('Error: No query provided');
    process.exit(1);
  }

  console.log(`\n🔍 Searching: "${query}"`);
  console.log(`   Project: ${project}, Limit: ${limit}, Alpha: ${alpha}\n`);

  const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  try {
    const className = searchTypes ? 'TypeDefinition' : 'CodeChunk';

    const result = await client.graphql
      .get()
      .withClassName(className)
      .withHybrid({
        query,
        alpha,
      })
      .withWhere({
        path: ['project'],
        operator: 'Equal',
        valueText: project,
      })
      .withLimit(limit)
      .withFields(
        searchTypes
          ? 'name content filePath typeKind properties _additional { score }'
          : 'name content filePath chunkType lineStart signature jsDoc _additional { score }'
      )
      .do();

    const items = result.data?.Get?.[className] || [];

    if (items.length === 0) {
      console.log('No results found.');
      return;
    }

    console.log(`Found ${items.length} results:\n`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rawScore = item._additional?.score;
      const score = typeof rawScore === 'number' ? rawScore.toFixed(3) : 'N/A';

      console.log(`${'─'.repeat(60)}`);
      console.log(`#${i + 1} ${item.name} (${searchTypes ? item.typeKind : item.chunkType})`);
      console.log(`   📁 ${item.filePath}${item.lineStart ? `:${item.lineStart}` : ''}`);
      console.log(`   📊 Score: ${score}`);

      if (item.signature) {
        console.log(`   📝 ${item.signature}`);
      }

      if (item.jsDoc) {
        console.log(`   💬 ${item.jsDoc.substring(0, 100)}...`);
      }

      if (item.properties) {
        console.log(`   🔧 Properties: ${item.properties.slice(0, 5).join(', ')}${item.properties.length > 5 ? '...' : ''}`);
      }

      // Show first 5 lines of content
      const contentLines = item.content.split('\n').slice(0, 5);
      console.log('\n   ```');
      for (const line of contentLines) {
        console.log(`   ${line}`);
      }
      if (item.content.split('\n').length > 5) {
        console.log('   ...');
      }
      console.log('   ```\n');
    }
  } catch (error) {
    console.error('Search error:', error.message);
    process.exit(1);
  }
}

main();
