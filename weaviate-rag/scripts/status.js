#!/usr/bin/env node
/**
 * Check Weaviate RAG status
 */

import weaviate from 'weaviate-ts-client';

async function main() {
  console.log('Weaviate RAG Status');
  console.log('===================\n');

  try {
    const client = weaviate.client({
      scheme: 'http',
      host: 'localhost:8080',
    });

    // Check connection
    const meta = await client.misc.metaGetter().do();
    console.log(`✅ Connected to Weaviate ${meta.version}`);
    console.log(`   Hostname: ${meta.hostname}\n`);

    // Get schema
    const schema = await client.schema.getter().do();
    console.log('Classes:');
    for (const cls of schema.classes || []) {
      console.log(`   - ${cls.class}: ${cls.properties?.length || 0} properties`);
    }

    // Get counts per class
    console.log('\nChunk Counts:');
    const classes = ['CodeChunk', 'DocChunk', 'TypeDefinition', 'FileMetadata'];

    for (const className of classes) {
      try {
        const result = await client.graphql
          .aggregate()
          .withClassName(className)
          .withFields('meta { count }')
          .do();

        const count = result.data?.Aggregate?.[className]?.[0]?.meta?.count || 0;
        console.log(`   ${className}: ${count}`);
      } catch {
        console.log(`   ${className}: (not indexed)`);
      }
    }

    // Get per-project breakdown
    console.log('\nBy Project:');
    try {
      const result = await client.graphql
        .aggregate()
        .withClassName('CodeChunk')
        .withGroupBy(['project'])
        .withFields('groupedBy { value } meta { count }')
        .do();

      for (const group of result.data?.Aggregate?.CodeChunk || []) {
        console.log(`   ${group.groupedBy.value}: ${group.meta.count} chunks`);
      }
    } catch {
      console.log('   (no projects indexed yet)');
    }

    // Get chunk type breakdown
    console.log('\nBy Chunk Type:');
    try {
      const result = await client.graphql
        .aggregate()
        .withClassName('CodeChunk')
        .withGroupBy(['chunkType'])
        .withFields('groupedBy { value } meta { count }')
        .do();

      for (const group of result.data?.Aggregate?.CodeChunk || []) {
        console.log(`   ${group.groupedBy.value}: ${group.meta.count}`);
      }
    } catch {
      console.log('   (no chunks indexed yet)');
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nMake sure Weaviate is running:');
    console.log('   cd /root/weaviate-rag && docker compose up -d');
    process.exit(1);
  }
}

main();
