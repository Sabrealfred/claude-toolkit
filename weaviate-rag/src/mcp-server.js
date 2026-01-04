#!/usr/bin/env node
/**
 * Weaviate RAG MCP Server
 *
 * Provides semantic code search for Claude Code via MCP protocol.
 *
 * Tools:
 * - weaviate_search: Hybrid search (semantic + keyword) with optional:
 *     - rewrite: Query expansion and synonym addition
 *     - autocut: Automatic result filtering based on score gaps
 * - weaviate_search_advanced: Full RAG pipeline combining:
 *     - Query rewriting
 *     - Reflexive multi-attempt search
 *     - Automatic result filtering
 * - weaviate_context: Build context bundle following imports
 * - weaviate_types: Find type definitions
 * - weaviate_similar: Find similar code
 * - weaviate_status: Check index status
 * - weaviate_memories: Search past conversation memories
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import weaviate from 'weaviate-ts-client';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// Import RAG enhancement modules
import { rewriteQuery, optimizeForCodeSearch } from './query-rewriter.js';
import { autoCut, adaptiveAutoCut, analyzeScores } from './autocut.js';
import { reflexiveSearch, createSearchFn } from './reflexion.js';

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || 'http://localhost:8080';
const DEFAULT_PROJECT = process.env.DEFAULT_PROJECT || 'matwal-premium';

// Initialize Weaviate client
let client = null;

async function getClient() {
  if (!client) {
    // Parse WEAVIATE_URL to extract scheme and host
    const url = new URL(WEAVIATE_URL);
    client = weaviate.client({
      scheme: url.protocol.replace(':', ''),
      host: url.host,
    });
  }
  return client;
}

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

/**
 * Hybrid search combining semantic + keyword search with reranking
 * Now supports optional query rewriting and autocut
 */
async function hybridSearch(query, options = {}) {
  const {
    project = DEFAULT_PROJECT,
    limit = 10,
    chunkTypes = null,  // ['function', 'component', 'hook', etc.]
    alpha = 0.5,  // 0 = keyword only, 1 = vector only, 0.5 = balanced
    rerank = true,
    rewrite = false,  // Enable query rewriting
    autocut = false,  // Enable automatic result filtering
  } = options;

  const wv = await getClient();

  // Optional query rewriting
  let searchQuery = query;
  let rewriteMetadata = null;
  if (rewrite) {
    const rewritten = optimizeForCodeSearch(query);
    searchQuery = rewritten.primary;
    rewriteMetadata = {
      original: query,
      rewritten: rewritten.primary,
      variants: rewritten.all,
      synonymsUsed: rewritten.metadata.synonymsUsed,
    };
  }

  // Build where filter
  const whereFilter = {
    operator: 'And',
    operands: [
      {
        path: ['project'],
        operator: 'Equal',
        valueText: project,
      },
    ],
  };

  if (chunkTypes && chunkTypes.length > 0) {
    whereFilter.operands.push({
      operator: 'Or',
      operands: chunkTypes.map((t) => ({
        path: ['chunkType'],
        operator: 'Equal',
        valueText: t,
      })),
    });
  }

  try {
    // Perform hybrid search - get more results if autocut is enabled
    const fetchLimit = autocut ? Math.max(limit * 3, 30) : (rerank ? limit * 2 : limit);

    let queryBuilder = wv.graphql
      .get()
      .withClassName('CodeChunk')
      .withHybrid({
        query: searchQuery,
        alpha,
      })
      .withWhere(whereFilter)
      .withLimit(fetchLimit)
      .withFields(
        'name content filePath chunkType lineStart lineEnd jsDoc signature isExported complexity _additional { score }'
      );

    const result = await queryBuilder.do();
    let chunks = result.data?.Get?.CodeChunk || [];

    // Apply autocut if enabled
    let autocutMetadata = null;
    if (autocut && chunks.length > 0) {
      // Prepare results with score for autocut
      const resultsWithScore = chunks.map(c => ({
        ...c,
        score: parseFloat(c._additional?.score) || 0,
      }));

      const autocutResult = adaptiveAutoCut(resultsWithScore, {
        maxResults: limit,
        minResults: Math.min(3, limit),
      });

      chunks = autocutResult.results;
      autocutMetadata = {
        method: 'adaptive',
        originalCount: autocutResult.totalResults,
        keptCount: autocutResult.cutIndex,
        gapFound: autocutResult.gapFound,
        largestGap: autocutResult.largestGap,
      };
    } else if (rerank && chunks.length > limit) {
      // Rerank if enabled and reranker is available
      chunks = await rerankResults(searchQuery, chunks, limit);
    } else {
      chunks = chunks.slice(0, limit);
    }

    const response = {
      query: searchQuery,
      originalQuery: rewrite ? query : undefined,
      project,
      resultCount: chunks.length,
      results: chunks.map((c, i) => ({
        rank: i + 1,
        name: c.name,
        type: c.chunkType,
        file: `${c.filePath}:${c.lineStart}`,
        signature: c.signature,
        jsDoc: c.jsDoc?.substring(0, 200),
        score: c._additional?.score || c.score,
        content: c.content,
      })),
    };

    // Add metadata about enhancements if used
    if (rewriteMetadata) {
      response.rewriteMetadata = rewriteMetadata;
    }
    if (autocutMetadata) {
      response.autocutMetadata = autocutMetadata;
    }

    return response;
  } catch (error) {
    return { error: error.message, query, project };
  }
}

/**
 * Advanced search combining all RAG features: rewriting + reflexion + autocut
 */
async function advancedSearch(query, options = {}) {
  const {
    project = DEFAULT_PROJECT,
    limit = 10,
    chunkTypes = null,
    threshold = 0.5,  // Quality threshold for reflexion
    maxAttempts = 3,  // Max reflexion attempts
  } = options;

  const startTime = Date.now();

  // Create search function for reflexion
  const searchFn = createSearchFn(
    async (q, alpha) => {
      const result = await hybridSearch(q, {
        project,
        limit: limit * 2,  // Get more for reflexion to work with
        chunkTypes,
        alpha,
        rewrite: false,  // Reflexion handles query reformulation
        autocut: false,  // We'll apply autocut at the end
      });
      return result.results || [];
    },
    {}
  );

  // Run reflexive search
  const reflexionResult = await reflexiveSearch(query, searchFn, {
    threshold,
    maxAttempts,
    limit: limit * 2,
    verbose: false,
  });

  // Apply autocut to final results
  let finalResults = reflexionResult.results;
  let autocutMetadata = null;

  if (finalResults.length > 0) {
    const autocutResult = adaptiveAutoCut(finalResults, {
      maxResults: limit,
      minResults: Math.min(3, limit),
    });

    finalResults = autocutResult.results;
    autocutMetadata = {
      method: 'adaptive',
      originalCount: autocutResult.totalResults,
      keptCount: autocutResult.cutIndex,
      gapFound: autocutResult.gapFound,
    };
  }

  const elapsed = Date.now() - startTime;

  return {
    query,
    project,
    resultCount: finalResults.length,
    results: finalResults.slice(0, limit).map((r, i) => ({
      rank: i + 1,
      name: r.name,
      type: r.type || r.chunkType,
      file: r.file || `${r.filePath}:${r.lineStart}`,
      signature: r.signature,
      jsDoc: r.jsDoc?.substring(0, 200),
      score: r.score,
      content: r.content,
    })),
    metadata: {
      totalAttempts: reflexionResult.totalAttempts,
      qualityMet: reflexionResult.qualityMet,
      bestScore: reflexionResult.bestScore,
      threshold,
      bestAttempt: reflexionResult.bestAttempt,
      attempts: reflexionResult.attempts,
      autocut: autocutMetadata,
      elapsedMs: elapsed,
    },
  };
}

/**
 * Rerank results using cross-encoder
 */
async function rerankResults(query, results, limit) {
  try {
    const wv = await getClient();

    // Use Weaviate's reranker module if available
    // For now, simple score-based reranking
    return results
      .sort((a, b) => (b._additional?.score || 0) - (a._additional?.score || 0))
      .slice(0, limit);
  } catch (error) {
    // Fallback to original results
    return results.slice(0, limit);
  }
}

/**
 * Build context bundle by following imports
 */
async function buildContext(filePath, options = {}) {
  const {
    project = DEFAULT_PROJECT,
    maxDepth = 2,
    maxFiles = 10,
    includeTypes = true,
  } = options;

  const wv = await getClient();
  const context = {
    mainFile: null,
    relatedFiles: [],
    types: [],
    totalLines: 0,
  };

  try {
    // Get the main file's chunks
    const mainResult = await wv.graphql
      .get()
      .withClassName('CodeChunk')
      .withWhere({
        operator: 'And',
        operands: [
          { path: ['project'], operator: 'Equal', valueText: project },
          { path: ['filePath'], operator: 'Equal', valueText: filePath },
        ],
      })
      .withFields('name content filePath chunkType imports dependencies usedTypes lineCount')
      .do();

    const mainChunks = mainResult.data?.Get?.CodeChunk || [];
    if (mainChunks.length === 0) {
      return { error: `File not found: ${filePath}` };
    }

    context.mainFile = {
      path: filePath,
      chunks: mainChunks,
      lineCount: mainChunks.reduce((sum, c) => sum + (c.lineCount || 0), 0),
    };
    context.totalLines += context.mainFile.lineCount;

    // Collect all dependencies
    const allDeps = new Set();
    const allTypes = new Set();

    for (const chunk of mainChunks) {
      (chunk.dependencies || []).forEach((d) => allDeps.add(d));
      (chunk.usedTypes || []).forEach((t) => allTypes.add(t));
    }

    // Fetch related files (depth 1)
    const relatedPaths = [...allDeps]
      .filter((d) => d.startsWith('@/') || d.startsWith('./') || d.startsWith('../'))
      .slice(0, maxFiles);

    for (const dep of relatedPaths) {
      // Convert import path to file path
      const depPath = dep.replace('@/', 'src/').replace(/^\.\//, '');

      const depResult = await wv.graphql
        .get()
        .withClassName('CodeChunk')
        .withWhere({
          operator: 'And',
          operands: [
            { path: ['project'], operator: 'Equal', valueText: project },
            { path: ['filePath'], operator: 'ContainsAny', valueText: [depPath] },
          ],
        })
        .withLimit(5)
        .withFields('name content filePath chunkType lineCount isExported')
        .do();

      const depChunks = depResult.data?.Get?.CodeChunk || [];
      if (depChunks.length > 0) {
        // Only include exported symbols
        const exportedChunks = depChunks.filter((c) => c.isExported);
        context.relatedFiles.push({
          path: depPath,
          chunks: exportedChunks,
          lineCount: exportedChunks.reduce((sum, c) => sum + (c.lineCount || 0), 0),
        });
        context.totalLines += exportedChunks.reduce((sum, c) => sum + (c.lineCount || 0), 0);
      }
    }

    // Fetch type definitions
    if (includeTypes && allTypes.size > 0) {
      const typeResult = await wv.graphql
        .get()
        .withClassName('TypeDefinition')
        .withWhere({
          operator: 'And',
          operands: [
            { path: ['project'], operator: 'Equal', valueText: project },
            { path: ['name'], operator: 'ContainsAny', valueText: [...allTypes] },
          ],
        })
        .withLimit(20)
        .withFields('name content filePath typeKind')
        .do();

      context.types = typeResult.data?.Get?.TypeDefinition || [];
      context.totalLines += context.types.reduce((sum, t) => sum + (t.content?.split('\n').length || 0), 0);
    }

    return context;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Find type definitions
 */
async function findTypes(query, options = {}) {
  const { project = DEFAULT_PROJECT, limit = 10 } = options;

  const wv = await getClient();

  try {
    const result = await wv.graphql
      .get()
      .withClassName('TypeDefinition')
      .withHybrid({
        query,
        alpha: 0.7,  // More semantic for types
      })
      .withWhere({
        path: ['project'],
        operator: 'Equal',
        valueText: project,
      })
      .withLimit(limit)
      .withFields('name content filePath typeKind properties extendsTypes jsDoc isExported fromDatabase')
      .do();

    const types = result.data?.Get?.TypeDefinition || [];

    return {
      query,
      project,
      resultCount: types.length,
      results: types.map((t) => ({
        name: t.name,
        kind: t.typeKind,
        file: t.filePath,
        properties: t.properties?.slice(0, 10),
        extends: t.extendsTypes,
        fromDB: t.fromDatabase,
        content: t.content,
      })),
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Find similar code chunks
 */
async function findSimilar(code, options = {}) {
  const { project = DEFAULT_PROJECT, limit = 5 } = options;

  const wv = await getClient();

  try {
    const result = await wv.graphql
      .get()
      .withClassName('CodeChunk')
      .withNearText({
        concepts: [code],
        certainty: 0.7,
      })
      .withWhere({
        path: ['project'],
        operator: 'Equal',
        valueText: project,
      })
      .withLimit(limit)
      .withFields('name content filePath chunkType lineStart signature _additional { certainty }')
      .do();

    const chunks = result.data?.Get?.CodeChunk || [];

    return {
      project,
      resultCount: chunks.length,
      results: chunks.map((c) => ({
        name: c.name,
        type: c.chunkType,
        file: `${c.filePath}:${c.lineStart}`,
        similarity: c._additional?.certainty,
        content: c.content,
      })),
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Search conversation memories
 */
async function searchMemories(query, options = {}) {
  const { project = null, limit = 5 } = options;

  const wv = await getClient();

  try {
    let builder = wv.graphql
      .get()
      .withClassName('ConversationMemory')
      .withHybrid({
        query,
        alpha: 0.7,
      })
      .withLimit(limit)
      .withFields('sessionId summary decisions filesModified project topics timestamp');

    if (project) {
      builder = builder.withWhere({
        path: ['project'],
        operator: 'ContainsAny',
        valueText: [project],
      });
    }

    const result = await builder.do();
    const memories = result.data?.Get?.ConversationMemory || [];

    return {
      query,
      project: project || 'all',
      resultCount: memories.length,
      results: memories.map((m) => ({
        sessionId: m.sessionId,
        summary: m.summary,
        decisions: m.decisions || [],
        files: m.filesModified || [],
        project: m.project,
        topics: m.topics || [],
        date: m.timestamp,
      })),
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get index status
 */
async function getStatus() {
  const wv = await getClient();

  try {
    const classes = ['CodeChunk', 'DocChunk', 'TypeDefinition', 'FileMetadata'];
    const stats = {};

    for (const className of classes) {
      try {
        const result = await wv.graphql
          .aggregate()
          .withClassName(className)
          .withFields('meta { count }')
          .do();

        stats[className] = result.data?.Aggregate?.[className]?.[0]?.meta?.count || 0;
      } catch {
        stats[className] = 0;
      }
    }

    // Get per-project breakdown
    const projectStats = {};
    try {
      const result = await wv.graphql
        .aggregate()
        .withClassName('CodeChunk')
        .withGroupBy(['project'])
        .withFields('groupedBy { value } meta { count }')
        .do();

      for (const group of result.data?.Aggregate?.CodeChunk || []) {
        projectStats[group.groupedBy.value] = group.meta.count;
      }
    } catch {
      // Ignore
    }

    return {
      status: 'connected',
      weaviateUrl: WEAVIATE_URL,
      totalChunks: stats,
      byProject: projectStats,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
}

// ============================================
// MCP SERVER SETUP
// ============================================

const server = new Server(
  {
    name: 'weaviate-rag',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'weaviate_search',
      description:
        'Hybrid semantic + keyword search for code. Finds functions, components, hooks, services by meaning. Use for questions like "where do we handle authentication" or "find payment processing code".',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language search query',
          },
          project: {
            type: 'string',
            description: 'Project to search in (default: matwal-premium)',
          },
          limit: {
            type: 'number',
            description: 'Max results (default: 10)',
          },
          chunkTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by type: function, component, hook, service, class',
          },
          alpha: {
            type: 'number',
            description: '0=keyword, 1=semantic, 0.5=balanced (default: 0.5)',
          },
          rewrite: {
            type: 'boolean',
            description: 'Enable query rewriting to expand abbreviations and add synonyms (default: false)',
          },
          autocut: {
            type: 'boolean',
            description: 'Enable automatic result filtering based on score gaps (default: false)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'weaviate_search_advanced',
      description:
        'Advanced search combining all RAG features: query rewriting, reflexive multi-attempt search, and automatic result filtering. Use for complex queries where basic search may not find the best results. Returns detailed metadata about the search process.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language search query',
          },
          project: {
            type: 'string',
            description: 'Project to search in (default: matwal-premium)',
          },
          limit: {
            type: 'number',
            description: 'Max results (default: 10)',
          },
          chunkTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by type: function, component, hook, service, class',
          },
          threshold: {
            type: 'number',
            description: 'Quality threshold for reflexion (0-1, default: 0.5). Higher values trigger more search attempts.',
          },
          maxAttempts: {
            type: 'number',
            description: 'Maximum reflexion attempts (default: 3)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'weaviate_context',
      description:
        'Build a context bundle for a file by following its imports and dependencies. Returns the file + related code + type definitions. Use when you need full context for a file.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Relative path to the file (e.g., src/services/crmService.ts)',
          },
          project: {
            type: 'string',
            description: 'Project name',
          },
          maxFiles: {
            type: 'number',
            description: 'Max related files to include (default: 10)',
          },
          includeTypes: {
            type: 'boolean',
            description: 'Include type definitions (default: true)',
          },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'weaviate_types',
      description:
        'Search for TypeScript type definitions, interfaces, and schemas. Use when you need to find or understand a type.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Type name or description to search for',
          },
          project: {
            type: 'string',
            description: 'Project name',
          },
          limit: {
            type: 'number',
            description: 'Max results',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'weaviate_similar',
      description:
        'Find code similar to a given snippet. Use for finding patterns, duplicates, or related implementations.',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Code snippet to find similar code for',
          },
          project: {
            type: 'string',
            description: 'Project name',
          },
          limit: {
            type: 'number',
            description: 'Max results',
          },
        },
        required: ['code'],
      },
    },
    {
      name: 'weaviate_status',
      description: 'Get the status of the Weaviate RAG index. Shows indexed projects and chunk counts.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'weaviate_memories',
      description:
        'Search past Claude Code conversation memories. Find what was discussed, decisions made, or files modified in previous sessions. Use for questions like "what did we decide about X" or "when did we work on Y".',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What to search for in past conversations',
          },
          project: {
            type: 'string',
            description: 'Filter by project name (optional)',
          },
          limit: {
            type: 'number',
            description: 'Max results (default: 5)',
          },
        },
        required: ['query'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'weaviate_search':
        result = await hybridSearch(args.query, {
          project: args.project,
          limit: args.limit,
          chunkTypes: args.chunkTypes,
          alpha: args.alpha,
          rewrite: args.rewrite,
          autocut: args.autocut,
        });
        break;

      case 'weaviate_search_advanced':
        result = await advancedSearch(args.query, {
          project: args.project,
          limit: args.limit,
          chunkTypes: args.chunkTypes,
          threshold: args.threshold,
          maxAttempts: args.maxAttempts,
        });
        break;

      case 'weaviate_context':
        result = await buildContext(args.filePath, {
          project: args.project,
          maxFiles: args.maxFiles,
          includeTypes: args.includeTypes,
        });
        break;

      case 'weaviate_types':
        result = await findTypes(args.query, {
          project: args.project,
          limit: args.limit,
        });
        break;

      case 'weaviate_similar':
        result = await findSimilar(args.code, {
          project: args.project,
          limit: args.limit,
        });
        break;

      case 'weaviate_status':
        result = await getStatus();
        break;

      case 'weaviate_memories':
        result = await searchMemories(args.query, {
          project: args.project,
          limit: args.limit,
        });
        break;

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Weaviate RAG MCP Server running');
}

main().catch(console.error);
