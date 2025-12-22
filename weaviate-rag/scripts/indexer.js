#!/usr/bin/env node
/**
 * Code Indexer for Weaviate RAG
 *
 * Indexes TypeScript/JavaScript codebases with intelligent chunking.
 * Usage:
 *   node indexer.js --project matwal-premium --path /root/matwal-premium
 *   node indexer.js --config ../config/projects.json
 */

import weaviate from 'weaviate-ts-client';
import { glob } from 'glob';
import { readFileSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { parseFile } from '../src/parser.js';
import { SCHEMA } from '../src/schema.js';

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || 'http://localhost:8080';
const BATCH_SIZE = 50;

// Parse CLI arguments
const args = process.argv.slice(2);
let projectName = null;
let projectPath = null;
let configPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    projectName = args[i + 1];
    i++;
  } else if (args[i] === '--path' && args[i + 1]) {
    projectPath = args[i + 1];
    i++;
  } else if (args[i] === '--config' && args[i + 1]) {
    configPath = args[i + 1];
    i++;
  }
}

/**
 * Initialize Weaviate client
 */
async function initClient() {
  const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  // Check if schema exists, create if not
  try {
    const schema = await client.schema.getter().do();
    const existingClasses = schema.classes?.map((c) => c.class) || [];

    for (const classDef of SCHEMA.classes) {
      if (!existingClasses.includes(classDef.class)) {
        console.log(`Creating class: ${classDef.class}`);
        await client.schema.classCreator().withClass(classDef).do();
      }
    }
  } catch (error) {
    console.error('Error initializing schema:', error.message);
    throw error;
  }

  return client;
}

/**
 * Get files to index based on project config
 */
async function getFilesToIndex(projectPath, includes, excludes) {
  const allFiles = [];

  for (const pattern of includes) {
    const files = await glob(pattern, {
      cwd: projectPath,
      absolute: false,
      ignore: excludes,
    });
    allFiles.push(...files);
  }

  return [...new Set(allFiles)];
}

/**
 * Index a single project
 */
async function indexProject(client, project) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Indexing project: ${project.name}`);
  console.log(`Path: ${project.path}`);
  console.log('='.repeat(60));

  const includes = project.include || ['src/**/*.ts', 'src/**/*.tsx'];
  const excludes = project.exclude || ['node_modules/**', 'dist/**'];

  const files = await getFilesToIndex(project.path, includes, excludes);
  console.log(`Found ${files.length} files to index`);

  let totalChunks = 0;
  let errorCount = 0;
  const batch = [];

  for (const file of files) {
    const fullPath = join(project.path, file);

    try {
      // Skip if not a TS/TSX/JS file
      const ext = extname(file);
      if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) continue;

      // Parse file into chunks
      const chunks = parseFile(fullPath, project.name);

      for (const chunk of chunks) {
        // Prepare object for Weaviate
        const weaviateObj = {
          class: chunk.type,
          properties: {
            content: chunk.content,
            name: chunk.name,
            filePath: relative(project.path, fullPath),
            project: project.name,
            chunkType: chunk.chunkType,
            language: chunk.language || 'typescript',
            lineStart: chunk.lineStart,
            lineEnd: chunk.lineEnd,
            lineCount: chunk.lineCount,
            jsDoc: chunk.jsDoc || '',
            signature: chunk.signature || '',
            isExported: chunk.isExported || false,
            isAsync: chunk.isAsync || false,
            complexity: chunk.complexity || 1,
            exports: chunk.fileExports || [],
            imports: chunk.imports || [],
            dependencies: chunk.dependencies || [],
            usedTypes: chunk.usedTypes || [],
          },
        };

        // Handle TypeDefinition specific fields
        if (chunk.type === 'TypeDefinition') {
          weaviateObj.properties.typeKind = chunk.typeKind;
          weaviateObj.properties.properties = chunk.properties || [];
          weaviateObj.properties.extendsTypes = chunk.extendsTypes || [];
          weaviateObj.properties.fromDatabase = chunk.fromDatabase || false;
        }

        batch.push(weaviateObj);
        totalChunks++;

        // Send batch when full
        if (batch.length >= BATCH_SIZE) {
          await sendBatch(client, batch);
          batch.length = 0;
          process.stdout.write(`\rIndexed ${totalChunks} chunks...`);
        }
      }
    } catch (error) {
      errorCount++;
      console.error(`\nError parsing ${file}: ${error.message}`);
    }
  }

  // Send remaining batch
  if (batch.length > 0) {
    await sendBatch(client, batch);
  }

  console.log(`\n\nCompleted indexing ${project.name}:`);
  console.log(`  - Total chunks: ${totalChunks}`);
  console.log(`  - Errors: ${errorCount}`);

  return { totalChunks, errorCount };
}

/**
 * Send batch to Weaviate
 */
async function sendBatch(client, batch) {
  try {
    // Group by class
    const byClass = {};
    for (const obj of batch) {
      if (!byClass[obj.class]) byClass[obj.class] = [];
      byClass[obj.class].push(obj.properties);
    }

    // Insert each class
    for (const [className, objects] of Object.entries(byClass)) {
      let batcher = client.batch.objectsBatcher();

      for (const obj of objects) {
        batcher = batcher.withObject({
          class: className,
          properties: obj,
        });
      }

      await batcher.do();
    }
  } catch (error) {
    console.error('Batch error:', error.message);
  }
}

/**
 * Clear existing data for a project
 */
async function clearProject(client, projectName) {
  console.log(`Clearing existing data for project: ${projectName}`);

  const classes = ['CodeChunk', 'DocChunk', 'TypeDefinition', 'FileMetadata'];

  for (const className of classes) {
    try {
      await client.batch
        .objectsBatchDeleter()
        .withClassName(className)
        .withWhere({
          path: ['project'],
          operator: 'Equal',
          valueText: projectName,
        })
        .do();
    } catch (error) {
      // Class might not exist yet
    }
  }
}

/**
 * Main
 */
async function main() {
  console.log('Weaviate Code Indexer');
  console.log('=====================\n');

  // Load config or use CLI args
  let projects = [];

  if (configPath) {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    projects = config.projects;
  } else if (projectName && projectPath) {
    projects = [
      {
        name: projectName,
        path: projectPath,
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['node_modules/**', 'dist/**', '*.test.ts', '*.test.tsx'],
      },
    ];
  } else {
    console.error('Usage:');
    console.error('  node indexer.js --project <name> --path <path>');
    console.error('  node indexer.js --config <config.json>');
    process.exit(1);
  }

  // Initialize client
  const client = await initClient();
  console.log('Connected to Weaviate');

  // Index each project
  let grandTotal = 0;
  let grandErrors = 0;

  for (const project of projects) {
    // Clear old data
    await clearProject(client, project.name);

    // Index
    const { totalChunks, errorCount } = await indexProject(client, project);
    grandTotal += totalChunks;
    grandErrors += errorCount;
  }

  console.log('\n' + '='.repeat(60));
  console.log('INDEXING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total chunks indexed: ${grandTotal}`);
  console.log(`Total errors: ${grandErrors}`);
}

main().catch(console.error);
