#!/usr/bin/env node
/**
 * Reset Weaviate - Delete all data
 */

import weaviate from 'weaviate-ts-client';
import readline from 'readline';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const projectOnly = args.find(a => a.startsWith('--project='))?.split('=')[1];

  if (!force && !projectOnly) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise(resolve => {
      rl.question('⚠️  This will delete ALL indexed data. Continue? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  if (projectOnly) {
    // Delete only one project
    console.log(`Deleting data for project: ${projectOnly}`);
    const classes = ['CodeChunk', 'DocChunk', 'TypeDefinition', 'FileMetadata'];

    for (const className of classes) {
      try {
        await client.batch
          .objectsBatchDeleter()
          .withClassName(className)
          .withWhere({
            path: ['project'],
            operator: 'Equal',
            valueText: projectOnly,
          })
          .do();
        console.log(`   ✓ Cleared ${className} for ${projectOnly}`);
      } catch (error) {
        console.log(`   - ${className}: ${error.message}`);
      }
    }
  } else {
    // Delete all classes (full reset)
    console.log('Deleting all classes...');
    const schema = await client.schema.getter().do();

    for (const cls of schema.classes || []) {
      try {
        await client.schema.classDeleter().withClassName(cls.class).do();
        console.log(`   ✓ Deleted ${cls.class}`);
      } catch (error) {
        console.log(`   ✗ ${cls.class}: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Reset complete');
}

main().catch(console.error);
