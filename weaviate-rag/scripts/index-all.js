#!/usr/bin/env node
/**
 * Index all configured projects into Weaviate
 * Usage: node index-all.js [--skip project1,project2]
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, '../config/projects.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

// Parse args
const args = process.argv.slice(2);
let skipProjects = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--skip' && args[i + 1]) {
    skipProjects = args[++i].split(',');
  }
}

function runIndexer(project) {
  return new Promise((resolve, reject) => {
    const indexerPath = join(__dirname, 'indexer.js');
    const child = spawn('node', [indexerPath, '--project', project.name, '--path', project.path], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Weaviate RAG - Index All Projects');
  console.log('='.repeat(60));
  console.log(`\nFound ${config.projects.length} projects to index\n`);

  if (skipProjects.length > 0) {
    console.log(`Skipping: ${skipProjects.join(', ')}\n`);
  }

  const results = [];

  for (const project of config.projects) {
    if (skipProjects.includes(project.name)) {
      console.log(`>> Skipping ${project.name}`);
      results.push({ name: project.name, status: 'skipped' });
      continue;
    }

    console.log(`\n${'-'.repeat(60)}`);
    console.log(`Indexing: ${project.name}`);
    console.log(`   Path: ${project.path}`);
    console.log(`   Language: ${project.language}`);
    console.log('-'.repeat(60));

    try {
      const startTime = Date.now();
      await runIndexer(project);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Done: ${project.name} completed in ${duration}s`);
      results.push({ name: project.name, status: 'success', duration });
    } catch (error) {
      console.error(`Failed: ${project.name} - ${error.message}`);
      results.push({ name: project.name, status: 'failed', error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('INDEXING SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const skipped = results.filter(r => r.status === 'skipped');

  console.log(`\nSuccessful: ${successful.length}`);
  for (const r of successful) {
    console.log(`   - ${r.name} (${r.duration}s)`);
  }

  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.length}`);
    for (const r of failed) {
      console.log(`   - ${r.name}: ${r.error}`);
    }
  }

  if (skipped.length > 0) {
    console.log(`\nSkipped: ${skipped.length}`);
    for (const r of skipped) {
      console.log(`   - ${r.name}`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
