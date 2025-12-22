#!/usr/bin/env python3
"""
Finance Data MCP Server

Free financial data from:
- Yahoo Finance (yfinance)
- SEC EDGAR
- FRED (Federal Reserve Economic Data)

No API keys required!
"""

import json
import sys
from datetime import datetime, timedelta
from typing import Any

import yfinance as yf
import pandas as pd

# MCP Protocol
def send_response(response: dict):
    """Send JSON-RPC response"""
    print(json.dumps(response), flush=True)

def read_request() -> dict:
    """Read JSON-RPC request"""
    line = sys.stdin.readline()
    if not line:
        return None
    return json.loads(line)

# Tool implementations
def get_stock_info(ticker: str) -> dict:
    """Get comprehensive stock information"""
    stock = yf.Ticker(ticker)
    info = stock.info

    return {
        "ticker": ticker,
        "name": info.get("longName", "N/A"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "market_cap": info.get("marketCap", 0),
        "enterprise_value": info.get("enterpriseValue", 0),
        "price": info.get("currentPrice", info.get("regularMarketPrice", 0)),
        "52w_high": info.get("fiftyTwoWeekHigh", 0),
        "52w_low": info.get("fiftyTwoWeekLow", 0),
        "pe_ratio": info.get("trailingPE", 0),
        "forward_pe": info.get("forwardPE", 0),
        "peg_ratio": info.get("pegRatio", 0),
        "price_to_book": info.get("priceToBook", 0),
        "ev_to_ebitda": info.get("enterpriseToEbitda", 0),
        "ev_to_revenue": info.get("enterpriseToRevenue", 0),
        "profit_margin": info.get("profitMargins", 0),
        "operating_margin": info.get("operatingMargins", 0),
        "gross_margin": info.get("grossMargins", 0),
        "revenue": info.get("totalRevenue", 0),
        "revenue_growth": info.get("revenueGrowth", 0),
        "ebitda": info.get("ebitda", 0),
        "net_income": info.get("netIncomeToCommon", 0),
        "eps": info.get("trailingEps", 0),
        "forward_eps": info.get("forwardEps", 0),
        "dividend_yield": info.get("dividendYield", 0),
        "beta": info.get("beta", 0),
        "shares_outstanding": info.get("sharesOutstanding", 0),
        "float_shares": info.get("floatShares", 0),
        "held_by_institutions": info.get("heldPercentInstitutions", 0),
    }

def get_financials(ticker: str, statement: str = "income") -> dict:
    """Get financial statements"""
    stock = yf.Ticker(ticker)

    if statement == "income":
        df = stock.income_stmt
    elif statement == "balance":
        df = stock.balance_sheet
    elif statement == "cash":
        df = stock.cashflow
    else:
        return {"error": f"Unknown statement type: {statement}"}

    if df.empty:
        return {"error": "No data available"}

    # Convert to dict with string dates
    result = {}
    for col in df.columns:
        date_str = col.strftime("%Y-%m-%d") if hasattr(col, 'strftime') else str(col)
        result[date_str] = {}
        for idx in df.index:
            value = df.loc[idx, col]
            result[date_str][str(idx)] = float(value) if pd.notna(value) else None

    return {
        "ticker": ticker,
        "statement": statement,
        "data": result
    }

def get_historical_prices(ticker: str, period: str = "1y") -> dict:
    """Get historical price data"""
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period)

    if hist.empty:
        return {"error": "No data available"}

    prices = []
    for date, row in hist.iterrows():
        prices.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"])
        })

    return {
        "ticker": ticker,
        "period": period,
        "prices": prices
    }

def get_peer_comparison(ticker: str) -> dict:
    """Get peer comparison data"""
    stock = yf.Ticker(ticker)
    info = stock.info

    # Get recommended peers
    peers = info.get("recommendedSymbols", [])
    if not peers:
        # Fallback: use sector
        return {"error": "No peer data available", "suggestion": "Use --peers option"}

    peer_data = []
    for peer in peers[:10]:  # Max 10 peers
        try:
            p = yf.Ticker(peer)
            pi = p.info
            peer_data.append({
                "ticker": peer,
                "name": pi.get("shortName", "N/A"),
                "market_cap": pi.get("marketCap", 0),
                "pe_ratio": pi.get("trailingPE", 0),
                "ev_ebitda": pi.get("enterpriseToEbitda", 0),
                "profit_margin": pi.get("profitMargins", 0),
                "revenue_growth": pi.get("revenueGrowth", 0)
            })
        except:
            continue

    return {
        "target": ticker,
        "peers": peer_data
    }

def get_earnings_history(ticker: str) -> dict:
    """Get earnings history and estimates"""
    stock = yf.Ticker(ticker)

    # Historical earnings
    earnings = stock.earnings_history
    estimates = stock.earnings_dates

    history = []
    if earnings is not None and not earnings.empty:
        for _, row in earnings.iterrows():
            history.append({
                "date": str(row.name) if hasattr(row, 'name') else "N/A",
                "eps_actual": row.get("epsActual", None),
                "eps_estimate": row.get("epsEstimate", None),
                "surprise": row.get("epsDifference", None),
                "surprise_pct": row.get("surprisePercent", None)
            })

    return {
        "ticker": ticker,
        "earnings_history": history
    }

def search_stocks(query: str) -> dict:
    """Search for stocks by name or ticker"""
    # yfinance doesn't have search, use basic lookup
    try:
        stock = yf.Ticker(query)
        info = stock.info
        if info.get("symbol"):
            return {
                "results": [{
                    "ticker": info.get("symbol"),
                    "name": info.get("longName", "N/A"),
                    "exchange": info.get("exchange", "N/A"),
                    "type": info.get("quoteType", "N/A")
                }]
            }
    except:
        pass

    return {"results": [], "note": "Direct ticker lookup only. Try exact symbol."}

# MCP Server
TOOLS = [
    {
        "name": "finance_stock_info",
        "description": "Get comprehensive stock information including price, valuation multiples, margins, and key metrics",
        "inputSchema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "Stock ticker symbol (e.g., AAPL, MSFT)"}
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "finance_financials",
        "description": "Get financial statements (income statement, balance sheet, cash flow)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "Stock ticker symbol"},
                "statement": {"type": "string", "enum": ["income", "balance", "cash"], "description": "Type of financial statement"}
            },
            "required": ["ticker", "statement"]
        }
    },
    {
        "name": "finance_prices",
        "description": "Get historical stock prices",
        "inputSchema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "Stock ticker symbol"},
                "period": {"type": "string", "description": "Time period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max"}
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "finance_peers",
        "description": "Get peer comparison data for a stock",
        "inputSchema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "Stock ticker symbol"}
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "finance_earnings",
        "description": "Get earnings history and beat/miss data",
        "inputSchema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "Stock ticker symbol"}
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "finance_search",
        "description": "Search for stocks by ticker symbol",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Ticker symbol to look up"}
            },
            "required": ["query"]
        }
    }
]

def handle_request(request: dict) -> dict:
    """Handle MCP request"""
    method = request.get("method")
    params = request.get("params", {})
    req_id = request.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "finance-data",
                    "version": "1.0.0"
                }
            }
        }

    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": TOOLS}
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments", {})

        try:
            if tool_name == "finance_stock_info":
                result = get_stock_info(args["ticker"])
            elif tool_name == "finance_financials":
                result = get_financials(args["ticker"], args.get("statement", "income"))
            elif tool_name == "finance_prices":
                result = get_historical_prices(args["ticker"], args.get("period", "1y"))
            elif tool_name == "finance_peers":
                result = get_peer_comparison(args["ticker"])
            elif tool_name == "finance_earnings":
                result = get_earnings_history(args["ticker"])
            elif tool_name == "finance_search":
                result = search_stocks(args["query"])
            else:
                result = {"error": f"Unknown tool: {tool_name}"}

            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(result, indent=2)}]
                }
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps({"error": str(e)})}]
                }
            }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Unknown method: {method}"}
    }

def main():
    """Main MCP server loop"""
    while True:
        request = read_request()
        if request is None:
            break

        response = handle_request(request)
        send_response(response)

if __name__ == "__main__":
    main()
