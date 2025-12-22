#!/usr/bin/env python3
"""
Portfolio Manager

Full RIA portfolio management capabilities:
- Portfolio analysis
- Rebalancing
- Tax-loss harvesting
- Performance calculation
- Risk metrics
"""

import json
import csv
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict, field
from typing import Dict, List, Optional, Tuple
from enum import Enum
import math

try:
    import yfinance as yf
    HAS_YFINANCE = True
except ImportError:
    HAS_YFINANCE = False
    print("Warning: yfinance not installed. Run: pip install yfinance")


class AssetClass(Enum):
    US_EQUITY = "us_equity"
    INTL_EQUITY = "intl_equity"
    EMERGING = "emerging"
    BONDS = "bonds"
    TIPS = "tips"
    REITS = "reits"
    COMMODITIES = "commodities"
    CASH = "cash"
    OTHER = "other"


@dataclass
class Holding:
    """Individual security holding"""
    ticker: str
    shares: float
    cost_basis: float
    purchase_date: str
    account: str = "taxable"
    asset_class: AssetClass = AssetClass.OTHER
    current_price: float = 0.0
    current_value: float = 0.0
    gain_loss: float = 0.0
    gain_loss_pct: float = 0.0
    holding_period: str = "long"  # "short" or "long"


@dataclass
class Portfolio:
    """Complete portfolio"""
    holdings: List[Holding]
    total_value: float = 0.0
    total_cost: float = 0.0
    total_gain_loss: float = 0.0
    allocation: Dict[str, float] = field(default_factory=dict)


@dataclass
class RebalanceTrade:
    """Recommended rebalancing trade"""
    action: str  # "BUY" or "SELL"
    ticker: str
    shares: float
    amount: float
    reason: str
    tax_impact: Optional[float] = None
    lot_id: Optional[str] = None


@dataclass
class HarvestOpportunity:
    """Tax-loss harvesting opportunity"""
    ticker: str
    shares: float
    current_value: float
    cost_basis: float
    loss: float
    holding_period: str
    replacement_ticker: str
    wash_sale_end: str


# ETF to Asset Class mapping
ETF_ASSET_CLASS = {
    # US Equity
    "VTI": AssetClass.US_EQUITY,
    "VOO": AssetClass.US_EQUITY,
    "SPY": AssetClass.US_EQUITY,
    "IVV": AssetClass.US_EQUITY,
    "ITOT": AssetClass.US_EQUITY,
    "VUG": AssetClass.US_EQUITY,
    "VTV": AssetClass.US_EQUITY,
    "VB": AssetClass.US_EQUITY,
    "SCHD": AssetClass.US_EQUITY,

    # International
    "VXUS": AssetClass.INTL_EQUITY,
    "IXUS": AssetClass.INTL_EQUITY,
    "IEFA": AssetClass.INTL_EQUITY,
    "EFA": AssetClass.INTL_EQUITY,

    # Emerging Markets
    "VWO": AssetClass.EMERGING,
    "IEMG": AssetClass.EMERGING,
    "EEM": AssetClass.EMERGING,

    # Bonds
    "BND": AssetClass.BONDS,
    "AGG": AssetClass.BONDS,
    "SCHZ": AssetClass.BONDS,
    "TLT": AssetClass.BONDS,
    "IEF": AssetClass.BONDS,
    "LQD": AssetClass.BONDS,

    # TIPS
    "TIP": AssetClass.TIPS,
    "SCHP": AssetClass.TIPS,

    # REITs
    "VNQ": AssetClass.REITS,
    "IYR": AssetClass.REITS,

    # Commodities
    "GLD": AssetClass.COMMODITIES,
    "IAU": AssetClass.COMMODITIES,
    "GSG": AssetClass.COMMODITIES,
}

# Similar securities for tax-loss harvesting (not substantially identical)
HARVEST_REPLACEMENTS = {
    "VTI": "ITOT",
    "ITOT": "VTI",
    "VOO": "IVV",
    "IVV": "VOO",
    "SPY": "SPLG",
    "VXUS": "IXUS",
    "IXUS": "VXUS",
    "VWO": "IEMG",
    "IEMG": "VWO",
    "BND": "SCHZ",
    "SCHZ": "BND",
    "AGG": "BND",
}

# Model portfolios
MODEL_PORTFOLIOS = {
    "aggressive": {
        AssetClass.US_EQUITY: 0.50,
        AssetClass.INTL_EQUITY: 0.25,
        AssetClass.EMERGING: 0.10,
        AssetClass.BONDS: 0.10,
        AssetClass.REITS: 0.05,
    },
    "moderate": {
        AssetClass.US_EQUITY: 0.40,
        AssetClass.INTL_EQUITY: 0.15,
        AssetClass.EMERGING: 0.05,
        AssetClass.BONDS: 0.30,
        AssetClass.REITS: 0.05,
        AssetClass.CASH: 0.05,
    },
    "conservative": {
        AssetClass.US_EQUITY: 0.25,
        AssetClass.INTL_EQUITY: 0.10,
        AssetClass.BONDS: 0.45,
        AssetClass.TIPS: 0.10,
        AssetClass.CASH: 0.10,
    },
    "income": {
        AssetClass.US_EQUITY: 0.30,  # Dividend stocks
        AssetClass.REITS: 0.15,
        AssetClass.BONDS: 0.40,
        AssetClass.CASH: 0.15,
    }
}


def get_current_prices(tickers: List[str]) -> Dict[str, float]:
    """Get current prices for list of tickers"""
    if not HAS_YFINANCE:
        return {t: 0.0 for t in tickers}

    prices = {}
    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            prices[ticker] = info.get("currentPrice", info.get("regularMarketPrice", 0))
        except Exception:
            prices[ticker] = 0.0

    return prices


def classify_holding_period(purchase_date: str) -> str:
    """Determine if holding is short-term or long-term"""
    purchase = datetime.strptime(purchase_date, "%Y-%m-%d")
    one_year_ago = datetime.now() - timedelta(days=365)

    return "long" if purchase <= one_year_ago else "short"


def load_portfolio_csv(file_path: str) -> List[Holding]:
    """
    Load portfolio from CSV file.

    Expected columns: ticker, shares, cost_basis, purchase_date, account
    """
    holdings = []

    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)

        for row in reader:
            ticker = row.get("ticker", "").upper()
            holdings.append(Holding(
                ticker=ticker,
                shares=float(row.get("shares", 0)),
                cost_basis=float(row.get("cost_basis", 0)),
                purchase_date=row.get("purchase_date", "2020-01-01"),
                account=row.get("account", "taxable"),
                asset_class=ETF_ASSET_CLASS.get(ticker, AssetClass.OTHER),
                holding_period=classify_holding_period(row.get("purchase_date", "2020-01-01"))
            ))

    return holdings


def analyze_portfolio(holdings: List[Holding]) -> Portfolio:
    """Analyze portfolio and calculate metrics"""

    # Get current prices
    tickers = list(set(h.ticker for h in holdings))
    prices = get_current_prices(tickers)

    # Update holdings with current values
    for h in holdings:
        h.current_price = prices.get(h.ticker, 0)
        h.current_value = h.shares * h.current_price
        h.gain_loss = h.current_value - h.cost_basis
        h.gain_loss_pct = (h.gain_loss / h.cost_basis * 100) if h.cost_basis > 0 else 0

    # Calculate totals
    total_value = sum(h.current_value for h in holdings)
    total_cost = sum(h.cost_basis for h in holdings)
    total_gain_loss = total_value - total_cost

    # Calculate allocation by asset class
    allocation = {}
    for asset_class in AssetClass:
        class_value = sum(h.current_value for h in holdings if h.asset_class == asset_class)
        if total_value > 0:
            allocation[asset_class.value] = round(class_value / total_value, 4)

    return Portfolio(
        holdings=holdings,
        total_value=round(total_value, 2),
        total_cost=round(total_cost, 2),
        total_gain_loss=round(total_gain_loss, 2),
        allocation=allocation
    )


def calculate_rebalance(portfolio: Portfolio,
                        target_model: str = "moderate",
                        threshold: float = 0.05,
                        tax_aware: bool = True) -> List[RebalanceTrade]:
    """
    Calculate rebalancing trades needed.

    Args:
        portfolio: Current portfolio
        target_model: Model portfolio to rebalance to
        threshold: Drift threshold (e.g., 0.05 = 5%)
        tax_aware: Prioritize tax-efficient trades
    """
    target = MODEL_PORTFOLIOS.get(target_model, MODEL_PORTFOLIOS["moderate"])
    trades = []

    for asset_class, target_pct in target.items():
        current_pct = portfolio.allocation.get(asset_class.value, 0)
        drift = current_pct - target_pct

        if abs(drift) < threshold:
            continue

        amount = abs(drift) * portfolio.total_value

        if drift > 0:
            # Over-allocated - need to sell
            # Find holdings in this asset class
            class_holdings = [h for h in portfolio.holdings
                             if h.asset_class == asset_class]

            if tax_aware:
                # Prioritize: 1) Losses, 2) Long-term gains, 3) Short-term gains
                class_holdings.sort(key=lambda h: (
                    0 if h.gain_loss < 0 else (1 if h.holding_period == "long" else 2),
                    h.gain_loss
                ))

            for h in class_holdings:
                if amount <= 0:
                    break

                sell_value = min(amount, h.current_value)
                sell_shares = sell_value / h.current_price if h.current_price > 0 else 0

                # Calculate tax impact
                proportional_basis = h.cost_basis * (sell_shares / h.shares)
                tax_impact = sell_value - proportional_basis

                trades.append(RebalanceTrade(
                    action="SELL",
                    ticker=h.ticker,
                    shares=round(sell_shares, 4),
                    amount=round(sell_value, 2),
                    reason=f"Reduce {asset_class.value} allocation by {abs(drift)*100:.1f}%",
                    tax_impact=round(tax_impact, 2)
                ))

                amount -= sell_value

        else:
            # Under-allocated - need to buy
            # Find representative ETF for this asset class
            etf = None
            for ticker, ac in ETF_ASSET_CLASS.items():
                if ac == asset_class:
                    etf = ticker
                    break

            if etf:
                trades.append(RebalanceTrade(
                    action="BUY",
                    ticker=etf,
                    shares=0,  # Calculate after getting price
                    amount=round(amount, 2),
                    reason=f"Increase {asset_class.value} allocation by {abs(drift)*100:.1f}%"
                ))

    return trades


def find_harvest_opportunities(portfolio: Portfolio,
                               min_loss: float = 1000,
                               short_term_only: bool = False) -> List[HarvestOpportunity]:
    """
    Find tax-loss harvesting opportunities.

    Args:
        portfolio: Current portfolio
        min_loss: Minimum loss to consider harvesting
        short_term_only: Only harvest short-term losses
    """
    opportunities = []

    for h in portfolio.holdings:
        # Skip gains
        if h.gain_loss >= 0:
            continue

        # Skip if loss too small
        if abs(h.gain_loss) < min_loss:
            continue

        # Skip long-term if short_term_only
        if short_term_only and h.holding_period == "long":
            continue

        # Find replacement
        replacement = HARVEST_REPLACEMENTS.get(h.ticker)
        if not replacement:
            continue

        # Calculate wash sale end date (30 days from today)
        wash_sale_end = (datetime.now() + timedelta(days=31)).strftime("%Y-%m-%d")

        opportunities.append(HarvestOpportunity(
            ticker=h.ticker,
            shares=h.shares,
            current_value=h.current_value,
            cost_basis=h.cost_basis,
            loss=abs(h.gain_loss),
            holding_period=h.holding_period,
            replacement_ticker=replacement,
            wash_sale_end=wash_sale_end
        ))

    # Sort by loss size (largest first)
    opportunities.sort(key=lambda x: x.loss, reverse=True)

    return opportunities


def calculate_performance(portfolio: Portfolio,
                          period: str = "ytd",
                          benchmark: str = "SPY") -> Dict:
    """
    Calculate portfolio performance vs benchmark.

    Args:
        portfolio: Current portfolio
        period: "mtd", "qtd", "ytd", "1y", "3y", "5y"
        benchmark: Benchmark ticker
    """
    if not HAS_YFINANCE:
        return {"error": "yfinance not installed"}

    # Determine date range
    end_date = datetime.now()
    if period == "mtd":
        start_date = end_date.replace(day=1)
    elif period == "qtd":
        quarter_start_month = ((end_date.month - 1) // 3) * 3 + 1
        start_date = end_date.replace(month=quarter_start_month, day=1)
    elif period == "ytd":
        start_date = end_date.replace(month=1, day=1)
    elif period == "1y":
        start_date = end_date - timedelta(days=365)
    elif period == "3y":
        start_date = end_date - timedelta(days=365 * 3)
    elif period == "5y":
        start_date = end_date - timedelta(days=365 * 5)
    else:
        start_date = end_date - timedelta(days=365)

    # Get benchmark data
    try:
        bench = yf.Ticker(benchmark)
        bench_hist = bench.history(start=start_date, end=end_date)

        if len(bench_hist) > 1:
            bench_return = (bench_hist['Close'].iloc[-1] / bench_hist['Close'].iloc[0] - 1) * 100
        else:
            bench_return = 0
    except Exception:
        bench_return = 0

    # Calculate weighted portfolio return (simplified)
    # In production, would use time-weighted return
    portfolio_return = (portfolio.total_gain_loss / portfolio.total_cost * 100) if portfolio.total_cost > 0 else 0

    alpha = portfolio_return - bench_return

    return {
        "period": period,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "portfolio_return": round(portfolio_return, 2),
        "benchmark": benchmark,
        "benchmark_return": round(bench_return, 2),
        "alpha": round(alpha, 2),
        "portfolio_value": portfolio.total_value,
        "total_gain_loss": portfolio.total_gain_loss
    }


def calculate_risk_metrics(portfolio: Portfolio) -> Dict:
    """Calculate portfolio risk metrics"""
    if not HAS_YFINANCE:
        return {"error": "yfinance not installed"}

    # Get historical returns for each holding
    returns = []

    for h in portfolio.holdings:
        try:
            stock = yf.Ticker(h.ticker)
            hist = stock.history(period="1y")
            if len(hist) > 0:
                daily_returns = hist['Close'].pct_change().dropna()
                weight = h.current_value / portfolio.total_value if portfolio.total_value > 0 else 0
                returns.append({
                    "ticker": h.ticker,
                    "weight": weight,
                    "returns": daily_returns,
                    "volatility": daily_returns.std() * (252 ** 0.5)  # Annualized
                })
        except Exception:
            continue

    if not returns:
        return {"error": "Could not calculate risk metrics"}

    # Portfolio volatility (simplified - ignores correlation)
    portfolio_vol = sum(r["weight"] * r["volatility"] for r in returns)

    # Calculate Sharpe ratio (assuming 5% risk-free rate)
    risk_free = 0.05
    portfolio_return = portfolio.total_gain_loss / portfolio.total_cost if portfolio.total_cost > 0 else 0
    sharpe = (portfolio_return - risk_free) / portfolio_vol if portfolio_vol > 0 else 0

    return {
        "volatility_annual": round(portfolio_vol * 100, 2),
        "sharpe_ratio": round(sharpe, 2),
        "holdings_analyzed": len(returns),
        "note": "Simplified calculation - does not account for correlations"
    }


def generate_summary(portfolio: Portfolio) -> str:
    """Generate text summary of portfolio"""
    summary = []
    summary.append("=" * 60)
    summary.append("           PORTFOLIO SUMMARY")
    summary.append("=" * 60)

    summary.append(f"\n💰 TOTAL VALUE: ${portfolio.total_value:,.2f}")
    summary.append(f"   Cost Basis:  ${portfolio.total_cost:,.2f}")
    gain_sign = "+" if portfolio.total_gain_loss >= 0 else ""
    summary.append(f"   Gain/Loss:   {gain_sign}${portfolio.total_gain_loss:,.2f}")

    summary.append("\n📊 ASSET ALLOCATION")
    for ac, pct in sorted(portfolio.allocation.items(), key=lambda x: x[1], reverse=True):
        if pct > 0:
            bar = "█" * int(pct * 40)
            summary.append(f"   {ac:15} {pct*100:5.1f}% {bar}")

    summary.append("\n📈 TOP HOLDINGS")
    top_holdings = sorted(portfolio.holdings, key=lambda h: h.current_value, reverse=True)[:10]
    for h in top_holdings:
        gain_sign = "+" if h.gain_loss >= 0 else ""
        summary.append(f"   {h.ticker:6} ${h.current_value:>12,.2f}  ({gain_sign}{h.gain_loss_pct:.1f}%)")

    return "\n".join(summary)


# CLI
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("""
Portfolio Manager

Usage:
    python portfolio_manager.py <portfolio.csv> [command]

Commands:
    analyze      - Full portfolio analysis
    rebalance    - Rebalancing recommendations
    harvest      - Tax-loss harvesting opportunities
    performance  - Performance vs benchmark

Example CSV format:
    ticker,shares,cost_basis,purchase_date,account
    VTI,100,20000,2022-03-15,taxable
    BND,50,5000,2023-01-10,ira
""")
        sys.exit(1)

    file_path = sys.argv[1]
    command = sys.argv[2] if len(sys.argv) > 2 else "analyze"

    # Load portfolio
    holdings = load_portfolio_csv(file_path)
    portfolio = analyze_portfolio(holdings)

    if command == "analyze":
        print(generate_summary(portfolio))

    elif command == "rebalance":
        trades = calculate_rebalance(portfolio, target_model="moderate", threshold=0.05)
        print("\n=== REBALANCING RECOMMENDATIONS ===")
        for t in trades:
            print(f"{t.action:4} {t.ticker:6} ${t.amount:>10,.2f}  ({t.reason})")
            if t.tax_impact:
                print(f"      Tax Impact: ${t.tax_impact:,.2f}")

    elif command == "harvest":
        opportunities = find_harvest_opportunities(portfolio, min_loss=500)
        print("\n=== TAX-LOSS HARVESTING OPPORTUNITIES ===")
        for o in opportunities:
            print(f"{o.ticker:6} Loss: ${o.loss:,.2f} ({o.holding_period}-term)")
            print(f"       Replace with: {o.replacement_ticker}")
            print(f"       Wash sale ends: {o.wash_sale_end}")
            print()

    elif command == "performance":
        perf = calculate_performance(portfolio, period="ytd")
        print("\n=== PERFORMANCE ===")
        print(f"Period: {perf['period'].upper()} ({perf['start_date']} to {perf['end_date']})")
        print(f"Portfolio Return: {perf['portfolio_return']:+.2f}%")
        print(f"Benchmark ({perf['benchmark']}): {perf['benchmark_return']:+.2f}%")
        print(f"Alpha: {perf['alpha']:+.2f}%")
