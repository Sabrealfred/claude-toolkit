#!/usr/bin/env python3
"""
Trading RAG Client - Extensión del Weaviate RAG

Usa la misma infraestructura que CodeChunk pero para datos de trading:
- Patrones técnicos
- Trade journal
- Noticias
- Conocimiento de trading

Usage:
    from trading_client import TradingRAG

    rag = TradingRAG()
    rag.index_pattern("RSI Oversold", "BTC", {...})
    result = rag.validate_signal(signal)
"""

import json
import requests
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime

WEAVIATE_URL = "http://localhost:8080"


@dataclass
class TradeSignal:
    """Señal de trading a validar"""
    asset: str
    direction: str  # LONG, SHORT
    price: float
    indicators: Dict
    confidence: float
    timestamp: str = None

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


class TradingRAG:
    """
    Trading RAG usando Weaviate con GPU.

    Colecciones:
    - TradingPattern: Patrones técnicos
    - TradeJournal: Historial de trades
    - MarketNews: Noticias del mercado
    - TradingKnowledge: Conocimiento (libros, reglas)
    """

    def __init__(self, url: str = WEAVIATE_URL):
        self.url = url
        self.graphql_url = f"{url}/v1/graphql"
        self.objects_url = f"{url}/v1/objects"
        self.schema_url = f"{url}/v1/schema"

        # Verificar conexión
        if not self.is_ready():
            raise ConnectionError("Weaviate no disponible. Verificar Docker.")

        # Crear colecciones si no existen
        self._ensure_schema()

    def is_ready(self) -> bool:
        """Verifica si Weaviate está corriendo"""
        try:
            r = requests.get(f"{self.url}/v1/.well-known/ready", timeout=2)
            return r.status_code == 200
        except:
            return False

    def _ensure_schema(self):
        """Crea colecciones si no existen"""
        collections = [
            {
                "class": "TradingPattern",
                "description": "Patrones técnicos de trading",
                "vectorizer": "text2vec-transformers",
                "properties": [
                    {"name": "patternName", "dataType": ["text"]},
                    {"name": "asset", "dataType": ["text"]},
                    {"name": "date", "dataType": ["text"]},
                    {"name": "content", "dataType": ["text"]},
                    {"name": "result", "dataType": ["text"]},
                    {"name": "setupJson", "dataType": ["text"]},
                    {"name": "outcomeJson", "dataType": ["text"]},
                ]
            },
            {
                "class": "TradeJournal",
                "description": "Historial de trades",
                "vectorizer": "text2vec-transformers",
                "properties": [
                    {"name": "asset", "dataType": ["text"]},
                    {"name": "direction", "dataType": ["text"]},
                    {"name": "date", "dataType": ["text"]},
                    {"name": "content", "dataType": ["text"]},
                    {"name": "resultType", "dataType": ["text"]},
                    {"name": "resultPips", "dataType": ["number"]},
                    {"name": "signalsJson", "dataType": ["text"]},
                    {"name": "lesson", "dataType": ["text"]},
                ]
            },
            {
                "class": "MarketNews",
                "description": "Noticias del mercado",
                "vectorizer": "text2vec-transformers",
                "properties": [
                    {"name": "headline", "dataType": ["text"]},
                    {"name": "content", "dataType": ["text"]},
                    {"name": "date", "dataType": ["text"]},
                    {"name": "sentiment", "dataType": ["text"]},
                    {"name": "assetsJson", "dataType": ["text"]},
                ]
            },
            {
                "class": "TradingKnowledge",
                "description": "Conocimiento de trading",
                "vectorizer": "text2vec-transformers",
                "properties": [
                    {"name": "title", "dataType": ["text"]},
                    {"name": "content", "dataType": ["text"]},
                    {"name": "category", "dataType": ["text"]},
                    {"name": "source", "dataType": ["text"]},
                ]
            },
        ]

        # Verificar existentes
        try:
            r = requests.get(self.schema_url, timeout=5)
            existing = {c["class"] for c in r.json().get("classes", [])}
        except:
            existing = set()

        # Crear las que faltan
        for coll in collections:
            if coll["class"] not in existing:
                try:
                    r = requests.post(self.schema_url, json=coll, timeout=10)
                    if r.status_code in [200, 201]:
                        print(f"✓ Creado: {coll['class']}")
                except Exception as e:
                    print(f"⚠️ Error creando {coll['class']}: {e}")

    # =========================================
    # INDEXAR
    # =========================================
    def index_pattern(self, pattern_name: str, asset: str, date: str,
                      setup: Dict, outcome: Dict, context: Dict) -> bool:
        """Indexa un patrón técnico"""
        content = f"""
        Patrón: {pattern_name} en {asset}
        Setup: {json.dumps(setup)}
        Resultado: {outcome.get('result')}, {outcome.get('move')}
        Contexto: {json.dumps(context)}
        """

        obj = {
            "class": "TradingPattern",
            "properties": {
                "patternName": pattern_name,
                "asset": asset,
                "date": date,
                "content": content,
                "result": outcome.get("result", ""),
                "setupJson": json.dumps(setup),
                "outcomeJson": json.dumps(outcome),
            }
        }

        try:
            r = requests.post(self.objects_url, json=obj, timeout=10)
            if r.status_code in [200, 201]:
                print(f"✓ Pattern: {pattern_name}")
                return True
        except Exception as e:
            print(f"⚠️ Error: {e}")
        return False

    def index_trade(self, asset: str, direction: str, entry: float, exit: float,
                    date: str, signals: List[str], result_pips: float,
                    notes: str, lesson: str) -> bool:
        """Indexa un trade"""
        result_type = "winner" if result_pips > 0 else "loser"

        content = f"""
        Trade {direction} {asset}
        Entry: {entry}, Exit: {exit}, Result: {result_pips} pips ({result_type})
        Señales: {', '.join(signals)}
        Notas: {notes}
        Lección: {lesson}
        """

        obj = {
            "class": "TradeJournal",
            "properties": {
                "asset": asset,
                "direction": direction,
                "date": date,
                "content": content,
                "resultType": result_type,
                "resultPips": result_pips,
                "signalsJson": json.dumps(signals),
                "lesson": lesson,
            }
        }

        try:
            r = requests.post(self.objects_url, json=obj, timeout=10)
            if r.status_code in [200, 201]:
                print(f"✓ Trade: {direction} {asset} ({result_pips} pips)")
                return True
        except Exception as e:
            print(f"⚠️ Error: {e}")
        return False

    def index_news(self, headline: str, content: str, date: str,
                   assets: List[str], sentiment: str) -> bool:
        """Indexa una noticia"""
        full_content = f"{headline}\n{content}\nAfecta: {', '.join(assets)}"

        obj = {
            "class": "MarketNews",
            "properties": {
                "headline": headline,
                "content": full_content,
                "date": date,
                "sentiment": sentiment,
                "assetsJson": json.dumps(assets),
            }
        }

        try:
            r = requests.post(self.objects_url, json=obj, timeout=10)
            if r.status_code in [200, 201]:
                print(f"✓ News: {headline[:40]}...")
                return True
        except Exception as e:
            print(f"⚠️ Error: {e}")
        return False

    def index_knowledge(self, title: str, content: str, category: str,
                        source: str = "manual") -> bool:
        """Indexa conocimiento"""
        obj = {
            "class": "TradingKnowledge",
            "properties": {
                "title": title,
                "content": content,
                "category": category,
                "source": source,
            }
        }

        try:
            r = requests.post(self.objects_url, json=obj, timeout=10)
            if r.status_code in [200, 201]:
                print(f"✓ Knowledge: {title}")
                return True
        except Exception as e:
            print(f"⚠️ Error: {e}")
        return False

    # =========================================
    # BÚSQUEDA
    # =========================================
    def search(self, query: str, collection: str = None, limit: int = 5,
               asset: str = None, alpha: float = 0.7) -> List[Dict]:
        """
        Búsqueda híbrida (70% vector + 30% BM25)

        Args:
            query: Texto a buscar
            collection: TradingPattern, TradeJournal, MarketNews, TradingKnowledge
            limit: Máximo resultados
            asset: Filtrar por asset
            alpha: Balance vector(1) vs keyword(0)
        """
        collections = [collection] if collection else [
            "TradingPattern", "TradeJournal", "MarketNews", "TradingKnowledge"
        ]

        results = []
        safe_query = query.replace('"', "'")

        for coll in collections:
            where_clause = ""
            if asset and coll in ["TradingPattern", "TradeJournal"]:
                where_clause = f'where: {{ path: ["asset"], operator: Equal, valueText: "{asset}" }}'

            # Definir campos por colección
            if coll == "TradingPattern":
                fields = "patternName asset date content result"
            elif coll == "TradeJournal":
                fields = "asset direction date content resultType resultPips lesson"
            elif coll == "MarketNews":
                fields = "headline content sentiment"
            elif coll == "TradingKnowledge":
                fields = "title content category"
            else:
                fields = "content"

            gql = f'''
            {{
                Get {{
                    {coll}(
                        hybrid: {{ query: "{safe_query}", alpha: {alpha} }}
                        limit: {limit}
                        {where_clause}
                    ) {{
                        {fields}
                        _additional {{ score }}
                    }}
                }}
            }}
            '''

            try:
                r = requests.post(self.graphql_url, json={"query": gql}, timeout=10)
                data = r.json()

                if "errors" in data:
                    continue

                items = data.get("data", {}).get("Get", {}).get(coll, [])
                for item in items:
                    results.append({
                        "collection": coll,
                        "score": item.get("_additional", {}).get("score", 0),
                        **{k: v for k, v in item.items() if k != "_additional"}
                    })
            except:
                pass

        results.sort(key=lambda x: float(x.get("score", 0) or 0), reverse=True)
        return results[:limit]

    # =========================================
    # VALIDACIÓN
    # =========================================
    def validate_signal(self, signal: TradeSignal) -> Dict:
        """Valida señal con contexto histórico"""

        # Buscar patrones
        pattern_query = f"{signal.asset} {' '.join(signal.indicators.keys())}"
        patterns = self.search(pattern_query, "TradingPattern", 5, signal.asset)

        # Buscar trades similares
        trade_query = f"{signal.direction} {signal.asset}"
        trades = self.search(trade_query, "TradeJournal", 10, signal.asset)

        # Buscar noticias
        news = self.search(f"{signal.asset} market", "MarketNews", 3)

        # Buscar conocimiento
        knowledge = self.search(' '.join(signal.indicators.keys()), "TradingKnowledge", 3)

        # Calcular win rate
        similar_trades = [t for t in trades if t.get("direction") == signal.direction]
        if similar_trades:
            wins = sum(1 for t in similar_trades if t.get("resultType") == "winner")
            win_rate = wins / len(similar_trades)
        else:
            win_rate = 0.5

        # Recomendación
        if win_rate >= 0.7 and len(similar_trades) >= 3:
            recommendation = "STRONG_GO"
        elif win_rate >= 0.55:
            recommendation = "GO"
        elif win_rate >= 0.45:
            recommendation = "CAUTION"
        else:
            recommendation = "SKIP"

        # Lecciones
        lessons = [t.get("lesson", "") for t in similar_trades if t.get("lesson")]

        # Sentimiento
        sentiments = [n.get("sentiment", "neutral") for n in news]
        bullish = sentiments.count("bullish")
        bearish = sentiments.count("bearish")
        news_sentiment = "bullish" if bullish > bearish else "bearish" if bearish > bullish else "neutral"

        return {
            "recommendation": recommendation,
            "win_rate": win_rate,
            "similar_trades": len(similar_trades),
            "patterns_found": len(patterns),
            "knowledge_found": len(knowledge),
            "news_sentiment": news_sentiment,
            "confidence": signal.confidence * (0.8 + 0.4 * win_rate),
            "lessons": lessons[:3],
        }

    def get_stats(self) -> Dict:
        """Estadísticas de las colecciones"""
        stats = {}
        for coll in ["TradingPattern", "TradeJournal", "MarketNews", "TradingKnowledge"]:
            gql = f'''
            {{ Aggregate {{ {coll} {{ meta {{ count }} }} }} }}
            '''
            try:
                r = requests.post(self.graphql_url, json={"query": gql}, timeout=5)
                data = r.json()
                count = data.get("data", {}).get("Aggregate", {}).get(coll, [{}])[0].get("meta", {}).get("count", 0)
                stats[coll] = count
            except:
                stats[coll] = 0

        stats["total"] = sum(stats.values())
        return stats


# ============================================
# DEMO
# ============================================
if __name__ == "__main__":
    print("=" * 60)
    print("🎯 TRADING RAG - Weaviate Docker + GPU")
    print("=" * 60)

    rag = TradingRAG()

    print("\n📊 Stats actuales:", rag.get_stats())

    # Indexar datos de ejemplo
    print("\n📚 Indexando datos...")

    rag.index_pattern(
        "RSI Oversold Bounce", "BTC", "2024-12-01",
        {"rsi": 25, "volume": "high"},
        {"result": "success", "move": "+8%"},
        {"trend": "uptrend"}
    )

    rag.index_trade(
        "BTC", "LONG", 43500, 45200, "2024-12-01",
        ["RSI_oversold", "EMA_bounce"], 170,
        "Rebote en EMA21", "RSI < 30 con volumen = alta probabilidad"
    )

    rag.index_trade(
        "BTC", "LONG", 46000, 48500, "2024-12-05",
        ["RSI_oversold", "volume_spike", "support"], 250,
        "Triple confirmación", "3+ señales = mejor win rate"
    )

    rag.index_knowledge(
        "RSI Indicator",
        "RSI mide momentum. <30 oversold, >70 overbought. Divergencias son fuertes.",
        "indicator", "Technical Analysis"
    )

    print("\n📊 Stats después:", rag.get_stats())

    # Búsqueda
    print("\n" + "=" * 60)
    print("🔍 BÚSQUEDA")
    print("=" * 60)

    results = rag.search("RSI oversold signal", limit=3)
    for r in results:
        print(f"  [{r['collection']}] score={r['score']}")

    # Validar señal
    print("\n" + "=" * 60)
    print("🎯 VALIDACIÓN")
    print("=" * 60)

    signal = TradeSignal(
        asset="BTC", direction="LONG", price=98500,
        indicators={"rsi": 32, "macd": "bullish"},
        confidence=0.75
    )

    result = rag.validate_signal(signal)
    print(f"  Recomendación: {result['recommendation']}")
    print(f"  Win Rate: {result['win_rate']*100:.0f}%")
    print(f"  Trades similares: {result['similar_trades']}")

    print("\n✅ Trading RAG funcionando con Weaviate + GPU")
