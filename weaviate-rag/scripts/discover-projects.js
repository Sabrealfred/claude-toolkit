#!/usr/bin/env node
/**
 * Auto-discover projects in /root
 * Scans for directories with code files and generates config
 */

import { readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = '/root';
const CONFIG_PATH = '/root/weaviate-rag/config/projects.json';

// Folders to ignore
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  'snap', 'go', 'miniconda3', '.npm', '.nvm', '.vscode-server',
  '.local', '.config', '.ssh', 'Downloads', 'Documents',
  '.claude', '.ollama', '.docker', '.rustup', '.conda',
  'AndroidStudioProjects', 'datasets', 'imports', 'migrations',
  'reports', 'others', 'docs', 'contracts', '.venv'
]);

// Check if directory is a code project
function isCodeProject(dirPath) {
  try {
    const files = readdirSync(dirPath);

    // Has package.json (Node project)
    if (files.includes('package.json')) return { type: 'typescript', priority: 1 };

    // Has requirements.txt or setup.py (Python project)
    if (files.includes('requirements.txt') || files.includes('setup.py')) return { type: 'python', priority: 2 };

    // Has Cargo.toml (Rust project)
    if (files.includes('Cargo.toml')) return { type: 'rust', priority: 3 };

    // Has go.mod (Go project)
    if (files.includes('go.mod')) return { type: 'go', priority: 3 };

    // Check for src folder with code
    const srcPath = join(dirPath, 'src');
    if (existsSync(srcPath)) {
      const srcFiles = readdirSync(srcPath);
      if (srcFiles.some(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'))) {
        return { type: 'typescript', priority: 2 };
      }
      if (srcFiles.some(f => f.endsWith('.py'))) {
        return { type: 'python', priority: 2 };
      }
    }

    // Check for app folder (Next.js)
    const appPath = join(dirPath, 'app');
    if (existsSync(appPath)) {
      return { type: 'typescript', priority: 2 };
    }

    return null;
  } catch {
    return null;
  }
}

// Count code files
function countCodeFiles(dirPath, type) {
  let count = 0;
  const extensions = type === 'python' ? ['.py'] : ['.ts', '.tsx', '.js', '.jsx'];

  function scan(dir, depth = 0) {
    if (depth > 5) return; // Max depth
    try {
      const items = readdirSync(dir);
      for (const item of items) {
        if (IGNORE_DIRS.has(item)) continue;
        const fullPath = join(dir, item);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            scan(fullPath, depth + 1);
          } else if (extensions.some(ext => item.endsWith(ext))) {
            count++;
          }
        } catch {}
      }
    } catch {}
  }

  scan(dirPath);
  return count;
}

// Main discovery
function discoverProjects() {
  console.log('🔍 Discovering projects in /root...\n');

  const projects = [];
  const entries = readdirSync(ROOT_DIR);

  for (const entry of entries) {
    if (entry.startsWith('.') || IGNORE_DIRS.has(entry)) continue;

    const fullPath = join(ROOT_DIR, entry);

    try {
      const stat = statSync(fullPath);
      if (!stat.isDirectory()) continue;

      const projectInfo = isCodeProject(fullPath);
      if (!projectInfo) continue;

      const fileCount = countCodeFiles(fullPath, projectInfo.type);
      if (fileCount < 3) continue; // Skip tiny projects

      projects.push({
        name: entry,
        path: fullPath,
        language: projectInfo.type,
        priority: projectInfo.priority,
        fileCount
      });

      console.log(`  ✓ ${entry} (${projectInfo.type}, ${fileCount} files)`);
    } catch {}
  }

  // Sort by priority and file count
  projects.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.fileCount - a.fileCount;
  });

  console.log(`\n📦 Found ${projects.length} projects\n`);

  return projects;
}

// Generate config
function generateConfig(projects) {
  const config = {
    projects: projects.map((p, i) => ({
      name: p.name,
      path: p.path,
      language: p.language,
      priority: i + 1,
      fileCount: p.fileCount
    })),
    globalExclude: [
      'node_modules/**', 'dist/**', '.next/**', 'build/**',
      '**/*.min.js', '**/*.bundle.js', '**/vendor/**',
      '**/__snapshots__/**', '**/*.test.ts', '**/*.test.tsx',
      '**/*.spec.ts', '**/*.d.ts', '**/__pycache__/**'
    ],
    autoDiscovery: {
      enabled: true,
      lastRun: new Date().toISOString(),
      projectCount: projects.length
    }
  };

  return config;
}

// Save config
function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`💾 Saved config to ${CONFIG_PATH}`);
}

// Main
const projects = discoverProjects();
const config = generateConfig(projects);
saveConfig(config);

console.log('\n📊 Top 10 projects by size:');
projects.slice(0, 10).forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name} - ${p.fileCount} files (${p.language})`);
});
