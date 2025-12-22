# FSI: Discounted Cash Flow Model

> Build professional DCF valuation models with sensitivity analysis.

## Overview

This skill creates discounted cash flow (DCF) models for company valuation, including:
- Free Cash Flow projections (5-10 years)
- WACC calculation
- Terminal value (Gordon Growth / Exit Multiple)
- Sensitivity tables
- Excel output

## Usage

```
/fsi-dcf TICKER [options]
```

### Options
- `--years 5` - Projection years (default: 5)
- `--terminal growth` - Terminal value method: growth | multiple (default: growth)
- `--output excel` - Output format: markdown | excel | json

## Process

### Step 1: Gather Financial Data

```python
# Required data points
data_needed = {
    'revenue_history': 'Last 3-5 years revenue',
    'ebitda_margins': 'Historical EBITDA margins',
    'capex': 'Capital expenditures',
    'working_capital': 'NWC changes',
    'debt': 'Total debt and interest rates',
    'equity': 'Market cap, shares outstanding',
    'tax_rate': 'Effective tax rate',
    'beta': 'Levered beta',
    'risk_free_rate': '10Y Treasury yield',
    'market_premium': 'Equity risk premium (5-6%)'
}
```

### Step 2: Project Free Cash Flows

```
Year 1-5 FCF Projection:

Revenue Growth Assumptions:
- Year 1: [X]%
- Year 2: [X]%
- Year 3: [X]%
- Year 4: [X]%
- Year 5: [X]%

EBITDA Margin: [X]% (converging to industry avg)
D&A: [X]% of revenue
CapEx: [X]% of revenue
NWC: [X]% of revenue change

FCF = EBITDA - Taxes - CapEx - ΔNWC
```

### Step 3: Calculate WACC

```
WACC Components:

Cost of Equity (CAPM):
Ke = Rf + β × (Rm - Rf)
Ke = [Risk-free] + [Beta] × [Market Premium]

Cost of Debt:
Kd = Interest Rate × (1 - Tax Rate)

WACC:
WACC = (E/V × Ke) + (D/V × Kd)

Where:
- E = Market value of equity
- D = Market value of debt
- V = E + D
```

### Step 4: Terminal Value

**Gordon Growth Method:**
```
TV = FCF(n+1) / (WACC - g)

Where:
- FCF(n+1) = Final year FCF × (1 + g)
- g = Perpetual growth rate (2-3%)
```

**Exit Multiple Method:**
```
TV = EBITDA(n) × Exit Multiple

Where:
- Exit Multiple = Industry EV/EBITDA (8-12x typical)
```

### Step 5: Calculate Enterprise Value

```
EV = Σ [FCF(t) / (1 + WACC)^t] + [TV / (1 + WACC)^n]

Equity Value = EV - Net Debt
Share Price = Equity Value / Shares Outstanding
```

### Step 6: Sensitivity Analysis

```
| WACC \ Growth | 1.5%  | 2.0%  | 2.5%  | 3.0%  |
|---------------|-------|-------|-------|-------|
| 8.0%          | $XX   | $XX   | $XX   | $XX   |
| 8.5%          | $XX   | $XX   | $XX   | $XX   |
| 9.0%          | $XX   | $XX   | $XX   | $XX   |
| 9.5%          | $XX   | $XX   | $XX   | $XX   |
| 10.0%         | $XX   | $XX   | $XX   | $XX   |
```

## Output Format

### Markdown Summary
```markdown
## DCF Valuation: [COMPANY]

### Key Assumptions
| Metric | Value |
|--------|-------|
| Revenue CAGR | X% |
| EBITDA Margin | X% |
| WACC | X% |
| Terminal Growth | X% |

### Valuation Summary
| Metric | Value |
|--------|-------|
| Enterprise Value | $X.XB |
| Net Debt | $X.XB |
| Equity Value | $X.XB |
| Shares Outstanding | X.XM |
| **Implied Share Price** | **$XX.XX** |
| Current Price | $XX.XX |
| Upside/(Downside) | X% |

### Sensitivity Table
[See above]
```

### Excel Output
When `--output excel`:
1. Creates workbook with tabs:
   - Summary
   - Assumptions
   - Income Statement
   - Cash Flow Build
   - WACC
   - DCF
   - Sensitivity

## Data Sources

### Free
- Yahoo Finance: `yfinance` Python library
- SEC EDGAR: 10-K filings
- FRED: Risk-free rates

### Premium (optional)
- Financial Modeling Prep API
- S&P Capital IQ

## Example

```
User: /fsi-dcf AAPL --years 5 --terminal growth