/**
 * LLM-Based Query Rewriter for Weaviate RAG
 *
 * Transforms user queries into more effective search queries using:
 * 1. LLM-based rewriting (OpenRouter API) for semantic understanding
 * 2. Local abbreviation expansion as fallback
 * 3. Synonym addition for better recall
 *
 * Example transformation:
 *   Input:  "how auth works"
 *   Output: "How does authentication and authorization work? Login flow, session management, JWT tokens, user sessions"
 *
 * Usage:
 *   import { rewriteQuery } from './query-rewriter.js';
 *   const optimizedQuery = await rewriteQuery('fix btn click bug');
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Default model - cheap and fast for query rewriting
const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct';

// System prompt for LLM-based query optimization
const SYSTEM_PROMPT = `You are a query optimizer for a code search system. Your job is to take short, informal queries and expand them into comprehensive search queries that will match relevant code.

RULES:
1. Expand abbreviations (auth -> authentication, btn -> button, nav -> navigation, etc.)
2. Add relevant synonyms and related terms
3. Include common programming patterns and concepts related to the query
4. Keep the output focused and relevant - don't add unrelated concepts
5. Output ONLY the optimized query, no explanations or formatting
6. Keep output under 100 words
7. Use natural language that embeddings can match well

EXAMPLES:
- "how auth works" -> "How does authentication and authorization work? Login flow, session management, JWT tokens, user sessions, access control, permissions"
- "fix btn click bug" -> "Button click event handler bug fix. onClick event, button component, click listener, event propagation, UI interaction"
- "add dark mode" -> "Dark mode theme implementation. Theme toggle, color scheme, CSS variables, light dark theme switching, appearance settings"
- "db migration" -> "Database migration. Schema changes, migration files, SQL alterations, database versioning, table modifications"
- "api rate limit" -> "API rate limiting implementation. Request throttling, rate limiter, API quotas, request limits, throttle middleware"`;

// Common code abbreviations and their expansions (for local fallback)
const ABBREVIATIONS = {
  'auth': ['authentication', 'authorization', 'auth'],
  'db': ['database', 'db', 'data store'],
  'api': ['api', 'endpoint', 'rest', 'graphql'],
  'ui': ['ui', 'user interface', 'frontend', 'component'],
  'btn': ['button', 'btn'],
  'nav': ['navigation', 'nav', 'menu'],
  'msg': ['message', 'notification', 'msg'],
  'err': ['error', 'exception', 'err'],
  'req': ['request', 'req'],
  'res': ['response', 'res'],
  'ctx': ['context', 'ctx'],
  'fn': ['function', 'fn', 'method'],
  'cb': ['callback', 'cb'],
  'util': ['utility', 'util', 'helper'],
  'config': ['configuration', 'config', 'settings'],
  'env': ['environment', 'env'],
  'init': ['initialize', 'init', 'setup'],
  'async': ['asynchronous', 'async', 'await'],
  'sync': ['synchronous', 'sync'],
  'val': ['validation', 'validate', 'val'],
  'fmt': ['format', 'fmt', 'formatting'],
  'str': ['string', 'str', 'text'],
  'num': ['number', 'num', 'integer'],
  'arr': ['array', 'arr', 'list'],
  'obj': ['object', 'obj'],
  'param': ['parameter', 'param', 'argument'],
  'prop': ['property', 'prop'],
  'attr': ['attribute', 'attr'],
  'elem': ['element', 'elem'],
  'idx': ['index', 'idx'],
  'len': ['length', 'len', 'size'],
  'max': ['maximum', 'max'],
  'min': ['minimum', 'min'],
  'avg': ['average', 'avg', 'mean'],
  'cnt': ['count', 'cnt'],
  'tmp': ['temporary', 'tmp', 'temp'],
  'src': ['source', 'src'],
  'dest': ['destination', 'dest', 'target'],
  'prev': ['previous', 'prev'],
  'curr': ['current', 'curr'],
  'next': ['next', 'following'],
  'jwt': ['JWT', 'JSON Web Token', 'token'],
  'oauth': ['OAuth', 'authentication', 'authorization'],
  'sso': ['single sign-on', 'SSO'],
  'mfa': ['multi-factor authentication', 'MFA', '2FA'],
  'rbac': ['role-based access control', 'RBAC', 'permissions'],
  'crud': ['CRUD', 'create read update delete'],
  'orm': ['ORM', 'object-relational mapping'],
  'sql': ['SQL', 'query', 'database'],
  'nosql': ['NoSQL', 'database', 'document store'],
  'redis': ['Redis', 'cache'],
  'pg': ['PostgreSQL', 'Postgres', 'database'],
  'mongo': ['MongoDB', 'database'],
  'supabase': ['Supabase', 'database', 'backend'],
  'k8s': ['Kubernetes', 'container orchestration'],
  'docker': ['Docker', 'container'],
  'ci': ['continuous integration', 'CI'],
  'cd': ['continuous deployment', 'CD'],
  'tdd': ['test-driven development', 'TDD'],
  'e2e': ['end-to-end', 'E2E', 'testing'],
  'ws': ['WebSocket', 'real-time'],
  'rpc': ['RPC', 'remote procedure call'],
  'grpc': ['gRPC', 'protocol buffers'],
  'graphql': ['GraphQL', 'query language'],
  'rest': ['REST', 'RESTful', 'API'],
};

// Domain-specific synonyms
const DOMAIN_SYNONYMS = {
  'login': ['login', 'sign in', 'authentication', 'authenticate'],
  'logout': ['logout', 'sign out', 'log out'],
  'register': ['register', 'sign up', 'create account', 'onboarding'],
  'fetch': ['fetch', 'get', 'retrieve', 'load', 'query'],
  'save': ['save', 'store', 'persist', 'write', 'insert', 'update'],
  'delete': ['delete', 'remove', 'destroy', 'drop'],
  'create': ['create', 'add', 'new', 'insert', 'generate'],
  'update': ['update', 'modify', 'edit', 'change', 'patch'],
  'validate': ['validate', 'check', 'verify', 'ensure'],
  'format': ['format', 'transform', 'convert', 'parse'],
  'render': ['render', 'display', 'show', 'present'],
  'handle': ['handle', 'process', 'manage', 'deal with'],
  'submit': ['submit', 'send', 'post', 'push'],
  'upload': ['upload', 'import', 'load'],
  'download': ['download', 'export', 'save'],
  'search': ['search', 'find', 'query', 'lookup', 'filter'],
  'sort': ['sort', 'order', 'arrange', 'rank'],
  'filter': ['filter', 'select', 'where', 'query'],
  'paginate': ['paginate', 'page', 'pagination', 'paging'],
  'cache': ['cache', 'memo', 'memoize', 'store'],
  'modal': ['modal', 'dialog', 'popup', 'overlay'],
  'form': ['form', 'input', 'fields'],
  'table': ['table', 'grid', 'list', 'data table'],
  'chart': ['chart', 'graph', 'visualization', 'plot'],
  'notification': ['notification', 'toast', 'alert', 'message', 'snackbar'],
  'permission': ['permission', 'role', 'access', 'authorization', 'rls'],
  'hook': ['hook', 'use', 'custom hook', 'react hook'],
  'state': ['state', 'store', 'context', 'redux', 'zustand'],
  'effect': ['effect', 'side effect', 'useEffect'],
  'middleware': ['middleware', 'interceptor', 'handler'],
  'route': ['route', 'path', 'endpoint', 'url'],
  'component': ['component', 'widget', 'element', 'ui'],
  'service': ['service', 'api', 'client', 'provider'],
  'utility': ['utility', 'util', 'helper', 'common'],
};

/**
 * Rewrite a query using an LLM to optimize it for vector search
 *
 * @param {string} query - The original user query
 * @param {Object} options - Rewrite options
 * @param {string} [options.model] - OpenRouter model ID (default: llama-3.1-8b-instruct)
 * @param {number} [options.temperature] - Sampling temperature (default: 0.3)
 * @param {number} [options.maxTokens] - Max tokens to generate (default: 150)
 * @param {number} [options.timeout] - Request timeout in ms (default: 10000)
 * @param {boolean} [options.fallbackToLocal] - Use local expansion on failure (default: true)
 * @param {string} [options.context] - Additional context for the query (e.g., project type)
 * @param {boolean} [options.useLLM] - Whether to use LLM (default: true if API key exists)
 * @returns {Promise<string>} The optimized query
 */
export async function rewriteQuery(query, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 150,
    timeout = 10000,
    fallbackToLocal = true,
    context = null,
    useLLM = true,
  } = options;

  // Get API key from environment
  const apiKey = process.env.OPENROUTER_API_KEY;

  // If no API key or LLM disabled, use local expansion
  if (!apiKey || !useLLM) {
    if (!apiKey) {
      console.warn('[QueryRewriter] OPENROUTER_API_KEY not set, using local expansion');
    }
    return localRewriteQuery(query).rewritten;
  }

  // Skip rewriting for very long queries (likely already detailed)
  if (query.length > 200) {
    return query;
  }

  // Skip rewriting for very short queries (likely too vague)
  if (query.length < 3) {
    return query;
  }

  try {
    // Build the user message with optional context
    let userMessage = query;
    if (context) {
      userMessage = `Context: ${context}\n\nQuery: ${query}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/Marsala-dev/claude-toolkit',
        'X-Title': 'Weaviate RAG Query Rewriter',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: 0.9,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rewrittenQuery = data.choices?.[0]?.message?.content?.trim();

    if (!rewrittenQuery) {
      throw new Error('Empty response from LLM');
    }

    // Validate the rewritten query isn't too long
    if (rewrittenQuery.length > 500) {
      console.warn('[QueryRewriter] Rewritten query too long, truncating');
      return rewrittenQuery.substring(0, 500);
    }

    return rewrittenQuery;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[QueryRewriter] Request timed out');
    } else {
      console.warn('[QueryRewriter] LLM error:', error.message);
    }

    // Fallback to local expansion
    if (fallbackToLocal) {
      return localRewriteQuery(query).rewritten;
    }
    throw error;
  }
}

/**
 * Local query rewriting using abbreviations and synonyms (no LLM)
 *
 * @param {string} query - Original user query
 * @param {Object} options - Rewriting options
 * @param {boolean} [options.expandAbbreviations] - Expand abbreviations (default: true)
 * @param {boolean} [options.addSynonyms] - Add synonyms (default: true)
 * @param {boolean} [options.generateVariants] - Generate query variants (default: true)
 * @param {number} [options.maxVariants] - Max variants to generate (default: 3)
 * @returns {Object} Rewritten query information
 */
export function localRewriteQuery(query, options = {}) {
  const {
    expandAbbreviations = true,
    addSynonyms = true,
    generateVariants = true,
    maxVariants = 3,
  } = options;

  const originalQuery = query.trim().toLowerCase();
  const words = originalQuery.split(/\s+/);

  let expandedWords = [];
  let synonymsAdded = new Set();

  // Process each word
  for (const word of words) {
    // Expand abbreviations
    if (expandAbbreviations && ABBREVIATIONS[word]) {
      expandedWords.push(ABBREVIATIONS[word][0]); // Use primary expansion
      ABBREVIATIONS[word].forEach(exp => synonymsAdded.add(exp));
    } else {
      expandedWords.push(word);
    }

    // Add domain synonyms
    if (addSynonyms && DOMAIN_SYNONYMS[word]) {
      DOMAIN_SYNONYMS[word].forEach(syn => synonymsAdded.add(syn));
    }
  }

  const rewrittenQuery = expandedWords.join(' ');

  // Generate query variants
  const variants = [];
  if (generateVariants) {
    // Variant 1: Original + synonyms
    const synArray = [...synonymsAdded].filter(s => !rewrittenQuery.includes(s));
    if (synArray.length > 0) {
      variants.push(`${rewrittenQuery} ${synArray.slice(0, 3).join(' ')}`);
    }

    // Variant 2: Code-style query (PascalCase)
    const codeStyleQuery = words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    variants.push(codeStyleQuery);

    // Variant 3: Function-style query (camelCase)
    const fnStyleQuery = `${words[0]}${words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
    if (fnStyleQuery !== codeStyleQuery) {
      variants.push(fnStyleQuery);
    }
  }

  return {
    original: query,
    rewritten: rewrittenQuery,
    variants: variants.slice(0, maxVariants),
    synonymsUsed: [...synonymsAdded],
    confidence: calculateConfidence(query, rewrittenQuery),
  };
}

/**
 * Calculate confidence score for query rewriting
 */
function calculateConfidence(original, rewritten) {
  if (original.toLowerCase() === rewritten.toLowerCase()) {
    return 0.5; // No transformation
  }

  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const rewrittenWords = new Set(rewritten.toLowerCase().split(/\s+/));

  let common = 0;
  for (const word of originalWords) {
    if (rewrittenWords.has(word)) common++;
  }

  const similarity = common / Math.max(originalWords.size, rewrittenWords.size);

  if (similarity >= 0.3 && similarity <= 0.8) {
    return 0.9;
  } else if (similarity > 0.8) {
    return 0.7;
  } else {
    return 0.5;
  }
}

/**
 * Batch rewrite multiple queries efficiently
 *
 * @param {string[]} queries - Array of queries to rewrite
 * @param {Object} options - Rewrite options (same as rewriteQuery)
 * @returns {Promise<string[]>} Array of rewritten queries
 */
export async function rewriteQueries(queries, options = {}) {
  const results = await Promise.all(
    queries.map((query) => rewriteQuery(query, options))
  );
  return results;
}

/**
 * Create a query rewriter with preset options
 *
 * @param {Object} defaultOptions - Default options for all rewrites
 * @returns {Object} Object with rewriteQuery and rewriteQueries methods
 */
export function createQueryRewriter(defaultOptions = {}) {
  return {
    rewriteQuery: (query, options = {}) =>
      rewriteQuery(query, { ...defaultOptions, ...options }),
    rewriteQueries: (queries, options = {}) =>
      rewriteQueries(queries, { ...defaultOptions, ...options }),
    localRewriteQuery: (query, options = {}) =>
      localRewriteQuery(query, { ...defaultOptions, ...options }),
  };
}

/**
 * Generate search-optimized query for code search
 * Uses local rewriting for quick results
 *
 * @param {string} query - Original query
 * @returns {Object} Optimized query information
 */
export function optimizeForCodeSearch(query) {
  const rewritten = localRewriteQuery(query);

  const optimizedQueries = [rewritten.rewritten];
  if (rewritten.variants.length > 0) {
    optimizedQueries.push(rewritten.variants[0]);
  }

  return {
    primary: rewritten.rewritten,
    secondary: rewritten.variants[0] || rewritten.rewritten,
    all: optimizedQueries,
    metadata: rewritten,
  };
}

/**
 * Smart hybrid rewriting: local expansion + optional LLM enhancement
 *
 * @param {string} query - The original query
 * @param {Object} options - Options including useLLM flag
 * @returns {Promise<string>} The optimized query
 */
export async function smartRewriteQuery(query, options = {}) {
  const { useLLM = !!process.env.OPENROUTER_API_KEY, ...llmOptions } = options;

  // First, do local abbreviation expansion
  const localResult = localRewriteQuery(query);
  const locallyExpanded = localResult.rewritten;

  // If LLM is enabled and available, enhance with LLM
  if (useLLM) {
    return rewriteQuery(locallyExpanded, { ...llmOptions, useLLM: true });
  }

  return locallyExpanded;
}

// Export abbreviations and synonyms for external use
export { ABBREVIATIONS, DOMAIN_SYNONYMS };

// Default export for convenience
export default {
  rewriteQuery,
  rewriteQueries,
  localRewriteQuery,
  createQueryRewriter,
  optimizeForCodeSearch,
  smartRewriteQuery,
  ABBREVIATIONS,
  DOMAIN_SYNONYMS,
};
