#!/usr/bin/env node
/**
 * Weaviate RAG Daemon
 *
 * Runs as a background service that:
 * 1. Watches for file changes in indexed projects
 * 2. Re-indexes changed projects automatically
 * 3. Discovers new projects periodically
 *
 * Usage:
 *   node daemon.js start     # Start daemon
 *   node daemon.js stop      # Stop daemon
 *   node daemon.js status    # Check status
 */

import { spawn, fork } from 'child_process';
import { existsSync, readFileSync, writeFileSync, watch, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PID_FILE = '/tmp/weaviate-rag-daemon.pid';
const LOG_FILE = '/tmp/weaviate-rag-daemon.log';
const CONFIG_PATH = join(__dirname, '../config/projects.json');

// Check if daemon is running
function isDaemonRunning() {
  if (!existsSync(PID_FILE)) return false;

  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8'));
    process.kill(pid, 0); // Check if process exists
    return true;
  } catch {
    return false;
  }
}

// Log message
function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  writeFileSync(LOG_FILE, line, { flag: 'a' });
  console.log(line.trim());
}

// Run indexer for a project
function indexProject(projectName, projectPath) {
  return new Promise((resolve) => {
    log(`Re-indexing: ${projectName}`);

    const child = spawn('node', [
      join(__dirname, 'indexer.js'),
      '--project', projectName,
      '--path', projectPath
    ], { stdio: 'ignore' });

    child.on('close', (code) => {
      if (code === 0) {
        log(`Completed: ${projectName}`);
      } else {
        log(`Failed: ${projectName} (exit code ${code})`);
      }
      resolve();
    });
  });
}

// Main daemon loop
async function runDaemon() {
  log('=== Weaviate RAG Daemon Started ===');

  // Save PID
  writeFileSync(PID_FILE, process.pid.toString());

  // Load config
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  const projects = config.projects.filter(p => p.language === 'typescript').slice(0, 15);

  log(`Monitoring ${projects.length} projects`);

  // Track pending re-indexes
  const pendingReindex = new Map();

  // Watch each project
  for (const project of projects) {
    if (!existsSync(project.path)) continue;

    const srcPath = join(project.path, 'src');
    const appPath = join(project.path, 'app');
    const watchPath = existsSync(srcPath) ? srcPath : existsSync(appPath) ? appPath : null;

    if (!watchPath) continue;

    try {
      watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        if (!filename.match(/\.(ts|tsx)$/)) return;
        if (filename.includes('node_modules') || filename.includes('.d.ts')) return;

        // Debounce - wait 30 seconds after last change
        if (pendingReindex.has(project.name)) {
          clearTimeout(pendingReindex.get(project.name));
        }

        log(`Change detected: ${project.name}/${filename}`);

        pendingReindex.set(project.name, setTimeout(async () => {
          await indexProject(project.name, project.path);
          pendingReindex.delete(project.name);
        }, 30000)); // Wait 30s for batch changes
      });

      log(`Watching: ${project.name}`);
    } catch (err) {
      log(`Cannot watch: ${project.name} - ${err.message}`);
    }
  }

  // Periodic full re-discovery (every 6 hours)
  setInterval(async () => {
    log('Running periodic discovery...');
    try {
      spawn('node', [join(__dirname, 'discover-projects.js')], { stdio: 'ignore' });
    } catch (err) {
      log(`Discovery error: ${err.message}`);
    }
  }, 6 * 60 * 60 * 1000);

  // Keep alive
  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...');
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
    process.exit(0);
  });

  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...');
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
    process.exit(0);
  });
}

// Commands
const command = process.argv[2];

switch (command) {
  case 'start':
    if (isDaemonRunning()) {
      console.log('Daemon is already running');
      process.exit(1);
    }

    // Fork to background
    if (process.env.DAEMON_CHILD !== 'true') {
      const child = spawn('node', [__filename, 'start'], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, DAEMON_CHILD: 'true' }
      });
      child.unref();
      console.log(`Daemon started with PID ${child.pid}`);
      console.log(`Logs: tail -f ${LOG_FILE}`);
      process.exit(0);
    } else {
      runDaemon();
    }
    break;

  case 'stop':
    if (!isDaemonRunning()) {
      console.log('Daemon is not running');
      process.exit(1);
    }

    const pid = parseInt(readFileSync(PID_FILE, 'utf-8'));
    process.kill(pid, 'SIGTERM');
    console.log(`Stopped daemon (PID ${pid})`);
    break;

  case 'status':
    if (isDaemonRunning()) {
      const pid = readFileSync(PID_FILE, 'utf-8');
      console.log(`Daemon is running (PID ${pid})`);
      console.log(`\nRecent logs:`);
      try {
        const logs = readFileSync(LOG_FILE, 'utf-8').split('\n').slice(-10);
        logs.forEach(l => console.log(l));
      } catch {}
    } else {
      console.log('Daemon is not running');
    }
    break;

  default:
    console.log('Usage: node daemon.js [start|stop|status]');
    console.log('');
    console.log('Commands:');
    console.log('  start   Start the daemon in background');
    console.log('  stop    Stop the running daemon');
    console.log('  status  Check daemon status and recent logs');
}
