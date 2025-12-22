/**
 * Weaviate Client Wrapper
 *
 * Provides a simple interface for other MCPs to use Weaviate RAG.
 * Can be imported by multi-agent and orchestrator MCPs.
 */

import weaviate from 'weaviate-ts-client';

let client = null;

/**
 * Get or create Weaviate client
 */
export async function getClient(url = 'http://localhost:8080') {
  if (!client) {
    client = weaviate.client({
      scheme: 'http',
      host: url.replace('http://', '').replace('https://', ''),
    });
  }
  return client;
}

/**
 * Hybrid search for code
 */
export async function searchCode(query, options = {}) {
  const {
    project = 'matwal-premium',
    limit = 5,
    chunkTypes = null,
    alpha = 0.5,
  } = options;

  const wv = await getClient();

  const whereFilter = {
    operator: 'And',
    operands: [
      { path: ['project'], operator: 'Equal', valueText: project },
    ],
  };

  if (chunkTypes?.length) {
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
    const result = await wv.graphql
      .get()
      .withClassName('CodeChunk')
      .withHybrid({ query, alpha })
      .withWhere(whereFilter)
      .withLimit(limit)
      .withFields('name content filePath chunkType lineStart lineEnd jsDoc signature')
      .do();

    return result.data?.Get?.CodeChunk || [];
  } catch (error) {
    console.error('Weaviate search error:', error.message);
    return [];
  }
}

/**
 * Search for types
 */
export async function searchTypes(query, options = {}) {
  const { project = 'matwal-premium', limit = 5 } = options;

  const wv = await getClient();

  try {
    const result = await wv.graphql
      .get()
      .withClassName('TypeDefinition')
      .withHybrid({ query, alpha: 0.7 })
      .withWhere({
        path: ['project'],
        operator: 'Equal',
        valueText: project,
      })
      .withLimit(limit)
      .withFields('name content filePath typeKind properties')
      .do();

    return result.data?.Get?.TypeDefinition || [];
  } catch (error) {
    console.error('Weaviate type search error:', error.message);
    return [];
  }
}

/**
 * Format results for context injection
 */
export function formatResultsForContext(results, maxChars = 10000) {
  let output = '';
  let chars = 0;

  for (const r of results) {
    const block = `### ${r.name} (${r.chunkType || r.typeKind})\n` +
      `File: ${r.filePath}${r.lineStart ? `:${r.lineStart}` : ''}\n` +
      '```typescript\n' +
      r.content +
      '\n```\n\n';

    if (chars + block.length > maxChars) break;
    output += block;
    chars += block.length;
  }

  return output;
}

/**
 * Check if Weaviate is available
 */
export async function isAvailable() {
  try {
    const wv = await getClient();
    await wv.misc.metaGetter().do();
    return true;
  } catch {
    return false;
  }
}

export default {
  getClient,
  searchCode,
  searchTypes,
  formatResultsForContext,
  isAvailable,
};
