#!/usr/bin/env node
/**
 * Memory Compaction Module
 *
 * Automatic memory summarization for the Weaviate RAG system.
 * Groups old memories by project and uses LLM to create compacted summaries.
 *
 * Usage:
 *   node memory-compaction.js                     # Default: 30 days, min 5 memories
 *   node memory-compaction.js --days 14           # Compact memories older than 14 days
 *   node memory-compaction.js --min-group 3       # Minimum 3 memories to form a group
 *   node memory-compaction.js --dry-run           # Preview without making changes
 *
 * Environment:
 *   OPENROUTER_API_KEY - Required for LLM summarization
 */

import weaviate from 'weaviate-client';

const WEAVIATE_HOST = 'localhost';
const WEAVIATE_PORT = 8080;
const WEAVIATE_GRPC = 50051;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SUMMARIZATION_MODEL = 'meta-llama/llama-3.3-70b-instruct'; // Fast and cheap

/**
 * Get Weaviate client connection
 */
async function getClient() {
  return await weaviate.connectToLocal({
    host: WEAVIATE_HOST,
    port: WEAVIATE_PORT,
    grpcPort: WEAVIATE_GRPC
  });
}

/**
 * Call OpenRouter API for LLM summarization
 */
async function callLLM(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://claude-toolkit.local',
      'X-Title': 'Memory Compaction'
    },
    body: JSON.stringify({
      model: options.model || SUMMARIZATION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2048
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Fetch old memories from Weaviate
 * @param {number} olderThanDays - Fetch memories older than this many days
 * @returns {Promise<Array>} Array of memory objects with their UUIDs
 */
async function fetchOldMemories(olderThanDays) {
  const client = await getClient();
  const collection = client.collections.get('ConversationMemory');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await collection.query.fetchObjects({
    limit: 1000, // Reasonable batch size
    returnProperties: [
      'sessionId',
      'summary',
      'decisions',
      'filesModified',
      'project',
      'topics',
      'timestamp',
      'agentType',
      'model',
      'taskType',
      'cost',
      'inputTokens',
      'outputTokens'
    ],
    filters: collection.filter.byProperty('timestamp').lessThan(cutoffDate.toISOString())
  });

  await client.close();

  return result.objects.map(obj => ({
    uuid: obj.uuid,
    sessionId: obj.properties.sessionId,
    summary: obj.properties.summary || '',
    decisions: obj.properties.decisions || [],
    filesModified: obj.properties.filesModified || [],
    project: obj.properties.project || 'general',
    topics: obj.properties.topics || [],
    timestamp: obj.properties.timestamp,
    agentType: obj.properties.agentType || 'unknown',
    model: obj.properties.model || 'unknown',
    taskType: obj.properties.taskType || 'chat',
    cost: obj.properties.cost || 0,
    inputTokens: obj.properties.inputTokens || 0,
    outputTokens: obj.properties.outputTokens || 0
  }));
}

/**
 * Group memories by project
 * @param {Array} memories - Array of memory objects
 * @returns {Object} Object with project names as keys and arrays of memories as values
 */
function groupMemoriesByProject(memories) {
  const groups = {};

  for (const memory of memories) {
    const project = memory.project || 'general';
    if (!groups[project]) {
      groups[project] = [];
    }
    groups[project].push(memory);
  }

  return groups;
}

/**
 * Extract important information that must be preserved
 * @param {Array} memories - Array of memories to analyze
 * @returns {Object} Object containing preserved decisions and files
 */
function extractImportantInfo(memories) {
  const allDecisions = new Set();
  const allFiles = new Set();
  const allTopics = new Set();
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const models = new Set();
  const agentTypes = new Set();
  const taskTypes = new Set();

  for (const memory of memories) {
    // Collect all decisions
    if (memory.decisions && memory.decisions.length > 0) {
      memory.decisions.forEach(d => allDecisions.add(d));
    }

    // Collect all modified files
    if (memory.filesModified && memory.filesModified.length > 0) {
      memory.filesModified.forEach(f => allFiles.add(f));
    }

    // Collect all topics
    if (memory.topics && memory.topics.length > 0) {
      memory.topics.forEach(t => allTopics.add(t));
    }

    // Aggregate costs
    totalCost += memory.cost || 0;
    totalInputTokens += memory.inputTokens || 0;
    totalOutputTokens += memory.outputTokens || 0;

    // Collect metadata
    if (memory.model && memory.model !== 'unknown') models.add(memory.model);
    if (memory.agentType && memory.agentType !== 'unknown') agentTypes.add(memory.agentType);
    if (memory.taskType) taskTypes.add(memory.taskType);
  }

  return {
    decisions: Array.from(allDecisions),
    filesModified: Array.from(allFiles),
    topics: Array.from(allTopics),
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    models: Array.from(models),
    agentTypes: Array.from(agentTypes),
    taskTypes: Array.from(taskTypes)
  };
}

/**
 * Generate a compacted summary using LLM
 * @param {string} project - Project name
 * @param {Array} memories - Array of memories to summarize
 * @param {Object} importantInfo - Extracted important information
 * @returns {Promise<string>} Compacted summary text
 */
async function generateCompactedSummary(project, memories, importantInfo) {
  const systemPrompt = `You are a technical documentation assistant. Your task is to create a concise but comprehensive summary of multiple AI assistant session memories for a software project.

CRITICAL REQUIREMENTS:
1. Preserve ALL key technical decisions and their reasoning
2. Preserve ALL important file references
3. Group related work together thematically
4. Use clear, professional technical language
5. Include dates/timeframes when relevant
6. Do NOT lose any critical implementation details
7. Format as a cohesive narrative, not a list of sessions

OUTPUT FORMAT:
Start with a brief overview, then organized sections by theme/feature. End with a "Key Decisions" summary if there are important architectural or design decisions.`;

  const memorySummaries = memories.map((m, i) => {
    const date = m.timestamp ? new Date(m.timestamp).toISOString().split('T')[0] : 'unknown date';
    const decisions = m.decisions?.length > 0 ? `\nDecisions: ${m.decisions.join('; ')}` : '';
    const files = m.filesModified?.length > 0 ? `\nFiles: ${m.filesModified.join(', ')}` : '';
    return `--- Session ${i + 1} (${date}) ---\n${m.summary}${decisions}${files}`;
  }).join('\n\n');

  const userPrompt = `Create a compacted summary for the "${project}" project from these ${memories.length} session memories:

${memorySummaries}

---
PRESERVED INFORMATION (must be included):
- Key Decisions: ${importantInfo.decisions.length > 0 ? importantInfo.decisions.join('; ') : 'None recorded'}
- Modified Files: ${importantInfo.filesModified.length > 0 ? importantInfo.filesModified.slice(0, 20).join(', ') + (importantInfo.filesModified.length > 20 ? ` (+${importantInfo.filesModified.length - 20} more)` : '') : 'None recorded'}
- Topics: ${importantInfo.topics.length > 0 ? importantInfo.topics.join(', ') : 'None recorded'}
- Agent Types Used: ${importantInfo.agentTypes.join(', ') || 'Unknown'}
- Models Used: ${importantInfo.models.join(', ') || 'Unknown'}
- Task Types: ${importantInfo.taskTypes.join(', ') || 'Unknown'}

Create a comprehensive but concise summary that preserves all important technical details.`;

  try {
    const summary = await callLLM(systemPrompt, userPrompt);
    return summary;
  } catch (error) {
    console.error(`[WARN] LLM summarization failed: ${error.message}`);
    // Fallback: create a basic summary
    return createFallbackSummary(project, memories, importantInfo);
  }
}

/**
 * Create a fallback summary when LLM is unavailable
 */
function createFallbackSummary(project, memories, importantInfo) {
  const dateRange = getDateRange(memories);

  let summary = `# Compacted Memory: ${project}\n`;
  summary += `Period: ${dateRange.start} to ${dateRange.end}\n`;
  summary += `Sessions compacted: ${memories.length}\n\n`;

  summary += `## Overview\n`;
  summary += memories.slice(0, 10).map(m => `- ${m.summary?.substring(0, 200) || 'No summary'}...`).join('\n');
  if (memories.length > 10) {
    summary += `\n- ... and ${memories.length - 10} more sessions`;
  }
  summary += '\n\n';

  if (importantInfo.decisions.length > 0) {
    summary += `## Key Decisions\n`;
    summary += importantInfo.decisions.map(d => `- ${d}`).join('\n');
    summary += '\n\n';
  }

  if (importantInfo.filesModified.length > 0) {
    summary += `## Files Modified\n`;
    summary += importantInfo.filesModified.slice(0, 30).join(', ');
    if (importantInfo.filesModified.length > 30) {
      summary += ` (+${importantInfo.filesModified.length - 30} more)`;
    }
    summary += '\n';
  }

  return summary;
}

/**
 * Get the date range of memories
 */
function getDateRange(memories) {
  const dates = memories
    .map(m => m.timestamp ? new Date(m.timestamp) : null)
    .filter(d => d && !isNaN(d));

  if (dates.length === 0) {
    return { start: 'unknown', end: 'unknown' };
  }

  const sorted = dates.sort((a, b) => a - b);
  return {
    start: sorted[0].toISOString().split('T')[0],
    end: sorted[sorted.length - 1].toISOString().split('T')[0]
  };
}

/**
 * Save a compacted memory to Weaviate
 * @param {Object} compactedMemory - The compacted memory object
 * @returns {Promise<string>} UUID of the created memory
 */
async function saveCompactedMemory(compactedMemory) {
  const client = await getClient();
  const collection = client.collections.get('ConversationMemory');

  const result = await collection.data.insert({
    sessionId: compactedMemory.sessionId,
    summary: compactedMemory.summary,
    decisions: compactedMemory.decisions,
    filesModified: compactedMemory.filesModified,
    project: compactedMemory.project,
    topics: compactedMemory.topics,
    timestamp: compactedMemory.timestamp,
    agentType: 'memory-compaction',
    model: SUMMARIZATION_MODEL,
    taskType: 'compaction',
    parentSessionId: '',
    cost: compactedMemory.cost,
    inputTokens: compactedMemory.inputTokens,
    outputTokens: compactedMemory.outputTokens
  });

  await client.close();
  return result;
}

/**
 * Delete memories by their UUIDs
 * @param {Array<string>} uuids - Array of UUIDs to delete
 * @returns {Promise<number>} Number of deleted memories
 */
async function deleteMemories(uuids) {
  if (uuids.length === 0) return 0;

  const client = await getClient();
  const collection = client.collections.get('ConversationMemory');

  let deleted = 0;

  // Delete in batches of 100
  const batchSize = 100;
  for (let i = 0; i < uuids.length; i += batchSize) {
    const batch = uuids.slice(i, i + batchSize);

    for (const uuid of batch) {
      try {
        await collection.data.deleteById(uuid);
        deleted++;
      } catch (error) {
        console.error(`[WARN] Failed to delete memory ${uuid}: ${error.message}`);
      }
    }
  }

  await client.close();
  return deleted;
}

/**
 * Main compaction function
 * @param {Object} options - Compaction options
 * @param {number} options.olderThanDays - Compact memories older than this (default: 30)
 * @param {number} options.minGroupSize - Minimum memories needed to form a group (default: 5)
 * @param {boolean} options.dryRun - If true, don't make changes (default: false)
 * @param {boolean} options.verbose - If true, output detailed logs (default: false)
 * @returns {Promise<Object>} Compaction results
 */
export async function compactMemories(options = {}) {
  const {
    olderThanDays = 30,
    minGroupSize = 5,
    dryRun = false,
    verbose = false
  } = options;

  const log = verbose ? console.log : () => {};

  console.log(`[Memory Compaction] Starting...`);
  console.log(`  - Older than: ${olderThanDays} days`);
  console.log(`  - Min group size: ${minGroupSize}`);
  console.log(`  - Dry run: ${dryRun}`);

  const results = {
    memoriesFetched: 0,
    projectsProcessed: 0,
    groupsCompacted: 0,
    memoriesDeleted: 0,
    memoriesCreated: 0,
    errors: [],
    projectDetails: {}
  };

  try {
    // Step 1: Fetch old memories
    console.log(`\n[1/5] Fetching old memories...`);
    const oldMemories = await fetchOldMemories(olderThanDays);
    results.memoriesFetched = oldMemories.length;
    console.log(`  Found ${oldMemories.length} memories older than ${olderThanDays} days`);

    if (oldMemories.length === 0) {
      console.log(`[Done] No memories to compact.`);
      return results;
    }

    // Step 2: Group by project
    console.log(`\n[2/5] Grouping memories by project...`);
    const projectGroups = groupMemoriesByProject(oldMemories);
    const projects = Object.keys(projectGroups);
    console.log(`  Found ${projects.length} projects with old memories`);

    // Step 3: Process each project
    console.log(`\n[3/5] Processing project groups...`);

    for (const project of projects) {
      const memories = projectGroups[project];

      results.projectDetails[project] = {
        memoriesFound: memories.length,
        compacted: false,
        reason: ''
      };

      if (memories.length < minGroupSize) {
        log(`  [${project}] Skipping - only ${memories.length} memories (min: ${minGroupSize})`);
        results.projectDetails[project].reason = `Below minimum group size (${memories.length} < ${minGroupSize})`;
        continue;
      }

      console.log(`  [${project}] Processing ${memories.length} memories...`);

      try {
        // Extract important information
        const importantInfo = extractImportantInfo(memories);
        log(`    - Decisions preserved: ${importantInfo.decisions.length}`);
        log(`    - Files preserved: ${importantInfo.filesModified.length}`);

        // Generate compacted summary
        console.log(`    Generating LLM summary...`);
        const compactedSummary = await generateCompactedSummary(project, memories, importantInfo);

        // Get date range for session ID
        const dateRange = getDateRange(memories);
        const sessionId = `compacted-${project}-${dateRange.start}-${dateRange.end}`;

        // Create compacted memory object
        const compactedMemory = {
          sessionId,
          summary: compactedSummary,
          decisions: importantInfo.decisions,
          filesModified: importantInfo.filesModified.slice(0, 100), // Limit to 100 files
          project,
          topics: importantInfo.topics,
          timestamp: new Date().toISOString(),
          cost: importantInfo.totalCost,
          inputTokens: importantInfo.totalInputTokens,
          outputTokens: importantInfo.totalOutputTokens
        };

        if (!dryRun) {
          // Save compacted memory
          console.log(`    Saving compacted memory...`);
          await saveCompactedMemory(compactedMemory);
          results.memoriesCreated++;

          // Delete old memories
          console.log(`    Deleting ${memories.length} old memories...`);
          const uuidsToDelete = memories.map(m => m.uuid);
          const deleted = await deleteMemories(uuidsToDelete);
          results.memoriesDeleted += deleted;

          console.log(`    [OK] ${project}: ${memories.length} -> 1 compacted memory`);
        } else {
          console.log(`    [DRY RUN] Would create compacted memory: ${sessionId}`);
          console.log(`    [DRY RUN] Would delete ${memories.length} old memories`);
        }

        results.groupsCompacted++;
        results.projectDetails[project].compacted = true;
        results.projectDetails[project].reason = `Compacted ${memories.length} memories`;
        results.projectsProcessed++;

      } catch (error) {
        console.error(`    [ERROR] ${project}: ${error.message}`);
        results.errors.push({
          project,
          error: error.message
        });
        results.projectDetails[project].reason = `Error: ${error.message}`;
      }
    }

    // Step 4: Summary
    console.log(`\n[4/5] Compaction Summary:`);
    console.log(`  - Memories fetched: ${results.memoriesFetched}`);
    console.log(`  - Projects processed: ${results.projectsProcessed}`);
    console.log(`  - Groups compacted: ${results.groupsCompacted}`);
    console.log(`  - Memories deleted: ${results.memoriesDeleted}`);
    console.log(`  - Memories created: ${results.memoriesCreated}`);
    console.log(`  - Errors: ${results.errors.length}`);

    // Step 5: Done
    console.log(`\n[5/5] Memory compaction complete.`);

  } catch (error) {
    console.error(`[FATAL] Compaction failed: ${error.message}`);
    results.errors.push({
      project: 'global',
      error: error.message
    });
  }

  return results;
}

/**
 * Get compaction statistics without making changes
 * @param {number} olderThanDays - Check memories older than this
 * @returns {Promise<Object>} Statistics about what would be compacted
 */
export async function getCompactionStats(olderThanDays = 30) {
  const oldMemories = await fetchOldMemories(olderThanDays);
  const projectGroups = groupMemoriesByProject(oldMemories);

  const stats = {
    totalOldMemories: oldMemories.length,
    olderThanDays,
    projects: {}
  };

  for (const [project, memories] of Object.entries(projectGroups)) {
    const importantInfo = extractImportantInfo(memories);
    const dateRange = getDateRange(memories);

    stats.projects[project] = {
      memoryCount: memories.length,
      dateRange,
      decisionsCount: importantInfo.decisions.length,
      filesCount: importantInfo.filesModified.length,
      topicsCount: importantInfo.topics.length,
      totalCost: importantInfo.totalCost,
      totalTokens: importantInfo.totalInputTokens + importantInfo.totalOutputTokens
    };
  }

  return stats;
}

// CLI Interface
if (process.argv[1] && process.argv[1].includes('memory-compaction.js')) {
  const args = process.argv.slice(2);

  const getArg = (name, defaultValue) => {
    const idx = args.indexOf(name);
    if (idx >= 0 && args[idx + 1]) {
      return args[idx + 1];
    }
    return defaultValue;
  };

  const hasFlag = (name) => args.includes(name);

  const command = args[0];

  if (command === 'stats') {
    const days = parseInt(getArg('--days', '30'));

    getCompactionStats(days)
      .then(stats => {
        console.log('\n=== Memory Compaction Statistics ===\n');
        console.log(`Total old memories (>${stats.olderThanDays} days): ${stats.totalOldMemories}`);
        console.log('\nBy Project:');

        for (const [project, info] of Object.entries(stats.projects)) {
          console.log(`\n  ${project}:`);
          console.log(`    Memories: ${info.memoryCount}`);
          console.log(`    Date range: ${info.dateRange.start} to ${info.dateRange.end}`);
          console.log(`    Decisions: ${info.decisionsCount}`);
          console.log(`    Files: ${info.filesCount}`);
          console.log(`    Topics: ${info.topicsCount}`);
          console.log(`    Total cost: $${info.totalCost.toFixed(4)}`);
          console.log(`    Total tokens: ${info.totalTokens.toLocaleString()}`);
        }
      })
      .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });

  } else if (command === 'run' || command === undefined) {
    const options = {
      olderThanDays: parseInt(getArg('--days', '30')),
      minGroupSize: parseInt(getArg('--min-group', '5')),
      dryRun: hasFlag('--dry-run'),
      verbose: hasFlag('--verbose') || hasFlag('-v')
    };

    compactMemories(options)
      .then(results => {
        if (results.errors.length > 0) {
          console.log('\nErrors encountered:');
          results.errors.forEach(e => console.log(`  - ${e.project}: ${e.error}`));
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
      });

  } else if (command === 'help' || command === '--help' || command === '-h') {
    console.log(`
Memory Compaction Tool
======================

Automatically summarizes and compacts old conversation memories.

Commands:
  run       Run the compaction (default)
  stats     Show statistics without making changes
  help      Show this help message

Options:
  --days N        Compact memories older than N days (default: 30)
  --min-group N   Minimum memories to form a group (default: 5)
  --dry-run       Preview changes without making them
  --verbose, -v   Show detailed output

Environment:
  OPENROUTER_API_KEY   Required for LLM summarization

Examples:
  # Run with defaults
  node memory-compaction.js

  # Preview what would be compacted
  node memory-compaction.js --dry-run

  # Compact memories older than 14 days
  node memory-compaction.js --days 14

  # Show statistics
  node memory-compaction.js stats

  # Verbose dry run
  node memory-compaction.js --dry-run --verbose
`);
  } else {
    console.error(`Unknown command: ${command}`);
    console.log('Use --help for usage information');
    process.exit(1);
  }
}

export default { compactMemories, getCompactionStats };
