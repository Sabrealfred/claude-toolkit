#!/usr/bin/env node
/**
 * Upgrade Memory Schema
 *
 * Migrates the ConversationMemory collection to include new agent fields:
 * - agentType, model, taskType, parentSessionId, cost, inputTokens, outputTokens
 *
 * Usage:
 *   node upgrade-memory-schema.js          # Check and migrate if needed
 *   node upgrade-memory-schema.js --force  # Force migration even if fields exist
 */

import weaviate from 'weaviate-client';
import { SCHEMA } from '../src/schema.js';

const NEW_FIELDS = [
  'agentType',
  'model',
  'taskType',
  'parentSessionId',
  'cost',
  'inputTokens',
  'outputTokens'
];

async function getClient() {
  return await weaviate.connectToLocal({
    host: 'localhost',
    port: 8080,
    grpcPort: 50051
  });
}

// Get the ConversationMemory schema from SCHEMA
function getConversationMemorySchema() {
  const memoryClass = SCHEMA.classes.find(c => c.class === 'ConversationMemory');
  if (!memoryClass) {
    throw new Error('ConversationMemory not found in schema.js');
  }
  return memoryClass;
}

// Check if collection has all required fields
async function checkFields(client) {
  const collections = await client.collections.listAll();
  const memoryCollection = collections.find(c => c.name === 'ConversationMemory');

  if (!memoryCollection) {
    return { exists: false, missingFields: NEW_FIELDS };
  }

  // Get collection config to check properties
  const collection = client.collections.get('ConversationMemory');
  const config = await collection.config.get();

  const existingFields = config.properties.map(p => p.name);
  const missingFields = NEW_FIELDS.filter(f => !existingFields.includes(f));

  return {
    exists: true,
    missingFields,
    existingFields
  };
}

// Export all data from ConversationMemory
async function exportData(client) {
  console.log('   Exporting existing data...');
  const collection = client.collections.get('ConversationMemory');

  const data = [];
  const iterator = collection.iterator();

  for await (const item of iterator) {
    data.push(item.properties);
  }

  console.log(`   Exported ${data.length} records`);
  return data;
}

// Delete the collection
async function deleteCollection(client) {
  console.log('   Deleting old collection...');
  await client.collections.delete('ConversationMemory');
  console.log('   Collection deleted');
}

// Create collection with new schema
async function createCollection(client) {
  console.log('   Creating collection with new schema...');

  const memorySchema = getConversationMemorySchema();

  // Convert old schema format to v3 format
  const properties = memorySchema.properties.map(prop => {
    const p = {
      name: prop.name,
      dataType: prop.dataType[0] === 'text[]' ? 'text[]' : prop.dataType[0]
    };

    // Handle vectorizer config
    if (prop.moduleConfig?.['text2vec-transformers']?.skip) {
      p.skipVectorization = true;
    }

    return p;
  });

  await client.collections.create({
    name: 'ConversationMemory',
    description: memorySchema.description || 'Unified agent memory',
    vectorizers: weaviate.configure.vectorizer.text2VecTransformers({
      vectorizeCollectionName: false
    }),
    properties
  });

  console.log('   Collection created with new schema');
}

// Import data with default values for new fields
async function importData(client, data) {
  if (data.length === 0) {
    console.log('   No data to import');
    return;
  }

  console.log(`   Importing ${data.length} records...`);
  const collection = client.collections.get('ConversationMemory');

  let imported = 0;
  let errors = 0;

  for (const record of data) {
    try {
      // Add default values for new fields
      const enrichedRecord = {
        ...record,
        agentType: record.agentType || 'claude-code',
        model: record.model || 'unknown',
        taskType: record.taskType || 'conversation',
        parentSessionId: record.parentSessionId || null,
        cost: record.cost || 0,
        inputTokens: record.inputTokens || 0,
        outputTokens: record.outputTokens || 0
      };

      await collection.data.insert(enrichedRecord);
      imported++;

      if (imported % 100 === 0) {
        process.stdout.write('.');
      }
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`\n   Error importing record: ${err.message}`);
      }
    }
  }

  console.log(`\n   Imported: ${imported}, Errors: ${errors}`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  console.log('Memory Schema Upgrade');
  console.log('=====================\n');

  let client;
  try {
    client = await getClient();
    console.log('Connected to Weaviate\n');
  } catch (err) {
    console.error('Failed to connect to Weaviate:', err.message);
    console.log('\nMake sure Weaviate is running:');
    console.log('   cd /root/claude-toolkit/weaviate-rag && docker compose up -d');
    process.exit(1);
  }

  try {
    // Step 1: Check current state
    console.log('1. Checking ConversationMemory collection...');
    const { exists, missingFields, existingFields } = await checkFields(client);

    if (!exists) {
      console.log('   Collection does not exist');
      console.log('\n2. Creating new collection...');
      await createCollection(client);
      console.log('\nSchema upgrade complete (new collection created)');
      await client.close();
      return;
    }

    console.log(`   Collection exists with ${existingFields?.length || 0} fields`);
    console.log(`   Missing fields: ${missingFields.length > 0 ? missingFields.join(', ') : 'none'}`);

    if (missingFields.length === 0 && !force) {
      console.log('\nNo migration needed - all fields present');
      await client.close();
      return;
    }

    if (force) {
      console.log('\n   --force flag set, proceeding with migration...');
    }

    // Step 2: Export existing data
    console.log('\n2. Backing up data...');
    const data = await exportData(client);

    // Step 3: Delete collection
    console.log('\n3. Removing old collection...');
    await deleteCollection(client);

    // Step 4: Create with new schema
    console.log('\n4. Creating collection with updated schema...');
    await createCollection(client);

    // Step 5: Import data
    console.log('\n5. Restoring data with new fields...');
    await importData(client, data);

    console.log('\n=====================');
    console.log('Schema upgrade complete');
    console.log(`   Records migrated: ${data.length}`);
    console.log(`   New fields added: ${missingFields.join(', ') || 'none (force refresh)'}`);
    console.log('=====================\n');

  } catch (err) {
    console.error('\nMigration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
