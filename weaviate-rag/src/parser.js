/**
 * TypeScript/JavaScript Parser for Code Chunking
 *
 * Extracts logical units of code:
 * - Functions (regular, arrow, async)
 * - Classes and methods
 * - React components
 * - Hooks (useXxx)
 * - Type definitions
 *
 * Uses regex-based parsing for reliability
 */

import { readFileSync } from 'fs';
import { basename, extname } from 'path';

/**
 * Parse a TypeScript/JavaScript file into logical chunks
 */
export function parseFile(filePath, projectName) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const ext = extname(filePath);

  // Extract file-level metadata
  const imports = extractImports(content);
  const fileExports = extractExports(content);

  // Parse different chunk types
  const chunks = [];

  // 1. Extract functions
  chunks.push(...extractFunctions(content, lines, filePath, projectName, imports));

  // 2. Extract classes
  chunks.push(...extractClasses(content, lines, filePath, projectName, imports));

  // 3. Extract type definitions (only for .ts/.tsx)
  if (ext === '.ts' || ext === '.tsx') {
    chunks.push(...extractTypes(content, lines, filePath, projectName));
  }

  // Add file metadata to each chunk
  return chunks.map((chunk) => ({
    ...chunk,
    imports: imports.map((i) => i.source),
    fileExports,
  }));
}

/**
 * Extract import statements
 */
function extractImports(content) {
  const imports = [];
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)*\s*from\s*['"]([^'"]+)['"]/g;
  const sideEffectImport = /import\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.test(content) ? importRegex.exec(content) : null) !== null) {
    imports.push({
      statement: match[0],
      source: match[1],
    });
  }

  // Reset and run again properly
  importRegex.lastIndex = 0;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push({
      statement: match[0],
      source: match[1],
    });
  }

  while ((match = sideEffectImport.exec(content)) !== null) {
    imports.push({
      statement: match[0],
      source: match[1],
    });
  }

  return imports;
}

/**
 * Extract exports
 */
function extractExports(content) {
  const exports = [];

  // Named exports
  const namedExport = /export\s+(?:async\s+)?(?:function|const|let|var|class|interface|type)\s+(\w+)/g;
  let match;
  while ((match = namedExport.exec(content)) !== null) {
    exports.push(match[1]);
  }

  // Default export
  if (/export\s+default/.test(content)) {
    const defaultMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
    if (defaultMatch) {
      exports.push(`default:${defaultMatch[1]}`);
    } else {
      exports.push('default');
    }
  }

  return exports;
}

/**
 * Extract JSDoc comment before a position
 */
function extractJSDoc(content, position) {
  const beforeContent = content.substring(0, position);
  const jsDocMatch = beforeContent.match(/\/\*\*[\s\S]*?\*\/\s*$/);
  if (jsDocMatch) {
    return jsDocMatch[0].trim();
  }

  // Also check for single-line comments
  const lines = beforeContent.split('\n');
  const commentLines = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('//')) {
      commentLines.unshift(line);
    } else if (line === '') {
      continue;
    } else {
      break;
    }
  }

  return commentLines.length > 0 ? commentLines.join('\n') : '';
}

/**
 * Get line number from position
 */
function getLineNumber(content, position) {
  return content.substring(0, position).split('\n').length;
}

/**
 * Find matching brace end position
 */
function findMatchingBrace(content, startPos) {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let inComment = false;
  let inMultiComment = false;

  for (let i = startPos; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';
    const nextChar = i < content.length - 1 ? content[i + 1] : '';

    // Handle comments
    if (!inString && !inTemplate) {
      if (char === '/' && nextChar === '/' && !inMultiComment) {
        inComment = true;
        continue;
      }
      if (char === '\n' && inComment) {
        inComment = false;
        continue;
      }
      if (char === '/' && nextChar === '*' && !inComment) {
        inMultiComment = true;
        continue;
      }
      if (char === '*' && nextChar === '/' && inMultiComment) {
        inMultiComment = false;
        i++;
        continue;
      }
    }

    if (inComment || inMultiComment) continue;

    // Handle strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString && !inTemplate) {
        if (char === '`') {
          inTemplate = true;
        } else {
          inString = true;
          stringChar = char;
        }
      } else if (inTemplate && char === '`') {
        inTemplate = false;
      } else if (inString && char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (inString || inTemplate) continue;

    // Count braces
    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }

  return content.length;
}

/**
 * Extract functions (regular, arrow, async)
 */
function extractFunctions(content, lines, filePath, projectName, imports) {
  const chunks = [];

  // Pattern for function declarations
  const patterns = [
    // export async function name(
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g,
    // export const name = (async?) (...) =>
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/g,
    // export const name = async function
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?function/g,
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0;  // Reset regex
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1];
      const startPos = match.index;
      const jsDoc = extractJSDoc(content, startPos);
      const lineStart = getLineNumber(content, startPos);

      // Find the opening brace
      const afterMatch = content.substring(startPos);
      const braceMatch = afterMatch.match(/\{/);

      if (braceMatch) {
        const bracePos = startPos + braceMatch.index;
        const endPos = findMatchingBrace(content, bracePos);
        const lineEnd = getLineNumber(content, endPos);

        const chunkContent = content.substring(startPos, endPos + 1);

        // Determine chunk type
        let chunkType = 'function';
        if (name.startsWith('use') && name.length > 3) {
          chunkType = 'hook';
        } else if (chunkContent.includes('return') && (chunkContent.includes('<') || chunkContent.includes('jsx'))) {
          chunkType = 'component';
        } else if (filePath.includes('/services/')) {
          chunkType = 'service';
        }

        const isExported = match[0].startsWith('export');
        const isAsync = match[0].includes('async');

        // Extract used types from the content
        const usedTypes = extractUsedTypes(chunkContent);

        // Get signature (first line of the function)
        const signature = match[0];

        chunks.push({
          type: 'CodeChunk',
          name,
          content: jsDoc ? `${jsDoc}\n${chunkContent}` : chunkContent,
          filePath,
          project: projectName,
          chunkType,
          language: extname(filePath) === '.tsx' ? 'tsx' : 'typescript',
          lineStart,
          lineEnd,
          lineCount: lineEnd - lineStart + 1,
          jsDoc,
          signature,
          isExported,
          isAsync,
          usedTypes,
          dependencies: extractDependencies(chunkContent, imports),
          complexity: estimateComplexity(chunkContent),
        });
      }
    }
  }

  return chunks;
}

/**
 * Extract classes
 */
function extractClasses(content, lines, filePath, projectName, imports) {
  const chunks = [];

  const classPattern = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+[\w<>,\s]+)?(?:\s+implements\s+[\w<>,\s]+)?\s*\{/g;

  let match;
  while ((match = classPattern.exec(content)) !== null) {
    const name = match[1];
    const startPos = match.index;
    const jsDoc = extractJSDoc(content, startPos);
    const lineStart = getLineNumber(content, startPos);

    const bracePos = content.indexOf('{', startPos);
    const endPos = findMatchingBrace(content, bracePos);
    const lineEnd = getLineNumber(content, endPos);

    const chunkContent = content.substring(startPos, endPos + 1);
    const isExported = match[0].startsWith('export');

    chunks.push({
      type: 'CodeChunk',
      name,
      content: jsDoc ? `${jsDoc}\n${chunkContent}` : chunkContent,
      filePath,
      project: projectName,
      chunkType: 'class',
      language: extname(filePath) === '.tsx' ? 'tsx' : 'typescript',
      lineStart,
      lineEnd,
      lineCount: lineEnd - lineStart + 1,
      jsDoc,
      signature: match[0].trim(),
      isExported,
      isAsync: false,
      usedTypes: extractUsedTypes(chunkContent),
      dependencies: extractDependencies(chunkContent, imports),
      complexity: estimateComplexity(chunkContent),
    });
  }

  return chunks;
}

/**
 * Extract type definitions
 */
function extractTypes(content, lines, filePath, projectName) {
  const chunks = [];

  // Interfaces
  const interfacePattern = /(?:export\s+)?interface\s+(\w+)(?:<[^>]+>)?(?:\s+extends\s+[\w<>,\s]+)?\s*\{/g;

  let match;
  while ((match = interfacePattern.exec(content)) !== null) {
    const name = match[1];
    const startPos = match.index;
    const jsDoc = extractJSDoc(content, startPos);
    const lineStart = getLineNumber(content, startPos);

    const bracePos = content.indexOf('{', startPos);
    const endPos = findMatchingBrace(content, bracePos);
    const lineEnd = getLineNumber(content, endPos);

    const chunkContent = content.substring(startPos, endPos + 1);

    chunks.push({
      type: 'TypeDefinition',
      name,
      content: jsDoc ? `${jsDoc}\n${chunkContent}` : chunkContent,
      filePath,
      project: projectName,
      typeKind: 'interface',
      properties: extractProperties(chunkContent),
      extendsTypes: extractExtends(match[0]),
      jsDoc,
      isExported: match[0].startsWith('export'),
      fromDatabase: filePath.includes('database.types') || filePath.includes('supabase'),
    });
  }

  // Type aliases
  const typePattern = /(?:export\s+)?type\s+(\w+)(?:<[^>]+>)?\s*=/g;

  while ((match = typePattern.exec(content)) !== null) {
    const name = match[1];
    const startPos = match.index;
    const jsDoc = extractJSDoc(content, startPos);
    const lineStart = getLineNumber(content, startPos);

    // Find the end of the type (semicolon or next export/type)
    let endPos = content.indexOf(';', startPos);
    if (endPos === -1) endPos = content.length;

    // Handle multi-line types with braces
    const afterMatch = content.substring(startPos);
    if (afterMatch.includes('{')) {
      const bracePos = content.indexOf('{', startPos);
      if (bracePos < endPos) {
        endPos = findMatchingBrace(content, bracePos) + 1;
      }
    }

    const lineEnd = getLineNumber(content, endPos);
    const chunkContent = content.substring(startPos, endPos + 1);

    chunks.push({
      type: 'TypeDefinition',
      name,
      content: jsDoc ? `${jsDoc}\n${chunkContent}` : chunkContent,
      filePath,
      project: projectName,
      typeKind: 'type',
      properties: extractProperties(chunkContent),
      extendsTypes: [],
      jsDoc,
      isExported: match[0].startsWith('export'),
      fromDatabase: filePath.includes('database.types') || filePath.includes('supabase'),
    });
  }

  return chunks;
}

/**
 * Extract property names from type/interface
 */
function extractProperties(content) {
  const props = [];
  const propPattern = /(\w+)\s*[?:]?\s*:/g;
  let match;
  while ((match = propPattern.exec(content)) !== null) {
    if (!['return', 'const', 'let', 'var', 'function'].includes(match[1])) {
      props.push(match[1]);
    }
  }
  return [...new Set(props)];
}

/**
 * Extract extends types
 */
function extractExtends(declaration) {
  const extendsMatch = declaration.match(/extends\s+([\w<>,\s]+)/);
  if (extendsMatch) {
    return extendsMatch[1].split(',').map((t) => t.trim());
  }
  return [];
}

/**
 * Extract used types from code content
 */
function extractUsedTypes(content) {
  const types = new Set();

  // Type annotations
  const typePatterns = [
    /:\s*(\w+)(?:<|>|\[|\]|\s|,|;|\))/g,
    /<(\w+)(?:<|>|,|\s)/g,
    /as\s+(\w+)/g,
  ];

  for (const pattern of typePatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      const type = match[1];
      // Filter out primitives and common keywords
      const primitives = ['string', 'number', 'boolean', 'void', 'null', 'undefined', 'any', 'unknown', 'never', 'object', 'Promise', 'Array', 'Record', 'Partial', 'Required', 'Pick', 'Omit'];
      if (!primitives.includes(type)) {
        types.add(type);
      }
    }
  }

  return [...types];
}

/**
 * Extract file dependencies from imports used in content
 */
function extractDependencies(content, imports) {
  const deps = [];

  for (const imp of imports) {
    // Check if any imported symbol is used in the content
    const symbolMatch = imp.statement.match(/\{([^}]+)\}/);
    if (symbolMatch) {
      const symbols = symbolMatch[1].split(',').map((s) => s.trim().split(' as ')[0]);
      for (const symbol of symbols) {
        if (content.includes(symbol)) {
          deps.push(imp.source);
          break;
        }
      }
    }
  }

  return [...new Set(deps)];
}

/**
 * Estimate cyclomatic complexity
 */
function estimateComplexity(content) {
  let complexity = 1;

  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bswitch\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\?\?/g,
    /\?\./g,
    /\?\s*:/g,
    /&&/g,
    /\|\|/g,
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

export default { parseFile };
