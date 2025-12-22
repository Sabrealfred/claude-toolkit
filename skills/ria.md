# RIA: Registered Investment Advisor Suite

> Full RIA capabilities: portfolio management, financial planning, tax optimization, and client reporting.

## Overview

This skill replicates what a Registered Investment Advisor does for clients:
- Portfolio management & rebalancing
- Asset allocation & risk assessment
- Tax-loss harvesting
- Performance reporting
- Financial planning
- Retirement projections
- Client reporting (quarterly/annual)

## Usage

```
/ria [command] [options]
```

### Commands
- `portfolio` - Portfolio analysis & management
- `rebalance` - Rebalancing recommendations
- `tax-harvest` - Tax-loss harvesting opportunities
- `performance` - Performance reporting
- `plan` - Financial planning
- `retire` - Retirement projections
- `report` - Generate client reports

## Portfolio Management

### Portfolio Analysis

```bash
/ria portfolio analyze --holdings ~/portfolio.csv
```

**Output:**
```markdown
## Portfolio Analysis

### Holdings Summary
| Asset | Value | % Portfolio | Asset Class |
|-------|-------|-------------|-------------|
| VTI | $250,000 | 35% | US Equity |
| VXUS | $100,000 | 14% | Int'l Equity |
| BND | $150,000 | 21% | US Bonds |
| ... | ... | ... | ... |

### Asset Allocation
- Equity: 65%
- Fixed Income: 25%
- Alternatives: 5%
- Cash: 5%

### Risk Metrics
- Portfolio Beta: 0.85
- Sharpe Ratio: 1.2
- Max Drawdown: -18%
- Volatility: 12%
```

### Asset Allocation Models

```python
allocation_models = {
    "aggressive": {
        "us_equity": 0.50,
        "intl_equity": 0.25,
        "emerging": 0.10,
        "bonds": 0.10,
        "alternatives": 0.05
    },
    "moderate": {
        "us_equity": 0.40,
        "intl_equity": 0.15,
        "emerging": 0.05,
        "bonds": 0.30,
        "alternatives": 0.05,
        "cash": 0.05
    },
    "conservative": {
        "us_equity": 0.25,
        "intl_equity": 0.10,
        "bonds": 0.45,
        "tips": 0.10,
        "cash": 0.10
    },
    "income": {
        "dividend_stocks": 0.30,
        "reits": 0.15,
        "bonds": 0.35,
        "preferred": 0.10,
        "cash": 0.10
    }
}
```

### Recommended ETFs by Asset Class

```python
etf_recommendations = {
    "us_equity": {
        "total_market": ["VTI", "ITOT", "SPTM"],
        "sp500": ["VOO", "IVV", "SPY"],
        "growth": ["VUG", "IWF", "SCHG"],
        "value": ["VTV", "IWD", "SCHV"],
        "small_cap": ["VB", "IJR", "SCHA"],
        "dividend": ["VYM", "SCHD", "DVY"]
    },
    "intl_equity": {
        "developed": ["VXUS", "IXUS", "IEFA"],
        "emerging": ["VWO", "IEMG", "EEM"]
    },
    "fixed_income": {
        "total_bond": ["BND", "AGG", "SCHZ"],
        "treasury": ["GOVT", "IEF", "TLT"],
        "tips": ["TIP", "SCHP", "VTIP"],
        "corporate": ["LQD", "VCIT", "IGIB"],
        "high_yield": ["HYG", "JNK", "USHY"],
        "muni": ["MUB", "VTEB", "TFI"]
    },
    "alternatives": {
        "reits": ["VNQ", "IYR", "SCHH"],
        "commodities": ["GSG", "DJP", "PDBC"],
        "gold": ["GLD", "IAU", "SGOL"]
    }
}
```

## Rebalancing

### Threshold-Based Rebalancing

```bash
/ria rebalance --threshold 5% --tax-aware
```

**Process:**
1. Compare current allocation to target
2. Identify drift > threshold
3. Calculate trades needed
4. Optimize for tax efficiency
5. Generate trade list

```python
def calculate_rebalance(holdings, target_allocation, threshold=0.05):
    """
    Calculate rebalancing trades.

    Prioritizes:
    1. Sell lots with losses (harvest)
    2. Sell lots with long-term gains
    3. Buy in tax-advantaged accounts first
    """
    current = calculate_current_allocation(holdings)
    trades = []

    for asset_class, target in target_allocation.items():
        current_pct = current.get(asset_class, 0)
        drift = abs(current_pct - target)

        if drift > threshold:
            if current_pct > target:
                # Need to sell
                amount = (current_pct - target) * portfolio_value
                trades.append({
                    "action": "SELL",
                    "asset_class": asset_class,
                    "amount": amount,
                    "tax_lots": prioritize_lots(holdings[asset_class])
                })
            else:
                # Need to buy
                amount = (target - current_pct) * portfolio_value
                trades.append({
                    "action": "BUY",
                    "asset_class": asset_class,
                    "amount": amount
                })

    return trades
```

## Tax-Loss Harvesting

### Automated Harvesting

```bash
/ria tax-harvest --min-loss 3000 --wash-sale-check
```

**Rules:**
- Minimum loss threshold: $3,000 (offsets ordinary income)
- 30-day wash sale rule compliance
- Substantially identical security avoidance
- Track cost basis adjustments

```python
harvest_opportunities = [
    {
        "security": "VTI",
        "shares": 100,
        "cost_basis": 25000,
        "current_value": 22000,
        "loss": 3000,
        "holding_period": "short",
        "replacement": "ITOT",  # Similar but not identical
        "wash_sale_clear_date": "2025-01-15"
    }
]
```

### Tax Alpha Strategies

| Strategy | Description | Potential Alpha |
|----------|-------------|-----------------|
| Loss Harvesting | Realize losses, defer gains | 0.5-1.0% |
| Asset Location | Tax-efficient placement | 0.3-0.5% |
| Lot Selection | HIFO for sales | 0.2-0.4% |
| Muni Bonds | Tax-free income | Varies |
| Qualified Dividends | Lower rate | 0.1-0.3% |

### Asset Location Optimization

```python
asset_location = {
    # Tax-deferred (401k, IRA)
    "tax_deferred": [
        "bonds",           # Interest taxed as ordinary income
        "reits",           # Dividends are ordinary income
        "high_turnover",   # Frequent capital gains
        "taxable_bonds"
    ],

    # Tax-free (Roth IRA)
    "tax_free": [
        "high_growth",     # Max tax-free growth
        "small_cap",       # Higher expected returns
        "emerging_markets"
    ],

    # Taxable brokerage
    "taxable": [
        "index_funds",     # Low turnover
        "muni_bonds",      # Tax-free income
        "qualified_div",   # Lower tax rate
        "long_term_holds"
    ]
}
```

## Performance Reporting

### Performance Metrics

```bash
/ria performance --period YTD --benchmark SPY
```

**Output:**
```markdown
## Performance Report - YTD 2024

### Returns
| Period | Portfolio | Benchmark | Alpha |
|--------|-----------|-----------|-------|
| MTD | +2.3% | +1.8% | +0.5% |
| QTD | +5.1% | +4.2% | +0.9% |
| YTD | +12.4% | +11.2% | +1.2% |
| 1 Year | +18.2% | +16.5% | +1.7% |
| 3 Year | +8.5% | +7.8% | +0.7% |

### Risk-Adjusted Returns
- Sharpe Ratio: 1.35 (benchmark: 1.15)
- Sortino Ratio: 1.82
- Information Ratio: 0.65
- Treynor Ratio: 0.12

### Attribution
| Factor | Contribution |
|--------|--------------|
| Asset Allocation | +0.8% |
| Security Selection | +0.3% |
| Tax Alpha | +0.4% |
| Timing | -0.1% |
```

### Benchmarks by Strategy

```python
benchmarks = {
    "aggressive_growth": "VT",      # Global equity
    "moderate_growth": "AOR",       # 60/40 global
    "conservative": "AOK",          # 30/70
    "income": "SCHD",               # Dividend focus
    "sp500": "SPY",                 # US large cap
    "total_market": "VTI"           # US total
}
```

## Financial Planning

### Comprehensive Plan

```bash
/ria plan --comprehensive --goal retirement
```

**Components:**
1. Current financial snapshot
2. Cash flow analysis
3. Net worth statement
4. Retirement projections
5. Risk assessment
6. Recommendations

### Retirement Calculator

```python
def calculate_retirement(
    current_age: int,
    retirement_age: int,
    current_savings: float,
    monthly_contribution: float,
    expected_return: float = 0.07,
    inflation: float = 0.03,
    withdrawal_rate: float = 0.04
) -> dict:
    """
    Monte Carlo retirement projection.
    """
    years_to_retirement = retirement_age - current_age
    real_return = expected_return - inflation

    # Future value of current savings
    fv_savings = current_savings * (1 + real_return) ** years_to_retirement

    # Future value of contributions
    fv_contributions = monthly_contribution * 12 * (
        ((1 + real_return) ** years_to_retirement - 1) / real_return
    )

    total_at_retirement = fv_savings + fv_contributions

    # Safe withdrawal amount
    annual_withdrawal = total_at_retirement * withdrawal_rate
    monthly_income = annual_withdrawal / 12

    return {
        "projected_savings": round(total_at_retirement),
        "annual_withdrawal": round(annual_withdrawal),
        "monthly_income": round(monthly_income),
        "success_probability": calculate_success_probability(
            total_at_retirement,
            annual_withdrawal,
            30  # years in retirement
        )
    }
```

### Financial Goals

```python
goal_types = {
    "retirement": {
        "target_multiple": 25,  # 25x annual expenses
        "withdrawal_rate": 0.04
    },
    "college": {
        "cost_per_year": 50000,  # Private university
        "years": 4,
        "inflation": 0.05
    },
    "house_down_payment": {
        "target_pct": 0.20,
        "closing_costs": 0.03
    },
    "emergency_fund": {
        "months_expenses": 6
    }
}
```

## Client Reporting

### Quarterly Report

```bash
/ria report quarterly --client "Smith Family" --output pdf
```

**Sections:**
1. Executive Summary
2. Market Commentary
3. Portfolio Performance
4. Holdings Detail
5. Transactions
6. Asset Allocation
7. Tax Report
8. Planning Updates

### Report Template

```markdown
# Quarterly Investment Report
## Smith Family Trust
### Q4 2024

---

## Executive Summary

Your portfolio returned **+4.2%** this quarter, outperforming
the benchmark by **+0.8%**. Year-to-date return is **+12.4%**.

**Key Highlights:**
- Completed tax-loss harvesting: $15,000 in losses realized
- Rebalanced portfolio to target allocation
- Added to international exposure per Q3 discussion

---

## Portfolio Value

| Account | Value | Change |
|---------|-------|--------|
| Joint Brokerage | $850,000 | +$35,000 |
| John's 401(k) | $420,000 | +$18,000 |
| Jane's IRA | $230,000 | +$9,500 |
| **Total** | **$1,500,000** | **+$62,500** |

---

## Asset Allocation

[Pie chart visualization]

| Asset Class | Target | Actual | Drift |
|-------------|--------|--------|-------|
| US Equity | 45% | 46% | +1% |
| Int'l Equity | 20% | 19% | -1% |
| Fixed Income | 30% | 30% | 0% |
| Alternatives | 5% | 5% | 0% |

---

## Tax Summary

- Realized Gains (LT): $8,500
- Realized Gains (ST): $1,200
- Realized Losses: ($15,000)
- **Net Realized**: ($5,300)
- Estimated Tax Savings: $2,120

---

## Next Steps

1. Review January contribution to maximize 401(k)
2. Discuss Roth conversion strategy for 2025
3. Update beneficiary designations
```

## Integration

### With Accountant Skill

```bash
# Import transactions for tax planning
/accountant import ~/downloads/schwab.ofx

# Calculate estimated taxes including investments
/ria tax-estimate --include-investments

# Generate 1099 summary
/ria report 1099-summary --year 2024
```

### With Finance MCP

```bash
# Get current prices for holdings
/ria portfolio update-prices

# Research new investment
/ria research --ticker NVDA --deep

# Screen for dividend stocks
/ria screen --dividend-yield ">3%" --payout-ratio "<60%"
```

## Data Sources

### Free
- Yahoo Finance (yfinance) - Prices, fundamentals
- FRED - Economic data
- SEC EDGAR - Company filings

### Low Cost
- Financial Modeling Prep ($15/mo) - Better fundamentals
- Polygon.io ($29/mo) - Real-time data

### Required for Production RIA
- Morningstar API - Fund data, ratings
- Orion/Black Diamond - Portfolio management
- Redtail/Wealthbox - CRM
- DocuSign - Client signatures

## Compliance Notes

This skill is for informational purposes. Actual RIA operations require:
- SEC/State registration
- Form ADV filing
- Compliance procedures
- Custody arrangements
- Client agreements
- E&O insurance
