#!/usr/bin/env node
/**
 * Index Session Script - Indexes Claude Code sessions into Weaviate memory
 */
import weaviate from 'weaviate-client';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CLAUDE_PROJECTS = join(homedir(), '.claude/projects');

async function getClient() {
  return await weaviate.connectToLocal({ host: 'localhost', port: 8080, grpcPort: 50051 });
}

function parseSession(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  const messages = [], filesModified = new Set(), toolsUsed = new Set();
  let summary = null;
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'summary' && entry.summary) summary = entry.summary;
      if (entry.type === 'user' || entry.type === 'assistant') {
        messages.push({ role: entry.type, content: typeof entry.message === 'string' ? entry.message : entry.message?.content || '' });
      }
      if (entry.type === 'assistant' && Array.isArray(entry.message)) {
        for (const block of entry.message) {
          if (block.type === 'tool_use') {
            toolsUsed.add(block.name);
            if (block.input?.file_path) filesModified.add(block.input.file_path);
          }
        }
      }
    } catch (err) { continue; }
  }
  return { messages, filesModified: Array.from(filesModified), toolsUsed: Array.from(toolsUsed), summary, messageCount: messages.length };
}

function generateSummary(parsed) {
  if (parsed.summary) return parsed.summary;
  const userMessages = parsed.messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  return userMessages.substring(0, 500) + '...';
}

function extractTopics(parsed) {
  const topics = new Set();
  const allContent = parsed.messages.map(m => m.content).join(' ').toLowerCase();
  const kw = { 'react': ['react','component'], 'typescript': ['typescript','interface'], 'database': ['supabase','postgres','sql'], 'weaviate': ['weaviate','vector','embedding'] };
  for (const [t, words] of Object.entries(kw)) { if (words.some(w => allContent.includes(w))) topics.add(t); }
  return Array.from(topics);
}

function findSessionFile(sessionId) {
  for (const dir of readdirSync(CLAUDE_PROJECTS)) {
    const p = join(CLAUDE_PROJECTS, dir);
    if (statSync(p).isDirectory()) {
      const f = join(p, sessionId + '.jsonl');
      if (existsSync(f)) return f;
    }
  }
  return existsSync(sessionId) ? sessionId : null;
}

function getSessionFiles(maxAgeHours = null) {
  const sessions = [], now = Date.now(), maxAge = maxAgeHours ? maxAgeHours * 3600000 : null;
  if (!existsSync(CLAUDE_PROJECTS)) return sessions;
  for (const dir of readdirSync(CLAUDE_PROJECTS)) {
    const projectPath = join(CLAUDE_PROJECTS, dir);
    try {
      if (!statSync(projectPath).isDirectory()) continue;
      for (const file of readdirSync(projectPath)) {
        if (!file.endsWith('.jsonl')) continue;
        const filePath = join(projectPath, file), fileStat = statSync(filePath);
        if (maxAge && (now - fileStat.mtimeMs) > maxAge) continue;
        sessions.push({ sessionId: file.replace('.jsonl', ''), filePath, mtime: fileStat.mtimeMs });
      }
    } catch (err) { continue; }
  }
  return sessions.sort((a, b) => b.mtime - a.mtime);
}

async function isSessionIndexed(client, sessionId) {
  try {
    const coll = client.collections.get('ConversationMemory');
    const r = await coll.query.fetchObjects({ limit: 1, filters: coll.filter.byProperty('sessionId').equal(sessionId) });
    return r.objects.length > 0;
  } catch { return false; }
}

async function indexSession(client, sessionId, filePath) {
  console.log('Indexing session:', sessionId);
  try {
    if (await isSessionIndexed(client, sessionId)) { console.log('  -> Already indexed'); return { skipped: true }; }
    const parsed = parseSession(filePath);
    if (parsed.messageCount < 2) { console.log('  -> Too few messages'); return { skipped: true }; }
    const summary = generateSummary(parsed), topics = extractTopics(parsed);
    const timestamp = new Date(statSync(filePath).mtimeMs).toISOString();
    const coll = client.collections.get('ConversationMemory');
    await coll.data.insert({ sessionId, summary, decisions: [], filesModified: parsed.filesModified, project: 'general', topics, timestamp, agentType: 'claude-code', model: 'unknown', taskType: 'chat', parentSessionId: null, cost: 0, inputTokens: 0, outputTokens: 0 });
    console.log('  -> Indexed:', summary.substring(0, 60) + '...');
    return { indexed: true };
  } catch (err) { console.error('  -> Error:', err.message); return { error: err.message }; }
}

async function indexRecentSessions(hours = 24) {
  console.log('\nIndexing sessions from last', hours, 'hours...\n');
  const client = await getClient(), sessions = getSessionFiles(hours);
  console.log('Found', sessions.length, 'session files\n');
  let indexed = 0, skipped = 0, errors = 0;
  for (const s of sessions) {
    const r = await indexSession(client, s.sessionId, s.filePath);
    if (r.indexed) indexed++; else if (r.skipped) skipped++; else if (r.error) errors++;
  }
  await client.close();
  console.log('\n=== Complete ===\nIndexed:', indexed, '\nSkipped:', skipped, '\nErrors:', errors);
}

async function indexAllSessions() {
  console.log('\nIndexing ALL sessions...\n');
  const client = await getClient(), sessions = getSessionFiles(null);
  console.log('Found', sessions.length, 'session files\n');
  let indexed = 0, skipped = 0, errors = 0;
  for (const s of sessions) {
    const r = await indexSession(client, s.sessionId, s.filePath);
    if (r.indexed) indexed++; else if (r.skipped) skipped++; else if (r.error) errors++;
  }
  await client.close();
  console.log('\n=== Complete ===\nIndexed:', indexed, '\nSkipped:', skipped, '\nErrors:', errors);
}

async function handleStdin() {
  const chunks = [];
  return new Promise(resolve => {
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', async () => {
      try {
        const input = JSON.parse(Buffer.concat(chunks).toString());
        if (input.session_id && input.transcript_path) {
          const client = await getClient();
          await indexSession(client, input.session_id, input.transcript_path);
          await client.close();
        }
      } catch (err) { console.error('Error:', err.message); }
      resolve();
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('\nUsage:\n  node index-session.js --session-id UUID\n  node index-session.js --recent [--hours N]\n  node index-session.js --all\n  node index-session.js --stdin\n');
    return;
  }
  if (args.includes('--stdin')) { await handleStdin(); return; }
  if (args.includes('--session-id')) {
    const sessionId = args[args.indexOf('--session-id') + 1];
    const filePath = findSessionFile(sessionId);
    if (!filePath) { console.error('Session not found:', sessionId); process.exit(1); }
    const client = await getClient();
    await indexSession(client, sessionId, filePath);
    await client.close();
    return;
  }
  if (args.includes('--all')) { await indexAllSessions(); return; }
  const hoursIdx = args.indexOf('--hours');
  const hours = hoursIdx >= 0 ? parseInt(args[hoursIdx + 1]) || 24 : 24;
  await indexRecentSessions(hours);
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
