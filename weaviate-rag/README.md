# Weaviate RAG for Code Intelligence

Sistema profesional de RAG (Retrieval-Augmented Generation) para codebases TypeScript/JavaScript.

## Features

- **Chunking inteligente**: Extrae funciones, clases, componentes, hooks - no párrafos arbitrarios
- **Búsqueda híbrida**: Combina semántica (embeddings) + keywords (BM25)
- **Re-ranking**: Cross-encoder para ordenar resultados por relevancia
- **Context loader**: Sigue imports para construir bundles de contexto
- **Multi-proyecto**: Indexa múltiples proyectos en un solo Weaviate
- **100% local**: Embeddings y reranker corren localmente (gratis)

## Quick Start

```bash
# 1. Iniciar Weaviate
docker compose up -d

# 2. Instalar dependencias
npm install

# 3. Indexar un proyecto
npm run index:matwal

# 4. Verificar status
npm run status

# 5. Probar búsqueda
node scripts/search.js "authentication logic"
```

## Integración con Claude Code

Agregar a tu configuración de MCP:

```bash
claude mcp add weaviate-rag -- node /root/weaviate-rag/src/mcp-server.js
```

O editar `~/.claude.json`:

```json
{
  "mcpServers": {
    "weaviate-rag": {
      "command": "node",
      "args": ["/root/weaviate-rag/src/mcp-server.js"],
      "env": {
        "WEAVIATE_URL": "http://localhost:8080",
        "DEFAULT_PROJECT": "matwal-premium"
      }
    }
  }
}
```

## Tools MCP Disponibles

### `weaviate_search`
Búsqueda híbrida semántica + keywords.

```
weaviate_search({
  query: "where do we handle authentication",
  project: "matwal-premium",
  limit: 10,
  chunkTypes: ["function", "hook", "service"],
  alpha: 0.5  // 0=keyword, 1=semantic
})
```

### `weaviate_context`
Construye bundle de contexto siguiendo imports.

```
weaviate_context({
  filePath: "src/services/crmService.ts",
  project: "matwal-premium",
  maxFiles: 10,
  includeTypes: true
})
```

### `weaviate_types`
Busca definiciones de tipos e interfaces.

```
weaviate_types({
  query: "Client",
  project: "matwal-premium"
})
```

### `weaviate_similar`
Encuentra código similar a un snippet.

```
weaviate_similar({
  code: "async function getClients() { ... }",
  project: "matwal-premium"
})
```

### `weaviate_status`
Estado del índice.

## Schema

### CodeChunk
- `content`: Código completo
- `name`: Nombre de función/clase/componente
- `filePath`: Ruta relativa
- `project`: Proyecto
- `chunkType`: function, component, hook, service, class
- `lineStart/lineEnd`: Ubicación
- `jsDoc`: Documentación
- `signature`: Firma de la función
- `imports/exports`: Dependencias
- `usedTypes`: Tipos TypeScript usados
- `complexity`: Complejidad ciclomática estimada

### TypeDefinition
- `name`: Nombre del tipo/interface
- `typeKind`: interface, type, enum
- `properties`: Propiedades
- `extendsTypes`: Tipos heredados
- `fromDatabase`: Si viene de database.types.ts

## Comandos

```bash
# Indexar proyecto específico
node scripts/indexer.js --project matwal-premium --path /root/matwal-premium

# Indexar todos los proyectos configurados
npm run index -- --config config/projects.json

# Ver status
npm run status

# Buscar
node scripts/search.js "payment processing"
node scripts/search.js "Client interface" --types

# Reset
npm run reset  # Borra todo (pide confirmación)
npm run reset -- --project matwal-premium  # Solo un proyecto
npm run reset -- --force  # Sin confirmación
```

## Configuración

Editar `config/projects.json` para agregar proyectos:

```json
{
  "projects": [
    {
      "name": "mi-proyecto",
      "path": "/ruta/al/proyecto",
      "include": ["src/**/*.ts", "src/**/*.tsx"],
      "exclude": ["node_modules/**", "dist/**"]
    }
  ]
}
```

## Arquitectura

```
┌─────────────────────────────────────────┐
│           Claude Code                    │
│               │                          │
│               ▼                          │
│         weaviate-rag MCP                 │
│               │                          │
│    ┌──────────┼──────────┐              │
│    ▼          ▼          ▼              │
│ CodeChunk  TypeDef  FileMetadata        │
│    │          │          │              │
│    └──────────┼──────────┘              │
│               ▼                          │
│           WEAVIATE                       │
│    ┌──────────────────────┐             │
│    │  t2v-transformers    │  Embeddings │
│    │  reranker-transformers│  Reranking │
│    └──────────────────────┘             │
└─────────────────────────────────────────┘
```

## Troubleshooting

### Weaviate no conecta
```bash
# Verificar que esté corriendo
docker compose ps

# Ver logs
docker compose logs weaviate

# Reiniciar
docker compose down && docker compose up -d
```

### Embeddings lentos
Los embeddings corren en CPU por defecto. Para GPU:
1. Editar `docker-compose.yml`
2. Cambiar `ENABLE_CUDA: '1'`
3. Agregar runtime nvidia

### Re-indexar un proyecto
```bash
npm run reset -- --project matwal-premium
npm run index:matwal
```
