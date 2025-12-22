#!/usr/bin/env node
/**
 * Document Indexer for Office Files
 *
 * Indexes: Markdown, Text, CSV, JSON (PDF/Word need external tools)
 * Uses Weaviate's DocChunk class for office document search
 *
 * Usage:
 *   node doc-indexer.js --folder /root/Documents --name "Legal Docs"
 *   node doc-indexer.js --folder /root/braccia-capital-trabajo --name "Braccia Work"
 */

import weaviate from 'weaviate-client';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, basename, relative } from 'path';
import { execFileSync } from 'child_process';

// Parse arguments
const args = process.argv.slice(2);
let folderPath = null;
let projectName = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--folder' && args[i + 1]) folderPath = args[i + 1];
  if (args[i] === '--name' && args[i + 1]) projectName = args[i + 1];
}

if (!folderPath) {
  console.log('Usage: node doc-indexer.js --folder <path> --name <project-name>');
  process.exit(1);
}

projectName = projectName || basename(folderPath);

// Supported file types
const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.csv', '.json'];

// Connect to Weaviate
async function getClient() {
  return await weaviate.connectToLocal({
    host: 'localhost',
    port: 8080,
    grpcPort: 50051
  });
}

// Extract text from different file types
function extractText(filePath) {
  const ext = extname(filePath).toLowerCase();

  try {
    switch (ext) {
      case '.md':
      case '.txt':
      case '.csv':
        return readFileSync(filePath, 'utf-8');

      case '.json':
        const json = JSON.parse(readFileSync(filePath, 'utf-8'));
        return JSON.stringify(json, null, 2);

      case '.pdf':
        // Use execFileSync safely with array arguments
        try {
          return execFileSync('pdftotext', [filePath, '-'], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        } catch {
          return `[PDF file - install poppler-utils: ${basename(filePath)}]`;
        }

      case '.docx':
        try {
          return execFileSync('pandoc', [filePath, '-t', 'plain'], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        } catch {
          return `[Word document - install pandoc: ${basename(filePath)}]`;
        }

      default:
        return null;
    }
  } catch (err) {
    console.error(`Error extracting ${filePath}: ${err.message}`);
    return null;
  }
}

// Find all documents recursively
function findDocuments(dir, maxDepth = 5, depth = 0) {
  if (depth > maxDepth) return [];

  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.name === 'node_modules') continue;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        results.push(...findDocuments(fullPath, maxDepth, depth + 1));
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (err) {
    // Skip inaccessible directories
  }

  return results;
}

// Chunk text into smaller pieces
function chunkText(text, maxChunkSize = 2000) {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Get document type from extension
function getDocType(filePath) {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.md': return 'markdown';
    case '.txt': return 'text';
    case '.pdf': return 'pdf';
    case '.docx': return 'word';
    case '.xlsx': return 'excel';
    case '.csv': return 'csv';
    case '.json': return 'json';
    default: return 'unknown';
  }
}

// Main indexing function
async function indexDocuments() {
  console.log('Document Indexer');
  console.log('================\n');

  if (!existsSync(folderPath)) {
    console.error(`Folder not found: ${folderPath}`);
    process.exit(1);
  }

  const client = await getClient();
  console.log('Connected to Weaviate\n');

  // Find all documents
  console.log(`Scanning: ${folderPath}`);
  const documents = findDocuments(folderPath);
  console.log(`Found ${documents.length} documents\n`);

  if (documents.length === 0) {
    console.log('No documents to index.');
    await client.close();
    return;
  }

  // Get DocChunk collection
  const collection = client.collections.get('DocChunk');

  // Delete existing chunks for this project
  console.log(`Clearing existing data for project: ${projectName}`);
  try {
    await collection.data.deleteMany(
      collection.filter.byProperty('project').equal(projectName)
    );
  } catch (err) {
    // Collection might be empty
  }

  // Index documents
  let totalChunks = 0;
  let errors = 0;

  for (const docPath of documents) {
    const relativePath = relative(folderPath, docPath);
    const title = basename(docPath);
    const docType = getDocType(docPath);

    process.stdout.write(`\rIndexing: ${relativePath.slice(0, 50).padEnd(50)}   `);

    const text = extractText(docPath);
    if (!text) {
      errors++;
      continue;
    }

    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk || chunk.length < 10) continue;

      try {
        await collection.data.insert({
          content: chunk,
          title: title,
          filePath: relativePath,
          project: projectName,
          docType: docType,
          section: chunks.length > 1 ? `Part ${i + 1}/${chunks.length}` : 'Full'
        });
        totalChunks++;
      } catch (err) {
        errors++;
      }
    }
  }

  console.log(`\n\n============================================================`);
  console.log(`Indexing complete!`);
  console.log(`Project: ${projectName}`);
  console.log(`Documents processed: ${documents.length}`);
  console.log(`Total chunks indexed: ${totalChunks}`);
  console.log(`Errors: ${errors}`);
  console.log(`============================================================\n`);

  await client.close();
}

// Run
indexDocuments().catch(console.error);
