# Model Finder & Router

Encuentra el mejor modelo para una tarea específica, decidiendo entre local (Ollama) o cloud (OpenRouter/Groq).

## Ubicación
```
/root/claude-summaries/api-connectors/model-finder.js
```

## Uso Rápido

### Buscar modelo para una tarea
```javascript
const { findModel } = require('/root/claude-summaries/api-connectors/model-finder');

// Buscar mejor modelo para código
const result = await findModel('code completion for TypeScript');

// Buscar con opciones
const result = await findModel('image analysis', {
  preferLocal: true,      // Preferir modelos locales
  needsTools: true,       // Necesita function calling
  maxCost: 1.0,          // Max $1 por 1M tokens
  minContext: 32000      // Min 32K contexto
});
```

### Verificar sistema
```javascript
const { getSystemSpecs } = require('/root/claude-summaries/api-connectors/model-finder');

const specs = getSystemSpecs();
console.log(specs);
// {
//   ram: { total: 32, available: 24 },
//   gpu: { available: true, name: 'RTX 5080', vram: '16GB' },
//   canRunLocal: true,
//   recommendedSize: '34b'
// }
```

### Buscar en proveedores específicos
```javascript
const {
  searchHuggingFace,
  searchOpenRouter,
  searchOllamaLibrary,
  checkOllama,
  getGroqModels
} = require('/root/claude-summaries/api-connectors/model-finder');

// HuggingFace
const hfModels = await searchHuggingFace('code generation', 'code');

// OpenRouter
const orModels = await searchOpenRouter('llama');

// Ollama library
const ollamaModels = await searchOllamaLibrary('code');

// Modelos Ollama instalados
const installed = await checkOllama();

// Modelos Groq disponibles
const groqModels = await getGroqModels();
```

## Categorías de Tareas Soportadas

| Categoría | Keywords | Modelos Locales | Modelos Cloud |
|-----------|----------|-----------------|---------------|
| `code` | code, programming, typescript | qwen2.5-coder, codellama, deepseek-coder | qwen-coder, deepseek-coder |
| `chat` | chat, conversation, assistant | llama3.1, mistral, gemma2 | llama-3.1-70b, mistral-large |
| `reasoning` | reasoning, math, logic | qwen2.5, deepseek-r1 | qwen-72b, deepseek-r1 |
| `vision` | image, vision, photo | llava, moondream | gpt-4o, claude-3.5-sonnet |
| `embedding` | embedding, vector, rag | nomic-embed-text | text-embedding-3 |
| `translation` | translate, multilingual | aya, madlad400 | gemini-pro, gpt-4o |
| `summarization` | summarize, tldr | llama3.1, phi3 | claude-haiku, gpt-4o-mini |
| `audio` | speech, transcription | whisper | whisper-large-v3 |

## Matriz de Decisión

```
┌─────────────────────────────────────────────────────────────┐
│                    ¿Tienes GPU?                             │
│                         │                                   │
│            ┌────────────┴────────────┐                      │
│            ▼                         ▼                      │
│         SÍ (VRAM)                   NO                      │
│            │                         │                      │
│    ┌───────┴───────┐         ┌──────┴──────┐               │
│    ▼               ▼         ▼             ▼               │
│  ≥24GB          8-16GB    ≥32GB RAM    <32GB RAM           │
│    │               │         │             │               │
│    ▼               ▼         ▼             ▼               │
│  70B local     7-34B      7-13B         CLOUD              │
│                local       local         ONLY              │
└─────────────────────────────────────────────────────────────┘
```

## Ejemplo: Workflow Completo

```javascript
const { findModel } = require('/root/claude-summaries/api-connectors/model-finder');
const { createAgent } = require('/root/claude-summaries/api-connectors/openrouter-agent');

async function smartCodeReview(project) {
  // 1. Encontrar el mejor modelo para code review
  const modelRec = await findModel('code review security bugs', {
    preferLocal: true,
    needsTools: true
  });

  console.log(`Using: ${modelRec.bestChoice.model}`);

  // 2. Si es local, usar Ollama directamente
  if (modelRec.bestChoice.type.startsWith('local')) {
    // Ejecutar con Ollama
    const { execSync } = require('child_process');
    const result = execSync(`ollama run ${modelRec.bestChoice.model} "Review this code..."`, {
      encoding: 'utf-8'
    });
    return result;
  }

  // 3. Si es cloud, usar OpenRouter agent con tools
  const agent = createAgent(modelRec.bestChoice.model, {
    systemPrompt: 'You are a code reviewer. Use tools to read and analyze files.'
  });

  return await agent.run(`Review the code in ${project} for security issues`);
}
```

## Instalar Modelo Local

```bash
# Ver recomendación
node /root/claude-summaries/api-connectors/model-finder.js "code completion"

# Instalar modelo recomendado
ollama pull qwen2.5-coder:32b

# Verificar instalación
ollama list
```

## Integración con Swarm

```javascript
const { findModel } = require('/root/claude-summaries/api-connectors/model-finder');
const { runSwarm } = require('/root/claude-summaries/api-connectors/agent-swarm');

async function smartSwarm(tasks) {
  // Encontrar modelo óptimo
  const rec = await findModel('code analysis', { needsTools: true });

  // Usar el modelo recomendado para el swarm
  return await runSwarm({
    tasks,
    model: rec.bestChoice.model,
    concurrency: 5
  });
}
```

## CLI

```bash
# Buscar modelo para tarea específica
node /root/claude-summaries/api-connectors/model-finder.js "code review"
node /root/claude-summaries/api-connectors/model-finder.js "image captioning"
node /root/claude-summaries/api-connectors/model-finder.js "translate spanish to english"

# Ver specs del sistema
node -e "const {getSystemSpecs} = require('/root/claude-summaries/api-connectors/model-finder'); console.log(getSystemSpecs())"
```

## Cuándo Usar Este Skill

- **Elegir modelo**: No sabes qué modelo usar para una tarea
- **Optimizar costos**: Quieres usar local cuando sea posible
- **Nuevas tareas**: Necesitas un modelo especializado (vision, audio, etc.)
- **Inventario**: Ver qué tienes instalado vs disponible