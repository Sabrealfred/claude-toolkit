/**
 * Weaviate Schema for Code Intelligence RAG
 *
 * Three main classes:
 * - CodeChunk: Functions, classes, components, hooks
 * - DocChunk: Documentation, comments, README
 * - TypeDefinition: Interfaces, types, schemas
 */

export const SCHEMA = {
  classes: [
    // ============================================
    // CODE CHUNKS - Functions, Classes, Components
    // ============================================
    {
      class: 'CodeChunk',
      description: 'A logical unit of code: function, class, component, or hook',
      vectorizer: 'text2vec-transformers',
      moduleConfig: {
        'text2vec-transformers': {
          vectorizeClassName: false,
          poolingStrategy: 'masked_mean',
        },
        'reranker-transformers': {
          model: 'cross-encoder-ms-marco-MiniLM-L-6-v2',
        },
      },
      properties: [
        {
          name: 'content',
          dataType: ['text'],
          description: 'The actual code content',
          moduleConfig: {
            'text2vec-transformers': {
              skip: false,
              vectorizePropertyName: false,
            },
          },
        },
        {
          name: 'name',
          dataType: ['text'],
          description: 'Name of the function/class/component',
          moduleConfig: {
            'text2vec-transformers': {
              skip: false,
              vectorizePropertyName: false,
            },
          },
        },
        {
          name: 'filePath',
          dataType: ['text'],
          description: 'Relative path from project root',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'project',
          dataType: ['text'],
          description: 'Project name (e.g., matwal-premium)',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'chunkType',
          dataType: ['text'],
          description: 'Type: function, class, component, hook, service, migration',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'language',
          dataType: ['text'],
          description: 'Programming language',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'exports',
          dataType: ['text[]'],
          description: 'Exported symbols from this chunk',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'imports',
          dataType: ['text[]'],
          description: 'Import statements',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'dependencies',
          dataType: ['text[]'],
          description: 'Files this chunk depends on',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'usedTypes',
          dataType: ['text[]'],
          description: 'TypeScript types used in this chunk',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'lineStart',
          dataType: ['int'],
          description: 'Starting line number',
        },
        {
          name: 'lineEnd',
          dataType: ['int'],
          description: 'Ending line number',
        },
        {
          name: 'lineCount',
          dataType: ['int'],
          description: 'Total lines in chunk',
        },
        {
          name: 'jsDoc',
          dataType: ['text'],
          description: 'JSDoc or preceding comment',
          moduleConfig: {
            'text2vec-transformers': {
              skip: false,
              vectorizePropertyName: false,
            },
          },
        },
        {
          name: 'signature',
          dataType: ['text'],
          description: 'Function/method signature',
          moduleConfig: {
            'text2vec-transformers': {
              skip: false,
              vectorizePropertyName: false,
            },
          },
        },
        {
          name: 'lastModified',
          dataType: ['date'],
          description: 'Last modification date',
        },
        {
          name: 'gitCommit',
          dataType: ['text'],
          description: 'Last commit hash that modified this file',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'isExported',
          dataType: ['boolean'],
          description: 'Whether this symbol is exported',
        },
        {
          name: 'isAsync',
          dataType: ['boolean'],
          description: 'Whether this is an async function',
        },
        {
          name: 'complexity',
          dataType: ['int'],
          description: 'Cyclomatic complexity estimate',
        },
      ],
    },

    // ============================================
    // DOC CHUNKS - Documentation, Comments, README
    // ============================================
    {
      class: 'DocChunk',
      description: 'Documentation: README, MDX, comments, guides',
      vectorizer: 'text2vec-transformers',
      moduleConfig: {
        'text2vec-transformers': {
          vectorizeClassName: false,
        },
        'reranker-transformers': {},
      },
      properties: [
        {
          name: 'content',
          dataType: ['text'],
          description: 'Documentation content',
        },
        {
          name: 'title',
          dataType: ['text'],
          description: 'Section title or heading',
        },
        {
          name: 'filePath',
          dataType: ['text'],
          description: 'Path to the documentation file',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'project',
          dataType: ['text'],
          description: 'Project name',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'docType',
          dataType: ['text'],
          description: 'Type: readme, mdx, jsdoc, guide, api',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'section',
          dataType: ['text'],
          description: 'Parent section/category',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'codeExamples',
          dataType: ['text[]'],
          description: 'Code examples in this doc chunk',
        },
        {
          name: 'relatedFiles',
          dataType: ['text[]'],
          description: 'Related code files',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'headingLevel',
          dataType: ['int'],
          description: 'Heading level (1-6)',
        },
      ],
    },

    // ============================================
    // TYPE DEFINITIONS - Interfaces, Types, Schemas
    // ============================================
    {
      class: 'TypeDefinition',
      description: 'TypeScript interfaces, types, and schemas',
      vectorizer: 'text2vec-transformers',
      moduleConfig: {
        'text2vec-transformers': {
          vectorizeClassName: false,
        },
        'reranker-transformers': {},
      },
      properties: [
        {
          name: 'content',
          dataType: ['text'],
          description: 'Full type definition',
        },
        {
          name: 'name',
          dataType: ['text'],
          description: 'Type/interface name',
        },
        {
          name: 'filePath',
          dataType: ['text'],
          description: 'Path to type file',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'project',
          dataType: ['text'],
          description: 'Project name',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'typeKind',
          dataType: ['text'],
          description: 'Kind: interface, type, enum, const',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'properties',
          dataType: ['text[]'],
          description: 'Property names in this type',
        },
        {
          name: 'extendsTypes',
          dataType: ['text[]'],
          description: 'Types this extends',
        },
        {
          name: 'usedIn',
          dataType: ['text[]'],
          description: 'Files that use this type',
          moduleConfig: {
            'text2vec-transformers': { skip: true },
          },
        },
        {
          name: 'jsDoc',
          dataType: ['text'],
          description: 'JSDoc comment for the type',
        },
        {
          name: 'isExported',
          dataType: ['boolean'],
          description: 'Whether this type is exported',
        },
        {
          name: 'fromDatabase',
          dataType: ['boolean'],
          description: 'Whether this is a database-generated type',
        },
      ],
    },

    // ============================================
    // FILE METADATA - For context loading
    // ============================================
    {
      class: 'FileMetadata',
      description: 'Metadata about files for context loading',
      vectorizer: 'none',  // No vector, just metadata
      properties: [
        {
          name: 'filePath',
          dataType: ['text'],
          description: 'Relative path',
        },
        {
          name: 'project',
          dataType: ['text'],
          description: 'Project name',
        },
        {
          name: 'fileType',
          dataType: ['text'],
          description: 'Type: component, service, hook, page, type, migration',
        },
        {
          name: 'imports',
          dataType: ['text[]'],
          description: 'All imports in file',
        },
        {
          name: 'exports',
          dataType: ['text[]'],
          description: 'All exports from file',
        },
        {
          name: 'importedBy',
          dataType: ['text[]'],
          description: 'Files that import this file',
        },
        {
          name: 'lineCount',
          dataType: ['int'],
          description: 'Total lines',
        },
        {
          name: 'lastModified',
          dataType: ['date'],
          description: 'Last modification date',
        },
        {
          name: 'gitCommit',
          dataType: ['text'],
          description: 'Last commit hash',
        },
        {
          name: 'gitBranch',
          dataType: ['text'],
          description: 'Current branch',
        },
        {
          name: 'chunkCount',
          dataType: ['int'],
          description: 'Number of chunks from this file',
        },
      ],
    },
  ],
};

export default SCHEMA;
