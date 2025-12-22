#!/usr/bin/env python3
"""
Weaviate RAG Client for Python

Replaces ChromaDB with Weaviate's hybrid search.
GPU-accelerated embeddings + BM25 + Reranker.

Usage:
    from python_client import WeaviateRAG

    rag = WeaviateRAG()
    results = rag.search("RSI oversold signal", limit=5)
"""

import requests
from typing import List, Dict, Optional

WEAVIATE_URL = "http://localhost:8080"

class WeaviateRAG:
    """
    Simple Weaviate RAG client using REST API.
    No external dependencies needed.
    """

    def __init__(self, url: str = WEAVIATE_URL):
        self.url = url
        self.graphql_url = f"{url}/v1/graphql"

    def is_ready(self) -> bool:
        """Check if Weaviate is running"""
        try:
            r = requests.get(f"{self.url}/v1/.well-known/ready", timeout=2)
            return r.status_code == 200
        except:
            return False

    def search(self, query: str, limit: int = 5, project: Optional[str] = None,
               alpha: float = 0.7) -> List[Dict]:
        """
        Hybrid search (vector + keyword).

        Args:
            query: Natural language search query
            limit: Max results to return
            project: Filter by project name (optional)
            alpha: Balance between vector (1.0) and keyword (0.0). Default 0.7.

        Returns:
            List of matching code chunks with metadata
        """
        # Build where filter
        where_filter = ""
        if project:
            where_filter = f'''
            where: {{
                path: ["project"],
                operator: Equal,
                valueText: "{project}"
            }}
            '''

        # Escape query for GraphQL
        safe_query = query.replace('"', "'")

        graphql_query = f'''
        {{
            Get {{
                CodeChunk(
                    hybrid: {{
                        query: "{safe_query}"
                        alpha: {alpha}
                    }}
                    limit: {limit}
                    {where_filter}
                ) {{
                    content
                    filePath
                    project
                    name
                    chunkType
                    language
                    lineStart
                    lineEnd
                    _additional {{
                        score
                    }}
                }}
            }}
        }}
        '''

        try:
            response = requests.post(
                self.graphql_url,
                json={"query": graphql_query},
                timeout=10
            )
            data = response.json()

            if "errors" in data:
                print(f"GraphQL error: {data['errors']}")
                return []

            chunks = data.get("data", {}).get("Get", {}).get("CodeChunk", [])

            return [{
                "content": c.get("content", ""),
                "file": c.get("filePath", ""),
                "project": c.get("project", ""),
                "type": c.get("chunkType", ""),
                "name": c.get("name", ""),
                "language": c.get("language", ""),
                "lines": f"{c.get('lineStart', 0)}-{c.get('lineEnd', 0)}",
                "score": c.get("_additional", {}).get("score", 0)
            } for c in chunks]

        except Exception as e:
            print(f"Search error: {e}")
            return []

    def search_similar(self, code_snippet: str, limit: int = 5,
                       project: Optional[str] = None) -> List[Dict]:
        """
        Find similar code using vector search only.

        Args:
            code_snippet: Code to find similar code for
            limit: Max results
            project: Filter by project

        Returns:
            List of similar code chunks
        """
        where_filter = ""
        if project:
            where_filter = f'''
            where: {{
                path: ["project"],
                operator: Equal,
                valueText: "{project}"
            }}
            '''

        # Escape the code snippet for GraphQL
        escaped = code_snippet.replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ')

        graphql_query = f'''
        {{
            Get {{
                CodeChunk(
                    nearText: {{
                        concepts: ["{escaped[:500]}"]
                    }}
                    limit: {limit}
                    {where_filter}
                ) {{
                    content
                    filePath
                    project
                    chunkType
                    name
                    _additional {{
                        distance
                    }}
                }}
            }}
        }}
        '''

        try:
            response = requests.post(
                self.graphql_url,
                json={"query": graphql_query},
                timeout=10
            )
            data = response.json()

            if "errors" in data:
                print(f"GraphQL error: {data['errors']}")
                return []

            chunks = data.get("data", {}).get("Get", {}).get("CodeChunk", [])

            return [{
                "content": c.get("content", ""),
                "file": c.get("filePath", ""),
                "project": c.get("project", ""),
                "type": c.get("chunkType", ""),
                "name": c.get("name", ""),
                "similarity": 1 - c.get("_additional", {}).get("distance", 1)
            } for c in chunks]

        except Exception as e:
            print(f"Similar search error: {e}")
            return []

    def list_projects(self) -> List[Dict]:
        """List all indexed projects with chunk counts"""
        graphql_query = '''
        {
            Aggregate {
                CodeChunk(groupBy: ["project"]) {
                    groupedBy {
                        value
                    }
                    meta {
                        count
                    }
                }
            }
        }
        '''

        try:
            response = requests.post(
                self.graphql_url,
                json={"query": graphql_query},
                timeout=10
            )
            data = response.json()

            groups = data.get("data", {}).get("Aggregate", {}).get("CodeChunk", [])

            return [{
                "project": g.get("groupedBy", {}).get("value", ""),
                "chunks": g.get("meta", {}).get("count", 0)
            } for g in groups]

        except Exception as e:
            print(f"List projects error: {e}")
            return []

    def get_context(self, query: str, limit: int = 3) -> str:
        """
        Get formatted context for LLM prompts.

        Args:
            query: Search query
            limit: Number of results

        Returns:
            Formatted string with code context
        """
        results = self.search(query, limit=limit)

        if not results:
            return ""

        context = "## Relevant Code from Codebase:\n\n"
        for i, r in enumerate(results, 1):
            context += f"### [{i}] {r['project']} - {r['file']}:{r['lines']}\n"
            context += f"Type: {r['type']} | Name: {r['name']}\n"
            context += f"```\n{r['content'][:1500]}\n```\n\n"

        return context


# Convenience function for quick searches
def search(query: str, limit: int = 5, project: str = None) -> List[Dict]:
    """Quick search function"""
    return WeaviateRAG().search(query, limit=limit, project=project)


if __name__ == "__main__":
    import sys

    rag = WeaviateRAG()

    if not rag.is_ready():
        print("ERROR: Weaviate is not running!")
        print("Start it with: cd /root/weaviate-rag && docker compose up -d")
        sys.exit(1)

    # Show projects
    print("=== Indexed Projects ===")
    projects = rag.list_projects()
    for p in projects:
        print(f"  {p['project']}: {p['chunks']} chunks")

    # Test search
    query = sys.argv[1] if len(sys.argv) > 1 else "authentication"
    print(f"\n=== Search: '{query}' ===")

    results = rag.search(query, limit=3)
    for i, r in enumerate(results, 1):
        print(f"\n[{i}] {r['project']} - {r['file']}:{r['lines']}")
        score = float(r['score']) if r['score'] else 0
        print(f"    Type: {r['type']} | Name: {r['name']} | Score: {score:.3f}")
        print(f"    {r['content'][:200]}...")
