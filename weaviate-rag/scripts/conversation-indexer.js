#!/usr/bin/env node
/**
 * Conversation Indexer
 *
 * Indexes Claude Code conversation history into Weaviate
 * for semantic search of past sessions.
 *
 * Usage:
 *   node conversation-indexer.js                    # Index all projects
 *   node conversation-indexer.js --project matwal   # Index specific project
 */

import weaviate from 'weaviate-client';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const CLAUDE_PROJECTS = process.env.HOME + '/.claude/projects';

async function getClient() {
  return await weaviate.connectToLocal({
    host: 'localhost',
    port: 8080,
    grpcPort: 50051
  });
}

// Parse JSONL file and extract conversation
function parseConversation(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  const messages = [];
  let firstTimestamp = null;
  let lastTimestamp = null;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);

      if (entry.type === 'user' && entry.message?.content) {
        messages.push({ role: 'user', content: entry.message.content });
        if (!firstTimestamp && entry.timestamp) firstTimestamp = entry.timestamp;
        lastTimestamp = entry.timestamp;
      }

      if (entry.type === 'assistant' && entry.message?.content) {
        // Assistant content is an array
        const textContent = entry.message.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');
        if (textContent) {
          messages.push({ role: 'assistant', content: textContent });
          lastTimestamp = entry.timestamp;
        }
      }
    } catch (e) {
      // Skip invalid lines
    }
  }

  return { messages, firstTimestamp, lastTimestamp };
}

// Create a summary of the conversation
function summarizeConversation(messages) {
  if (messages.length === 0) return '';

  // Get user messages for topic extraction
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n');

  // First user message is usually the main topic
  const mainTopic = messages.find(m => m.role === 'user')?.content || '';

  // Get key points (first 500 chars of each user message)
  const keyPoints = messages
    .filter(m => m.role === 'user')
    .slice(0, 5)
    .map(m => m.content.substring(0, 200))
    .join(' | ');

  return {
    mainTopic: mainTopic.substring(0, 500),
    keyPoints: keyPoints.substring(0, 1000),
    fullContent: userMessages.substring(0, 3000)
  };
}

// Index conversations into Weaviate
async function indexConversations(projectFilter = null) {
  console.log('Conversation Indexer');
  console.log('====================\n');

  if (!existsSync(CLAUDE_PROJECTS)) {
    console.error('Claude projects directory not found:', CLAUDE_PROJECTS);
    process.exit(1);
  }

  const client = await getClient();
  console.log('Connected to Weaviate\n');

  // Check if ConversationMemory exists
  const exists = await client.collections.exists('ConversationMemory');
  if (!exists) {
    console.error('ConversationMemory collection not found. Create it first.');
    await client.close();
    process.exit(1);
  }

  const collection = client.collections.get('ConversationMemory');

  // Find all project directories
  const projectDirs = readdirSync(CLAUDE_PROJECTS, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let totalIndexed = 0;
  let errors = 0;

  for (const projectDir of projectDirs) {
    // Extract project name from dir (e.g., "-root-matwal-premium" -> "matwal-premium")
    const projectName = projectDir.replace(/^-root-?/, '').replace(/-/g, '/') || 'root';

    if (projectFilter && !projectName.includes(projectFilter)) {
      continue;
    }

    const projectPath = join(CLAUDE_PROJECTS, projectDir);

    // Find all conversation files (UUIDs.jsonl)
    const convFiles = readdirSync(projectPath)
      .filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'))
      .filter(f => f.match(/^[a-f0-9-]+\.jsonl$/));

    console.log(`\nProject: ${projectName} (${convFiles.length} conversations)`);

    for (const convFile of convFiles) {
      const sessionId = convFile.replace('.jsonl', '');
      const filePath = join(projectPath, convFile);

      try {
        // Check if already indexed
        const existing = await collection.query.fetchObjects({
          filters: collection.filter.byProperty('sessionId').equal(sessionId),
          limit: 1
        });

        if (existing.objects.length > 0) {
          process.stdout.write('.');
          continue;
        }

        const { messages, firstTimestamp, lastTimestamp } = parseConversation(filePath);

        if (messages.length < 2) {
          process.stdout.write('x');
          continue;
        }

        const summary = summarizeConversation(messages);

        await collection.data.insert({
          sessionId,
          summary: summary.mainTopic + '\n\n' + summary.keyPoints,
          decisions: [], // Could extract with LLM later
          filesModified: [],
          project: projectName,
          topics: [],
          timestamp: lastTimestamp || new Date().toISOString()
        });

        process.stdout.write('+');
        totalIndexed++;

      } catch (err) {
        process.stdout.write('E');
        errors++;
      }
    }
  }

  console.log(`\n\n====================`);
  console.log(`Indexed: ${totalIndexed} conversations`);
  console.log(`Errors: ${errors}`);
  console.log(`====================\n`);

  await client.close();
}

// CLI
const args = process.argv.slice(2);
const projectIdx = args.indexOf('--project');
const projectFilter = projectIdx >= 0 ? args[projectIdx + 1] : null;

indexConversations(projectFilter).catch(console.error);
