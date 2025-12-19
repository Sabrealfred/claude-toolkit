/**
 * Agent Swarm Orchestrator
 * Run multiple OpenRouter agents with tools in parallel
 *
 * Usage:
 *   const { runSwarm } = require('./agent-swarm');
 *   const results = await runSwarm({
 *     tasks: [
 *       { id: 'task1', prompt: 'Analyze src/App.tsx for bugs' },
 *       { id: 'task2', prompt: 'List all TODO comments in src/' },
 *     ],
 *     model: 'openai/gpt-4o-mini',
 *     concurrency: 5
 *   });
 */

const { createAgent, TOOL_CAPABLE_MODELS } = require('./openrouter-agent');

// ============================================
// SWARM RUNNER
// ============================================
async function runSwarm(config) {
  const {
    tasks,
    model = 'openai/gpt-4o-mini',
    concurrency = 5,
    systemPrompt,
    verbose = true,
    onTaskComplete,
    onTaskError
  } = config;

  if (!TOOL_CAPABLE_MODELS.includes(model)) {
    console.warn(`[Swarm] Warning: ${model} may not support tool calling`);
  }

  const results = [];
  const errors = [];
  const startTime = Date.now();

  if (verbose) {
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║     AGENT SWARM - ${tasks.length} TASKS              ║`);
    console.log(`║     Model: ${model.slice(0, 25).padEnd(25)}  ║`);
    console.log(`║     Concurrency: ${concurrency}                      ║`);
    console.log(`╚════════════════════════════════════════╝\n`);
  }

  // Process tasks in batches
  const batches = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    batches.push(tasks.slice(i, i + concurrency));
  }

  let completedCount = 0;

  for (const batch of batches) {
    const batchPromises = batch.map(async (task) => {
      const agent = createAgent(model, {
        verbose: false, // Quiet individual agents
        systemPrompt: systemPrompt || task.systemPrompt
      });

      try {
        const result = await agent.run(task.prompt);
        completedCount++;

        if (verbose) {
          console.log(`[✓] ${task.id} completed (${completedCount}/${tasks.length})`);
        }

        const taskResult = {
          id: task.id,
          success: true,
          response: result.response,
          iterations: result.iterations
        };

        if (onTaskComplete) onTaskComplete(taskResult);
        return taskResult;

      } catch (error) {
        completedCount++;

        if (verbose) {
          console.log(`[✗] ${task.id} failed: ${error.message}`);
        }

        const taskError = {
          id: task.id,
          success: false,
          error: error.message
        };

        if (onTaskError) onTaskError(taskError);
        errors.push(taskError);
        return taskError;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  if (verbose) {
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║     SWARM COMPLETE                     ║`);
    console.log(`║     Success: ${results.filter(r => r.success).length}/${tasks.length}                        ║`);
    console.log(`║     Duration: ${duration}s                       ║`);
    console.log(`╚════════════════════════════════════════╝\n`);
  }

  return {
    results,
    errors,
    stats: {
      total: tasks.length,
      success: results.filter(r => r.success).length,
      failed: errors.length,
      duration: parseFloat(duration)
    }
  };
}

// ============================================
// PRESET SWARMS
// ============================================

/**
 * Code Review Swarm - Analyze code for issues
 */
async function codeReviewSwarm(directory, options = {}) {
  const basePrompt = `Analyze the code in ${directory} and report:`;

  const tasks = [
    { id: 'bugs', prompt: `${basePrompt} potential bugs or logic errors` },
    { id: 'security', prompt: `${basePrompt} security vulnerabilities (XSS, injection, etc.)` },
    { id: 'performance', prompt: `${basePrompt} performance issues or inefficiencies` },
    { id: 'types', prompt: `${basePrompt} TypeScript type errors or missing types` },
    { id: 'todos', prompt: `Search for TODO, FIXME, HACK comments in ${directory} and list them` },
    { id: 'imports', prompt: `Check for unused or missing imports in ${directory}` },
  ];

  return runSwarm({
    tasks,
    model: options.model || 'openai/gpt-4o-mini',
    concurrency: options.concurrency || 3,
    systemPrompt: 'You are a senior code reviewer. Be thorough but concise. List specific files and line numbers when possible.'
  });
}

/**
 * File Analysis Swarm - Analyze multiple files in parallel
 */
async function fileAnalysisSwarm(files, analysisPrompt, options = {}) {
  const tasks = files.map((file, i) => ({
    id: `file-${i}`,
    prompt: `Read the file ${file} and ${analysisPrompt}`
  }));

  return runSwarm({
    tasks,
    model: options.model || 'openai/gpt-4o-mini',
    concurrency: options.concurrency || 5,
    ...options
  });
}

/**
 * Project Scan Swarm - Full project analysis
 */
async function projectScanSwarm(projectDir, options = {}) {
  const tasks = [
    { id: 'structure', prompt: `List the directory structure of ${projectDir} and explain the project architecture` },
    { id: 'dependencies', prompt: `Read ${projectDir}/package.json and analyze the dependencies` },
    { id: 'readme', prompt: `Read ${projectDir}/README.md (if exists) and summarize what this project does` },
    { id: 'env', prompt: `Check if ${projectDir}/.env.example or similar exists and list required environment variables` },
    { id: 'entry', prompt: `Find and read the main entry point (index.ts, main.tsx, App.tsx) in ${projectDir}/src` },
    { id: 'tests', prompt: `Check if tests exist in ${projectDir} and describe the testing setup` },
    { id: 'config', prompt: `Read config files (tsconfig, vite.config, etc.) in ${projectDir} and summarize the build setup` },
  ];

  return runSwarm({
    tasks,
    model: options.model || 'openai/gpt-4o-mini',
    concurrency: options.concurrency || 4,
    systemPrompt: 'You are analyzing a software project. Be concise and focus on key information.'
  });
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  runSwarm,
  codeReviewSwarm,
  fileAnalysisSwarm,
  projectScanSwarm,
  TOOL_CAPABLE_MODELS
};

// ============================================
// CLI
// ============================================
if (require.main === module) {
  (async () => {
    // Example: Run a small swarm
    const results = await runSwarm({
      tasks: [
        { id: 'list-src', prompt: 'List files in /root/matwal-premium/src and count them' },
        { id: 'read-pkg', prompt: 'Read /root/matwal-premium/package.json and tell me the project name and version' },
        { id: 'find-todos', prompt: 'Search for TODO comments in /root/matwal-premium/src' },
      ],
      model: 'openai/gpt-4o-mini',
      concurrency: 3
    });

    console.log('\n=== RESULTS ===\n');
    for (const r of results.results) {
      console.log(`--- ${r.id} ---`);
      console.log(r.success ? r.response?.slice(0, 500) : r.error);
      console.log();
    }
  })();
}