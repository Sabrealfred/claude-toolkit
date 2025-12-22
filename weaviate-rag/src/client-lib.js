#!/usr/bin/env node
/**
 * Weaviate RAG Client Library
 *
 * Shared library for integrating Weaviate RAG into MCPs and skills.
 * Provides simple functions for semantic code search.
 *
 * Usage:
 *   import { searchCode, getProjectContext } from '/root/weaviate-rag/src/client-lib.js';
 *
 *   const results = await searchCode('authentication hooks', { project: 'matwal-premium', limit: 5 });
 *   const context = await getProjectContext('matwal-premium');
 */

import weaviate from 'weaviate-client';

const WEAVIATE_URL = process.env.WEAVIATE_URL || 'http://localhost:8080';

let client = null;

/**
 * Get or create Weaviate client
 */
async function getClient() {
  if (!client) {
    client = await weaviate.connectToLocal({
      host: 'localhost',
      port: 8080,
      grpcPort: 50051
    });
  }
  return client;
}

/**
 * Search code using hybrid search (BM25 + vector)
 *
 * @param {string} query - Natural language search query
 * @param {Object} options - Search options
 * @param {string} [options.project] - Filter by project name
 * @param {number} [options.limit=5] - Max results
 * @param {string} [options.fileType] - Filter by file type (function, class, etc)
 * @returns {Promise<Array>} Search results
 */
export async function searchCode(query, options = {}) {
  const { project, limit = 5, fileType } = options;

  try {
    const weaviateClient = await getClient();
    const collection = weaviateClient.collections.get('CodeChunk');

    // Build filters
    const filters = [];
    if (project) {
      filters.push(collection.filter.byProperty('project').equal(project));
    }
    if (fileType) {
      filters.push(collection.filter.byProperty('type').equal(fileType));
    }

    const combinedFilter = filters.length > 1
      ? collection.filter.and(...filters)
      : filters[0] || null;

    const result = await collection.query.hybrid(query, {
      limit,
      alpha: 0.7, // 70% vector, 30% keyword
      returnProperties: ['content', 'filePath', 'project', 'type', 'name', 'startLine', 'endLine'],
      ...(combinedFilter && { filters: combinedFilter })
    });

    return result.objects.map(obj => ({
      file: obj.properties.filePath,
      project: obj.properties.project,
      type: obj.properties.type,
      name: obj.properties.name,
      content: obj.properties.content,
      lines: `${obj.properties.startLine}-${obj.properties.endLine}`
    }));
  } catch (err) {
    console.error('[Weaviate RAG] Search error:', err.message);
    return [];
  }
}

/**
 * Get project context summary
 *
 * @param {string} [project] - Project name (optional, returns all if not specified)
 * @returns {Promise<string>} Formatted context string
 */
export async function getProjectContext(project) {
  try {
    const weaviateClient = await getClient();
    const collection = weaviateClient.collections.get('CodeChunk');

    // Get aggregate stats
    const filter = project
      ? collection.filter.byProperty('project').equal(project)
      : null;

    const agg = await collection.aggregate.overAll({
      returnMetrics: ['count'],
      ...(filter && { filters: filter })
    });

    // Get sample of important types
    const types = ['function', 'class', 'component', 'hook'];
    const samples = {};

    for (const type of types) {
      const typeFilter = project
        ? collection.filter.and(
            collection.filter.byProperty('project').equal(project),
            collection.filter.byProperty('type').equal(type)
          )
        : collection.filter.byProperty('type').equal(type);

      const result = await collection.query.fetchObjects({
        limit: 3,
        returnProperties: ['name', 'filePath', 'project'],
        filters: typeFilter
      });

      if (result.objects.length > 0) {
        samples[type] = result.objects.map(o => ({
          name: o.properties.name,
          file: o.properties.filePath,
          project: o.properties.project
        }));
      }
    }

    // Format context
    let context = `## Codebase Context\n`;
    context += `Total indexed chunks: ${agg.totalCount || 0}\n`;
    if (project) context += `Project: ${project}\n`;
    context += `\n`;

    for (const [type, items] of Object.entries(samples)) {
      if (items.length > 0) {
        context += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s:\n`;
        items.forEach(item => {
          context += `- ${item.name} (${item.file})\n`;
        });
        context += '\n';
      }
    }

    return context;
  } catch (err) {
    console.error('[Weaviate RAG] Context error:', err.message);
    return '## Codebase Context\nError loading context.\n';
  }
}

/**
 * List all indexed projects
 *
 * @returns {Promise<Array>} List of project names with chunk counts
 */
export async function listProjects() {
  try {
    const weaviateClient = await getClient();
    const collection = weaviateClient.collections.get('CodeChunk');

    // Get all unique projects (using groupBy)
    const result = await collection.aggregate.overAll({
      groupBy: { property: 'project' },
      returnMetrics: ['count']
    });

    return result.groups.map(g => ({
      name: g.groupedBy.value,
      chunks: g.totalCount
    }));
  } catch (err) {
    console.error('[Weaviate RAG] List projects error:', err.message);
    return [];
  }
}

/**
 * Get similar code to a given snippet
 *
 * @param {string} codeSnippet - Code to find similar code for
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Similar code results
 */
export async function findSimilarCode(codeSnippet, options = {}) {
  const { project, limit = 5 } = options;

  try {
    const weaviateClient = await getClient();
    const collection = weaviateClient.collections.get('CodeChunk');

    const filter = project
      ? collection.filter.byProperty('project').equal(project)
      : null;

    const result = await collection.query.nearText(codeSnippet, {
      limit,
      returnProperties: ['content', 'filePath', 'project', 'type', 'name'],
      ...(filter && { filters: filter })
    });

    return result.objects.map(obj => ({
      file: obj.properties.filePath,
      project: obj.properties.project,
      type: obj.properties.type,
      name: obj.properties.name,
      content: obj.properties.content,
      similarity: obj.metadata?.distance ? (1 - obj.metadata.distance).toFixed(3) : null
    }));
  } catch (err) {
    console.error('[Weaviate RAG] Similar code error:', err.message);
    return [];
  }
}

// Export all functions
export default {
  searchCode,
  getProjectContext,
  listProjects,
  findSimilarCode
};
