#!/usr/bin/env node
/**
 * Auto-indexer for Weaviate RAG
 *
 * Usage:
 *   node auto-index.js                    # Index all discovered projects
 *   node auto-index.js --watch            # Watch for changes and re-index
 *   node auto-index.js --project myproj   # Index specific project
 *   node auto-index.js --top 10           # Index top 10 projects by size
 */

import { spawn } from 'child_process';
import { readFileSync, watch, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_PATH = join(__dirname, '../config/projects.json');
const INDEXER_PATH = join(__dirname, 'indexer.js');

// Parse args
const args = process.argv.slice(2);
let watchMode = args.includes('--watch');
let topN = null;
let specificProject = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--top' && args[i + 1]) topN = parseInt(args[i + 1]);
  if (args[i] === '--project' && args[i + 1]) specificProject = args[i + 1];
}

// Load config
function loadConfig() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  return config.projects || [];
}

// Index a single project
function indexProject(project) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📦 Indexing: ${project.name}`);
    console.log(`   Path: ${project.path}`);
    console.log(`   Language: ${project.language}`);
    console.log(`   Files: ${project.fileCount}`);
    console.log('─'.repeat(60));

    const startTime = Date.now();

    const child = spawn('node', [INDEXER_PATH, '--project', project.name, '--path', project.path], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code === 0) {
        console.log(`✅ ${project.name} completed in ${duration}s`);
        resolve({ name: project.name, status: 'success', duration });
      } else {
        console.log(`❌ ${project.name} failed`);
        resolve({ name: project.name, status: 'failed' });
      }
    });

    child.on('error', (err) => {
      console.error(`❌ ${project.name} error:`, err.message);
      resolve({ name: project.name, status: 'error', error: err.message });
    });
  });
}

// Index all projects
async function indexAll() {
  let projects = loadConfig();

  // Filter TypeScript only for now (Python support coming)
  projects = projects.filter(p => p.language === 'typescript');

  if (specificProject) {
    projects = projects.filter(p => p.name === specificProject);
  }

  if (topN) {
    projects = projects.slice(0, topN);
  }

  console.log('═'.repeat(60));
  console.log('WEAVIATE RAG - AUTO INDEXER');
  console.log('═'.repeat(60));
  console.log(`\nProjects to index: ${projects.length}\n`);

  const results = [];

  for (const project of projects) {
    // Skip very large projects in batch mode
    if (!specificProject && project.fileCount > 2000) {
      console.log(`⏭️  Skipping ${project.name} (${project.fileCount} files - too large)`);
      continue;
    }

    const result = await indexProject(project);
    results.push(result);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('INDEXING SUMMARY');
  console.log('═'.repeat(60));

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');

  console.log(`\n✅ Successful: ${successful.length}`);
  successful.forEach(r => console.log(`   - ${r.name} (${r.duration}s)`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.name}`));
  }

  return results;
}

// Watch mode
async function watchProjects() {
  console.log('👀 Watch mode enabled\n');
  console.log('Watching for changes in project directories...\n');

  const projects = loadConfig().filter(p => p.language === 'typescript');
  const debounceTimers = new Map();

  for (const project of projects.slice(0, 10)) { // Watch top 10
    if (!existsSync(project.path)) continue;

    const srcPath = join(project.path, 'src');
    const appPath = join(project.path, 'app');
    const watchPath = existsSync(srcPath) ? srcPath : existsSync(appPath) ? appPath : project.path;

    try {
      watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        if (!filename.match(/\.(ts|tsx|js|jsx)$/)) return;
        if (filename.includes('node_modules')) return;

        // Debounce - wait 5 seconds after last change
        if (debounceTimers.has(project.name)) {
          clearTimeout(debounceTimers.get(project.name));
        }

        debounceTimers.set(project.name, setTimeout(async () => {
          console.log(`\n📝 Change detected in ${project.name}: ${filename}`);
          await indexProject(project);
          debounceTimers.delete(project.name);
        }, 5000));
      });

      console.log(`  👁️  Watching: ${project.name}`);
    } catch (err) {
      console.log(`  ⚠️  Cannot watch: ${project.name}`);
    }
  }

  console.log('\nPress Ctrl+C to stop watching.\n');

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watcher...');
    process.exit(0);
  });
}

// Main
if (watchMode) {
  await indexAll(); // Initial index
  await watchProjects();
} else {
  await indexAll();
}
