/**
 * Reflexion Search Module
 *
 * Implements reflexive search with automatic query reformulation.
 * When initial search results have low quality (top score < threshold),
 * the module automatically reformulates the query and tries different
 * search strategies (varying alpha between keyword and semantic).
 *
 * Flow:
 * 1. Initial search with alpha=0.7 (semantic-leaning)
 * 2. If top score < 0.7: rewrite query, try alpha=0.3 (keyword-leaning)
 * 3. If still poor: try alpha=0.9 (highly semantic)
 * 4. Return best results across all attempts
 *
 * Usage:
 *   import { reflexiveSearch } from './reflexion.js';
 *
 *   const results = await reflexiveSearch('auth login', searchFn, { threshold: 0.7 });
 */

/**
 * Query reformulation strategies
 * Each strategy takes the original query and returns a reformulated version
 */
const reformulationStrategies = {
  /**
   * Expand query with synonyms and related terms
   */
  expand: (query) => {
    const expansions = {
      auth: 'authentication authorization login session token',
      login: 'sign in authenticate user credentials',
      user: 'account profile member',
      fetch: 'get retrieve request load',
      save: 'store persist write update insert',
      delete: 'remove destroy clear',
      list: 'array collection items fetch all',
      form: 'input fields validation submit',
      modal: 'dialog popup overlay',
      button: 'btn click action trigger',
      api: 'endpoint request response service',
      hook: 'useEffect useState custom react',
      component: 'react jsx tsx ui element',
      service: 'api client fetch handler',
      util: 'helper utility function tool',
      type: 'interface schema definition typescript',
      error: 'exception catch handle failure',
      state: 'store context reducer management',
      route: 'path navigation page url',
      test: 'spec jest describe it expect',
    };

    const words = query.toLowerCase().split(/\s+/);
    const expanded = words.map((word) => {
      for (const [key, expansion] of Object.entries(expansions)) {
        if (word.includes(key) || key.includes(word)) {
          return `${word} ${expansion}`;
        }
      }
      return word;
    });

    return expanded.join(' ');
  },

  /**
   * Simplify query by removing noise words and focusing on key terms
   */
  simplify: (query) => {
    const noiseWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall',
      'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once',
      'here', 'there', 'when', 'where', 'why', 'how', 'all',
      'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
      'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because',
      'while', 'although', 'this', 'that', 'these', 'those',
      'i', 'we', 'you', 'he', 'she', 'it', 'they', 'what', 'which',
      'who', 'whom', 'find', 'show', 'get', 'me', 'my', 'our',
    ]);

    const words = query.toLowerCase().split(/\s+/);
    const simplified = words.filter((word) => !noiseWords.has(word));

    return simplified.length > 0 ? simplified.join(' ') : query;
  },

  /**
   * Convert to code-style terms (camelCase, snake_case patterns)
   */
  codeStyle: (query) => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return query;

    // Generate multiple code-style variations
    const variations = [];

    // camelCase
    const camelCase = words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    variations.push(camelCase);

    // PascalCase
    const pascalCase = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    variations.push(pascalCase);

    // snake_case
    const snakeCase = words.join('_');
    variations.push(snakeCase);

    // kebab-case
    const kebabCase = words.join('-');
    variations.push(kebabCase);

    // Add use prefix for hooks
    if (!words[0].startsWith('use')) {
      variations.push('use' + pascalCase);
    }

    // Add handle prefix for handlers
    if (!words[0].startsWith('handle')) {
      variations.push('handle' + pascalCase);
    }

    return `${query} ${variations.join(' ')}`;
  },

  /**
   * Focus on function/component names
   */
  functionFocus: (query) => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return query;

    const prefixes = ['get', 'set', 'fetch', 'load', 'save', 'update', 'delete', 'create', 'handle', 'use', 'on'];
    const suggestions = [];

    for (const prefix of prefixes) {
      const pascalWords = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      suggestions.push(`${prefix}${pascalWords}`);
    }

    return `${query} ${suggestions.slice(0, 5).join(' ')}`;
  },
};

/**
 * Extract the top score from search results
 *
 * @param {Array} results - Search results with score property
 * @returns {number} The highest score, or 0 if no results
 */
function getTopScore(results) {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return 0;
  }

  // Handle different result formats
  // The mcp-server returns results with score in _additional or directly
  const scores = results.map((r) => {
    if (typeof r.score === 'number') return r.score;
    if (r._additional?.score) return parseFloat(r._additional.score);
    if (r._additional?.certainty) return r._additional.certainty;
    return 0;
  });

  return Math.max(...scores, 0);
}

/**
 * Merge and deduplicate results from multiple search attempts
 *
 * @param {Array} allAttempts - Array of attempt objects with results
 * @returns {Array} Deduplicated and sorted results
 */
function mergeResults(allAttempts) {
  const seen = new Map();

  for (const attempt of allAttempts) {
    if (!attempt.results || !Array.isArray(attempt.results)) continue;

    for (const result of attempt.results) {
      // Create a unique key based on file path and name
      const key = `${result.file || result.filePath}:${result.name}`;

      // Keep the result with the highest score
      const existingScore = seen.get(key)?.score || 0;
      const currentScore = result.score || result._additional?.score || 0;

      if (!seen.has(key) || currentScore > existingScore) {
        seen.set(key, {
          ...result,
          score: currentScore,
        });
      }
    }
  }

  // Sort by score descending
  return Array.from(seen.values()).sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Reflexive search with automatic query reformulation
 *
 * @param {string} query - The original search query
 * @param {Function} searchFn - Function that takes (query, alpha) and returns results with scores
 * @param {Object} options - Configuration options
 * @param {number} [options.threshold=0.7] - Minimum acceptable top score
 * @param {number} [options.maxAttempts=4] - Maximum search attempts
 * @param {number} [options.limit=10] - Max results per search
 * @param {boolean} [options.verbose=false] - Log debug information
 * @returns {Promise<Object>} Search results with metadata about attempts
 */
export async function reflexiveSearch(query, searchFn, options = {}) {
  const {
    threshold = 0.7,
    maxAttempts = 4,
    limit = 10,
    verbose = false,
  } = options;

  const attempts = [];
  const alphaStrategies = [
    { alpha: 0.7, name: 'balanced-semantic', reformulate: null },
    { alpha: 0.3, name: 'keyword-heavy', reformulate: 'expand' },
    { alpha: 0.9, name: 'pure-semantic', reformulate: 'simplify' },
    { alpha: 0.5, name: 'balanced', reformulate: 'codeStyle' },
  ];

  let bestScore = 0;
  let bestAttempt = null;

  for (let i = 0; i < Math.min(maxAttempts, alphaStrategies.length); i++) {
    const strategy = alphaStrategies[i];

    // Reformulate query if needed
    let searchQuery = query;
    if (strategy.reformulate && reformulationStrategies[strategy.reformulate]) {
      searchQuery = reformulationStrategies[strategy.reformulate](query);
    }

    if (verbose) {
      console.error(`[Reflexion] Attempt ${i + 1}: strategy=${strategy.name}, alpha=${strategy.alpha}`);
      console.error(`[Reflexion] Query: "${searchQuery}"`);
    }

    try {
      // Execute search
      const results = await searchFn(searchQuery, strategy.alpha);

      // Handle both array results and object results with results property
      const resultArray = Array.isArray(results) ? results : (results?.results || []);

      const topScore = getTopScore(resultArray);

      const attempt = {
        attemptNumber: i + 1,
        strategy: strategy.name,
        alpha: strategy.alpha,
        originalQuery: query,
        searchQuery,
        reformulation: strategy.reformulate,
        topScore,
        resultCount: resultArray.length,
        results: resultArray.slice(0, limit),
      };

      attempts.push(attempt);

      if (verbose) {
        console.error(`[Reflexion] Top score: ${topScore.toFixed(3)}, results: ${resultArray.length}`);
      }

      // Track best attempt
      if (topScore > bestScore) {
        bestScore = topScore;
        bestAttempt = attempt;
      }

      // If we found good results, stop early
      if (topScore >= threshold) {
        if (verbose) {
          console.error(`[Reflexion] Good results found, stopping early`);
        }
        break;
      }
    } catch (error) {
      if (verbose) {
        console.error(`[Reflexion] Search error: ${error.message}`);
      }

      attempts.push({
        attemptNumber: i + 1,
        strategy: strategy.name,
        alpha: strategy.alpha,
        originalQuery: query,
        searchQuery,
        error: error.message,
        topScore: 0,
        resultCount: 0,
        results: [],
      });
    }
  }

  // Merge all results
  const mergedResults = mergeResults(attempts);

  return {
    originalQuery: query,
    totalAttempts: attempts.length,
    bestAttempt: bestAttempt ? {
      strategy: bestAttempt.strategy,
      alpha: bestAttempt.alpha,
      searchQuery: bestAttempt.searchQuery,
      topScore: bestAttempt.topScore,
    } : null,
    qualityMet: bestScore >= threshold,
    threshold,
    bestScore,
    results: mergedResults.slice(0, limit),
    attempts: attempts.map((a) => ({
      attemptNumber: a.attemptNumber,
      strategy: a.strategy,
      alpha: a.alpha,
      searchQuery: a.searchQuery,
      topScore: a.topScore,
      resultCount: a.resultCount,
      error: a.error,
    })),
  };
}

/**
 * Create a search function wrapper for the Weaviate hybrid search
 * This adapts the hybridSearch function to work with reflexiveSearch
 *
 * @param {Function} hybridSearchFn - The hybridSearch function from mcp-server
 * @param {Object} baseOptions - Base options to pass to every search
 * @returns {Function} A search function compatible with reflexiveSearch
 */
export function createSearchFn(hybridSearchFn, baseOptions = {}) {
  return async (query, alpha) => {
    const result = await hybridSearchFn(query, {
      ...baseOptions,
      alpha,
    });
    return result.results || [];
  };
}

/**
 * Reformulation strategies object for external use
 */
export const strategies = reformulationStrategies;

export default {
  reflexiveSearch,
  createSearchFn,
  strategies,
};
