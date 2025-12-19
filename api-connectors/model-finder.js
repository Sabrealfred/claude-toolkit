/**
 * Model Finder & Router
 * Finds the best model for a specific task across multiple providers
 *
 * Flow:
 * 1. Analyze task requirements
 * 2. Search HuggingFace for specialized models
 * 3. Check system specs (RAM, GPU)
 * 4. Recommend: Local (Ollama) vs Cloud (OpenRouter/Groq)
 *
 * Usage:
 *   const { findModel, analyzeSystem } = require('./model-finder');
 *   const recommendation = await findModel('code completion for TypeScript');
 */

const { execSync } = require('child_process');
const { getCredentials } = require('./api-registry');

// ============================================
// SYSTEM ANALYSIS
// ============================================

function getSystemSpecs() {
  const specs = {
    ram: { total: 0, available: 0, unit: 'GB' },
    gpu: { available: false, name: null, vram: null },
    cpu: { cores: 0, model: '' },
    canRunLocal: false,
    recommendedSize: null
  };

  try {
    // RAM
    const memInfo = execSync("free -g | grep Mem | awk '{print $2, $7}'", { encoding: 'utf-8' });
    const [total, available] = memInfo.trim().split(' ').map(Number);
    specs.ram.total = total;
    specs.ram.available = available;

    // CPU
    const cpuCores = execSync("nproc", { encoding: 'utf-8' }).trim();
    specs.cpu.cores = parseInt(cpuCores);

    const cpuModel = execSync("cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2", { encoding: 'utf-8' }).trim();
    specs.cpu.model = cpuModel;

    // GPU (NVIDIA)
    try {
      const gpuInfo = execSync("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null", { encoding: 'utf-8' });
      if (gpuInfo.trim()) {
        const [name, vram] = gpuInfo.trim().split(', ');
        specs.gpu.available = true;
        specs.gpu.name = name;
        specs.gpu.vram = vram;
      }
    } catch (e) {
      // No NVIDIA GPU
    }

    // Determine what can run locally
    if (specs.gpu.available) {
      const vramGB = parseInt(specs.gpu.vram) / 1024;
      if (vramGB >= 24) specs.recommendedSize = '70b';
      else if (vramGB >= 12) specs.recommendedSize = '34b';
      else if (vramGB >= 8) specs.recommendedSize = '13b';
      else if (vramGB >= 6) specs.recommendedSize = '7b';
      else specs.recommendedSize = '3b';
      specs.canRunLocal = true;
    } else if (specs.ram.available >= 32) {
      specs.recommendedSize = '13b';
      specs.canRunLocal = true;
    } else if (specs.ram.available >= 16) {
      specs.recommendedSize = '7b';
      specs.canRunLocal = true;
    } else if (specs.ram.available >= 8) {
      specs.recommendedSize = '3b';
      specs.canRunLocal = true;
    }

  } catch (e) {
    console.error('[ModelFinder] Error getting system specs:', e.message);
  }

  return specs;
}

// ============================================
// TASK CATEGORIES
// ============================================

const TASK_CATEGORIES = {
  'code': {
    tags: ['code', 'programming', 'code-generation'],
    keywords: ['code', 'programming', 'typescript', 'python', 'javascript', 'coding'],
    recommended: {
      local: ['qwen2.5-coder', 'codellama', 'deepseek-coder', 'starcoder2'],
      cloud: ['qwen/qwen-2.5-coder-32b-instruct', 'deepseek/deepseek-coder-33b-instruct']
    }
  },
  'chat': {
    tags: ['conversational', 'chat'],
    keywords: ['chat', 'conversation', 'assistant', 'general'],
    recommended: {
      local: ['llama3.1', 'mistral', 'gemma2', 'phi3'],
      cloud: ['meta-llama/llama-3.1-70b-instruct', 'mistralai/mistral-large']
    }
  },
  'reasoning': {
    tags: ['reasoning', 'math', 'logic'],
    keywords: ['reasoning', 'math', 'logic', 'analysis', 'thinking'],
    recommended: {
      local: ['qwen2.5', 'llama3.1', 'deepseek-r1'],
      cloud: ['qwen/qwen-2.5-72b-instruct', 'deepseek/deepseek-r1']
    }
  },
  'vision': {
    tags: ['image-to-text', 'visual-question-answering', 'image-classification'],
    keywords: ['image', 'vision', 'picture', 'photo', 'visual', 'ocr'],
    recommended: {
      local: ['llava', 'bakllava', 'moondream'],
      cloud: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-vision']
    }
  },
  'embedding': {
    tags: ['feature-extraction', 'sentence-similarity'],
    keywords: ['embedding', 'vector', 'similarity', 'search', 'rag'],
    recommended: {
      local: ['nomic-embed-text', 'mxbai-embed-large', 'all-minilm'],
      cloud: ['openai/text-embedding-3-large']
    }
  },
  'translation': {
    tags: ['translation'],
    keywords: ['translate', 'translation', 'language', 'multilingual'],
    recommended: {
      local: ['aya', 'madlad400'],
      cloud: ['google/gemini-pro', 'openai/gpt-4o']
    }
  },
  'summarization': {
    tags: ['summarization', 'text2text-generation'],
    keywords: ['summarize', 'summary', 'tldr', 'condense'],
    recommended: {
      local: ['llama3.1', 'mistral', 'phi3'],
      cloud: ['anthropic/claude-3-haiku', 'openai/gpt-4o-mini']
    }
  },
  'audio': {
    tags: ['automatic-speech-recognition', 'text-to-speech'],
    keywords: ['audio', 'speech', 'voice', 'transcription', 'tts', 'stt'],
    recommended: {
      local: ['whisper'],
      cloud: ['openai/whisper-large-v3', 'groq/whisper-large-v3']
    }
  }
};

// ============================================
// HUGGINGFACE SEARCH
// ============================================

async function searchHuggingFace(query, taskType = null) {
  const baseUrl = 'https://huggingface.co/api/models';

  const params = new URLSearchParams({
    search: query,
    sort: 'downloads',
    direction: -1,
    limit: 10
  });

  if (taskType && TASK_CATEGORIES[taskType]) {
    params.append('filter', TASK_CATEGORIES[taskType].tags[0]);
  }

  try {
    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) throw new Error(`HF API error: ${response.status}`);

    const models = await response.json();

    return models.map(m => ({
      id: m.modelId || m.id,
      downloads: m.downloads,
      likes: m.likes,
      tags: m.tags || [],
      pipeline: m.pipeline_tag,
      lastModified: m.lastModified
    }));
  } catch (e) {
    console.error('[HuggingFace] Search error:', e.message);
    return [];
  }
}

// ============================================
// OLLAMA CHECK
// ============================================

async function checkOllama() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) return { available: false, models: [] };

    const data = await response.json();
    return {
      available: true,
      models: data.models?.map(m => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at
      })) || []
    };
  } catch (e) {
    return { available: false, models: [] };
  }
}

async function searchOllamaLibrary(query) {
  // Ollama library search (scraping since no official API)
  const popularModels = [
    { name: 'llama3.1', sizes: ['8b', '70b', '405b'], task: 'chat' },
    { name: 'llama3.2', sizes: ['1b', '3b'], task: 'chat' },
    { name: 'qwen2.5', sizes: ['0.5b', '1.5b', '3b', '7b', '14b', '32b', '72b'], task: 'chat' },
    { name: 'qwen2.5-coder', sizes: ['0.5b', '1.5b', '3b', '7b', '14b', '32b'], task: 'code' },
    { name: 'deepseek-coder-v2', sizes: ['16b', '236b'], task: 'code' },
    { name: 'codellama', sizes: ['7b', '13b', '34b', '70b'], task: 'code' },
    { name: 'mistral', sizes: ['7b'], task: 'chat' },
    { name: 'mixtral', sizes: ['8x7b', '8x22b'], task: 'chat' },
    { name: 'gemma2', sizes: ['2b', '9b', '27b'], task: 'chat' },
    { name: 'phi3', sizes: ['mini', 'medium'], task: 'chat' },
    { name: 'llava', sizes: ['7b', '13b', '34b'], task: 'vision' },
    { name: 'moondream', sizes: ['2b'], task: 'vision' },
    { name: 'nomic-embed-text', sizes: ['v1.5'], task: 'embedding' },
    { name: 'mxbai-embed-large', sizes: ['v1'], task: 'embedding' },
    { name: 'whisper', sizes: ['base', 'small', 'medium', 'large'], task: 'audio' },
    { name: 'deepseek-r1', sizes: ['1.5b', '7b', '8b', '14b', '32b', '70b', '671b'], task: 'reasoning' },
  ];

  const q = query.toLowerCase();
  return popularModels.filter(m =>
    m.name.includes(q) ||
    m.task.includes(q) ||
    TASK_CATEGORIES[m.task]?.keywords.some(k => q.includes(k))
  );
}

// ============================================
// OPENROUTER CHECK
// ============================================

async function searchOpenRouter(query) {
  try {
    const creds = getCredentials('openrouter');

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${creds.apiKey}` }
    });

    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);

    const data = await response.json();
    const q = query.toLowerCase();

    return data.data
      .filter(m =>
        m.id.toLowerCase().includes(q) ||
        m.name?.toLowerCase().includes(q)
      )
      .map(m => ({
        id: m.id,
        name: m.name,
        contextLength: m.context_length,
        pricing: {
          prompt: m.pricing?.prompt,
          completion: m.pricing?.completion
        },
        supportsTools: m.supported_parameters?.includes('tools') || false
      }))
      .slice(0, 10);
  } catch (e) {
    console.error('[OpenRouter] Search error:', e.message);
    return [];
  }
}

// ============================================
// GROQ CHECK
// ============================================

async function getGroqModels() {
  try {
    const creds = getCredentials('groq');

    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${creds.apiKey}` }
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

    const data = await response.json();
    return data.data.map(m => ({
      id: m.id,
      owned_by: m.owned_by,
      context_window: m.context_window
    }));
  } catch (e) {
    console.error('[Groq] Error:', e.message);
    return [];
  }
}

// ============================================
// MAIN FINDER
// ============================================

async function findModel(taskDescription, options = {}) {
  const {
    preferLocal = true,
    maxCost = null,       // max $/1M tokens
    minContext = null,    // min context length
    needsTools = false,
    verbose = true
  } = options;

  const results = {
    task: taskDescription,
    taskCategory: null,
    systemSpecs: null,
    recommendations: {
      local: [],
      cloud: []
    },
    bestChoice: null
  };

  if (verbose) console.log(`\n🔍 Finding model for: "${taskDescription}"\n`);

  // 1. Detect task category (find best match by counting keyword hits)
  const taskLower = taskDescription.toLowerCase();
  let bestMatch = { category: 'chat', score: 0 };

  for (const [category, config] of Object.entries(TASK_CATEGORIES)) {
    const score = config.keywords.filter(k => taskLower.includes(k)).length;
    if (score > bestMatch.score) {
      bestMatch = { category, score };
    }
  }

  results.taskCategory = bestMatch.category;

  if (verbose) console.log(`📋 Task category: ${results.taskCategory || 'general'}`);

  // 2. Check system specs
  results.systemSpecs = getSystemSpecs();
  if (verbose) {
    console.log(`💻 System: ${results.systemSpecs.ram.available}GB RAM available`);
    if (results.systemSpecs.gpu.available) {
      console.log(`🎮 GPU: ${results.systemSpecs.gpu.name} (${results.systemSpecs.gpu.vram})`);
    }
    console.log(`📦 Can run locally: ${results.systemSpecs.canRunLocal ? `Yes (up to ${results.systemSpecs.recommendedSize})` : 'No'}`);
  }

  // 3. Search providers in parallel
  if (verbose) console.log(`\n🌐 Searching providers...`);

  const [ollama, ollamaLibrary, openrouter, groq, huggingface] = await Promise.all([
    checkOllama(),
    searchOllamaLibrary(taskDescription),
    searchOpenRouter(taskDescription),
    getGroqModels(),
    searchHuggingFace(taskDescription, results.taskCategory)
  ]);

  // 4. Build local recommendations
  if (results.systemSpecs.canRunLocal && ollama.available) {
    // Already installed models
    const installed = ollama.models.filter(m => {
      const name = m.name.toLowerCase();
      return TASK_CATEGORIES[results.taskCategory]?.recommended.local.some(r =>
        name.includes(r.toLowerCase())
      );
    });

    if (installed.length > 0) {
      results.recommendations.local.push({
        type: 'installed',
        models: installed.map(m => ({
          name: m.name,
          size: m.size,
          command: `ollama run ${m.name}`
        }))
      });
    }

    // Available to install
    const canInstall = ollamaLibrary.filter(m => {
      const maxSize = results.systemSpecs.recommendedSize;
      const sizeMap = { '3b': 1, '7b': 2, '8b': 2, '13b': 3, '14b': 3, '32b': 4, '34b': 4, '70b': 5, '72b': 5 };
      const maxSizeNum = sizeMap[maxSize] || 0;

      return m.sizes.some(s => {
        const sNum = sizeMap[s.replace(/[^0-9b]/g, '')] || 0;
        return sNum <= maxSizeNum;
      });
    });

    if (canInstall.length > 0) {
      results.recommendations.local.push({
        type: 'available',
        models: canInstall.map(m => ({
          name: m.name,
          sizes: m.sizes.filter(s => {
            const maxSize = results.systemSpecs.recommendedSize;
            const sizeMap = { '3b': 1, '7b': 2, '8b': 2, '13b': 3, '14b': 3, '32b': 4, '34b': 4, '70b': 5, '72b': 5 };
            return (sizeMap[s.replace(/[^0-9b]/g, '')] || 0) <= (sizeMap[maxSize] || 0);
          }),
          task: m.task,
          command: `ollama pull ${m.name}`
        }))
      });
    }
  }

  // 5. Build cloud recommendations
  // OpenRouter
  if (openrouter.length > 0) {
    let filtered = openrouter;
    if (needsTools) filtered = filtered.filter(m => m.supportsTools);
    if (maxCost) filtered = filtered.filter(m => parseFloat(m.pricing?.prompt || 0) * 1000000 <= maxCost);
    if (minContext) filtered = filtered.filter(m => m.contextLength >= minContext);

    results.recommendations.cloud.push({
      provider: 'openrouter',
      models: filtered.slice(0, 5)
    });
  }

  // Groq (fast inference)
  const groqRelevant = groq.filter(m => {
    const id = m.id.toLowerCase();
    return TASK_CATEGORIES[results.taskCategory]?.keywords.some(k => id.includes(k)) ||
           id.includes('llama') || id.includes('mixtral');
  });

  if (groqRelevant.length > 0) {
    results.recommendations.cloud.push({
      provider: 'groq',
      note: 'Fastest inference, free tier available',
      models: groqRelevant.slice(0, 5)
    });
  }

  // HuggingFace (for reference)
  if (huggingface.length > 0) {
    results.recommendations.cloud.push({
      provider: 'huggingface',
      note: 'Can deploy via Inference API or download',
      models: huggingface.slice(0, 5)
    });
  }

  // 6. Determine best choice
  if (preferLocal && results.recommendations.local.length > 0) {
    const installed = results.recommendations.local.find(r => r.type === 'installed');
    if (installed && installed.models.length > 0) {
      results.bestChoice = {
        type: 'local-installed',
        model: installed.models[0].name,
        command: installed.models[0].command,
        reason: 'Already installed locally, no cost'
      };
    } else {
      const available = results.recommendations.local.find(r => r.type === 'available');
      if (available && available.models.length > 0) {
        const best = available.models[0];
        const size = best.sizes[best.sizes.length - 1]; // Largest that fits
        results.bestChoice = {
          type: 'local-available',
          model: `${best.name}:${size}`,
          command: `ollama pull ${best.name}:${size}`,
          reason: 'Best local option for your hardware'
        };
      }
    }
  }

  if (!results.bestChoice && results.recommendations.cloud.length > 0) {
    // Prefer Groq for speed, then OpenRouter
    const groqRec = results.recommendations.cloud.find(r => r.provider === 'groq');
    const orRec = results.recommendations.cloud.find(r => r.provider === 'openrouter');

    if (groqRec && groqRec.models.length > 0) {
      results.bestChoice = {
        type: 'cloud-groq',
        model: groqRec.models[0].id,
        provider: 'groq',
        reason: 'Fastest inference, generous free tier'
      };
    } else if (orRec && orRec.models.length > 0) {
      results.bestChoice = {
        type: 'cloud-openrouter',
        model: orRec.models[0].id,
        provider: 'openrouter',
        reason: 'Best cloud option'
      };
    }
  }

  // 7. Print results
  if (verbose) {
    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 RECOMMENDATIONS');
    console.log('='.repeat(50));

    if (results.recommendations.local.length > 0) {
      console.log('\n🏠 LOCAL (Ollama):');
      for (const rec of results.recommendations.local) {
        console.log(`  [${rec.type}]`);
        for (const m of rec.models.slice(0, 3)) {
          console.log(`    - ${m.name} ${m.sizes ? `(${m.sizes.join(', ')})` : ''}`);
        }
      }
    }

    if (results.recommendations.cloud.length > 0) {
      console.log('\n☁️  CLOUD:');
      for (const rec of results.recommendations.cloud) {
        console.log(`  [${rec.provider}] ${rec.note || ''}`);
        for (const m of rec.models.slice(0, 3)) {
          console.log(`    - ${m.id || m.name}`);
        }
      }
    }

    if (results.bestChoice) {
      console.log(`\n${'='.repeat(50)}`);
      console.log('⭐ BEST CHOICE');
      console.log('='.repeat(50));
      console.log(`  Model: ${results.bestChoice.model}`);
      console.log(`  Type: ${results.bestChoice.type}`);
      console.log(`  Reason: ${results.bestChoice.reason}`);
      if (results.bestChoice.command) {
        console.log(`  Command: ${results.bestChoice.command}`);
      }
    }
  }

  return results;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  findModel,
  getSystemSpecs,
  searchHuggingFace,
  searchOpenRouter,
  searchOllamaLibrary,
  checkOllama,
  getGroqModels,
  TASK_CATEGORIES
};

// ============================================
// CLI
// ============================================

if (require.main === module) {
  (async () => {
    const task = process.argv[2] || 'code completion for TypeScript';
    await findModel(task, { preferLocal: true, verbose: true });
  })();
}