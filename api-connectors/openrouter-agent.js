/**
 * OpenRouter Agent with Tool Calling
 * Custom agent loop that enables function calling with OpenRouter models
 *
 * Usage:
 *   const { createAgent, TOOLS } = require('./openrouter-agent');
 *   const agent = createAgent('openai/gpt-4-turbo');
 *   const result = await agent.run('Read the file package.json and tell me the version');
 */

const { getCredentials } = require('./api-registry');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================
// TOOL DEFINITIONS (OpenAI format)
// ============================================
const TOOLS = {
  read_file: {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute path to the file to read'
          }
        },
        required: ['file_path']
      }
    }
  },

  write_file: {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute path to the file to write'
          },
          content: {
            type: 'string',
            description: 'Content to write to the file'
          }
        },
        required: ['file_path', 'content']
      }
    }
  },

  list_files: {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory',
      parameters: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            description: 'Directory path to list'
          },
          pattern: {
            type: 'string',
            description: 'Optional glob pattern (e.g., "*.ts")'
          }
        },
        required: ['directory']
      }
    }
  },

  run_command: {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Run a shell command (read-only, safe commands only)',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to execute'
          },
          cwd: {
            type: 'string',
            description: 'Working directory for the command'
          }
        },
        required: ['command']
      }
    }
  },

  search_code: {
    type: 'function',
    function: {
      name: 'search_code',
      description: 'Search for a pattern in code files using grep',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Search pattern (regex supported)'
          },
          directory: {
            type: 'string',
            description: 'Directory to search in'
          },
          file_type: {
            type: 'string',
            description: 'File extension to filter (e.g., "ts", "tsx", "js")'
          }
        },
        required: ['pattern', 'directory']
      }
    }
  },

  edit_file: {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Replace a specific string in a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute path to the file'
          },
          old_string: {
            type: 'string',
            description: 'Exact string to find and replace'
          },
          new_string: {
            type: 'string',
            description: 'String to replace with'
          }
        },
        required: ['file_path', 'old_string', 'new_string']
      }
    }
  }
};

// ============================================
// TOOL EXECUTORS
// ============================================
const EXECUTORS = {
  read_file: ({ file_path }) => {
    try {
      const content = fs.readFileSync(file_path, 'utf-8');
      return { success: true, content: content.slice(0, 10000) }; // Limit size
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  write_file: ({ file_path, content }) => {
    try {
      fs.writeFileSync(file_path, content);
      return { success: true, message: `File written: ${file_path}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  list_files: ({ directory, pattern }) => {
    try {
      const cmd = pattern
        ? `find "${directory}" -name "${pattern}" -type f 2>/dev/null | head -50`
        : `ls -la "${directory}" 2>/dev/null | head -50`;
      const result = execSync(cmd, { encoding: 'utf-8', timeout: 5000 });
      return { success: true, files: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  run_command: ({ command, cwd }) => {
    // Safety: Block dangerous commands
    const dangerous = ['rm -rf', 'sudo', 'kill', 'pkill', 'shutdown', 'reboot', 'mkfs', 'dd if='];
    if (dangerous.some(d => command.includes(d))) {
      return { success: false, error: 'Command blocked for safety' };
    }

    try {
      const result = execSync(command, {
        encoding: 'utf-8',
        timeout: 30000,
        cwd: cwd || process.cwd()
      });
      return { success: true, output: result.slice(0, 5000) };
    } catch (e) {
      return { success: false, error: e.message, output: e.stdout?.slice(0, 2000) };
    }
  },

  search_code: ({ pattern, directory, file_type }) => {
    try {
      const typeFlag = file_type ? `--include="*.${file_type}"` : '';
      const cmd = `grep -rn ${typeFlag} "${pattern}" "${directory}" 2>/dev/null | head -30`;
      const result = execSync(cmd, { encoding: 'utf-8', timeout: 10000 });
      return { success: true, matches: result };
    } catch (e) {
      // grep returns exit code 1 when no matches
      if (e.status === 1) return { success: true, matches: 'No matches found' };
      return { success: false, error: e.message };
    }
  },

  edit_file: ({ file_path, old_string, new_string }) => {
    try {
      const content = fs.readFileSync(file_path, 'utf-8');
      if (!content.includes(old_string)) {
        return { success: false, error: 'old_string not found in file' };
      }
      const newContent = content.replace(old_string, new_string);
      fs.writeFileSync(file_path, newContent);
      return { success: true, message: `File edited: ${file_path}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

// ============================================
// OPENROUTER API CLIENT
// ============================================
async function callOpenRouter(model, messages, tools = null) {
  const creds = getCredentials('openrouter');

  const body = {
    model,
    messages,
    max_tokens: 4096,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creds.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://matwal.com',
      'X-Title': 'Matwal Agent'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============================================
// AGENT CLASS
// ============================================
class OpenRouterAgent {
  constructor(model, options = {}) {
    this.model = model;
    this.tools = options.tools || Object.values(TOOLS);
    this.maxIterations = options.maxIterations || 10;
    this.verbose = options.verbose ?? true;
    this.systemPrompt = options.systemPrompt ||
      'You are a helpful coding assistant with access to tools. Use tools to help accomplish tasks.';
  }

  async run(prompt) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ];

    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations++;

      if (this.verbose) {
        console.log(`\n[Agent] Iteration ${iterations}/${this.maxIterations}`);
      }

      // Call model
      const response = await callOpenRouter(this.model, messages, this.tools);
      const choice = response.choices[0];
      const assistantMessage = choice.message;

      // Add assistant response to history
      messages.push(assistantMessage);

      // Check if model wants to use tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          if (this.verbose) {
            console.log(`[Tool] ${toolName}(${JSON.stringify(toolArgs).slice(0, 100)}...)`);
          }

          // Execute tool
          const executor = EXECUTORS[toolName];
          let result;

          if (executor) {
            result = executor(toolArgs);
          } else {
            result = { success: false, error: `Unknown tool: ${toolName}` };
          }

          if (this.verbose) {
            console.log(`[Tool Result] ${JSON.stringify(result).slice(0, 200)}...`);
          }

          // Add tool result to messages
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }
      } else {
        // No tool calls - model is done
        if (this.verbose) {
          console.log(`[Agent] Complete after ${iterations} iterations`);
        }

        return {
          success: true,
          response: assistantMessage.content,
          iterations,
          messages
        };
      }

      // Check for finish reason
      if (choice.finish_reason === 'stop') {
        return {
          success: true,
          response: assistantMessage.content,
          iterations,
          messages
        };
      }
    }

    return {
      success: false,
      error: 'Max iterations reached',
      iterations,
      messages
    };
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================
function createAgent(model, options = {}) {
  return new OpenRouterAgent(model, options);
}

// ============================================
// MODELS THAT SUPPORT TOOL CALLING
// ============================================
const TOOL_CAPABLE_MODELS = [
  'openai/gpt-4-turbo',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'google/gemini-pro-1.5',
  'mistralai/mistral-large',
  'mistralai/mistral-medium',
];

// ============================================
// EXPORTS
// ============================================
module.exports = {
  createAgent,
  OpenRouterAgent,
  TOOLS,
  EXECUTORS,
  TOOL_CAPABLE_MODELS,
  callOpenRouter
};

// ============================================
// CLI TEST
// ============================================
if (require.main === module) {
  (async () => {
    console.log('=== OpenRouter Agent Test ===\n');

    const agent = createAgent('openai/gpt-4o-mini', {
      verbose: true,
      systemPrompt: 'You are a helpful assistant. Use tools when needed.'
    });

    const result = await agent.run('List the files in /root/matwal-premium/src and tell me what type of project this is');

    console.log('\n=== Final Response ===');
    console.log(result.response);
  })();
}