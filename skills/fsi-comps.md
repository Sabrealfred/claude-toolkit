# FSI: Comparable Company Analysis

> Build professional trading comps with valuation multiples and benchmarking.

## Overview

This skill creates comparable company analysis ("trading comps") including:
- Peer group selection
- Valuation multiples (EV/EBITDA, P/E, EV/Revenue)
- Operating metrics comparison
- Percentile rankings
- Excel output

## Usage

```
/fsi-comps TICKER [options]
```

### Options
- `--peers AUTO` - Auto-select peers or comma-separated tickers
- `--multiples all` - Multiples to show: all | valuation | operating
- `--output excel` - Output format: markdown | excel | json

## Process

### Step 1: Identify Peer Group

```python
peer_selection_criteria = {
    'industry': 'Same GICS sub-industry',
    'size': 'Market cap within 0.5x - 2x range',
    'geography': 'Same primary market',
    'business_model': 'Similar revenue mix',
    'growth_profile': 'Similar growth rates (±10%)'
}

# Target: 5-10 comparable companies
```

### Step 2: Gather Data Points

```python
metrics_needed = {
    # Valuation
    'market_cap': 'Current market capitalization',
    'enterprise_value': 'EV = Market Cap + Debt - Cash',
    'share_price': 'Current stock price',

    # Income Statement
    'revenue_ltm': 'Last twelve months revenue',
    'revenue_ntm': 'Next twelve months revenue (consensus)',
    'ebitda_ltm': 'LTM EBITDA',
    'ebitda_ntm': 'NTM EBITDA',
    'net_income': 'LTM Net Income',
    'eps_ltm': 'LTM EPS',
    'eps_ntm': 'NTM EPS',

    # Operating Metrics
    'gross_margin': 'Gross profit / Revenue',
    'ebitda_margin': 'EBITDA / Revenue',
    'net_margin': 'Net Income / Revenue',
    'revenue_growth': 'YoY revenue growth',
    'roic': 'Return on invested capital',
    'roe': 'Return on equity'
}
```

### Step 3: Calculate Multiples

```
Valuation Multiples:

EV / Revenue (LTM)  = Enterprise Value / LTM Revenue
EV / Revenue (NTM)  = Enterprise Value / NTM Revenue
EV / EBITDA (LTM)   = Enterprise Value / LTM EBITDA
EV / EBITDA (NTM)   = Enterprise Value / NTM EBITDA
P / E (LTM)         = Share Price / LTM EPS
P / E (NTM)         = Share Price / NTM EPS
P / B               = Share Price / Book Value per Share
```

### Step 4: Calculate Statistics

```
For each multiple, calculate:
- Mean
- Median
- 25th percentile
- 75th percentile
- Min / Max
- Target company percentile rank
```

## Output Format

### Markdown Summary

```markdown
## Comparable Company Analysis: [TARGET]

### Peer Group
| Company | Ticker | Market Cap | EV |
|---------|--------|------------|-----|
| Company A | TICK | $X.XB | $X.XB |
| Company B | TICK | $X.XB | $X.XB |
| ... | ... | ... | ... |
| **[TARGET]** | **TICK** | **$X.XB** | **$X.XB** |

### Valuation Multiples

| Company | EV/Rev | EV/EBITDA | P/E |
|---------|--------|-----------|-----|
| Company A | X.Xx | X.Xx | X.Xx |
| Company B | X.Xx | X.Xx | X.Xx |
| ... | ... | ... | ... |
| **Mean** | **X.Xx** | **X.Xx** | **X.Xx** |
| **Median** | **X.Xx** | **X.Xx** | **X.Xx** |
| **[TARGET]** | **X.Xx** | **X.Xx** | **X.Xx** |

### Operating Metrics

| Company | Revenue Growth | EBITDA Margin | ROE |
|---------|---------------|---------------|-----|
| Company A | X.X% | X.X% | X.X% |
| ... | ... | ... | ... |

### Implied Valuation

| Method | Multiple | Implied Value |
|--------|----------|---------------|
| EV/EBITDA (Median) | X.Xx | $X.XB |
| EV/Revenue (Median) | X.Xx | $X.XB |
| P/E (Median) | X.Xx | $XX.XX/share |

### Football Field

```
$XX |████████████████████████████| EV/EBITDA
$XX |██████████████████████      | EV/Revenue
$XX |████████████████            | P/E
    └─────────────────────────────
    $XX        $XX        $XX
         Current: $XX
```

## Excel Output

When `--output excel`:
1. Creates workbook with tabs:
   - Summary
   - Peer Group
   - Valuation Multiples
   - Operating Metrics
   - Statistics
   - Football Field Chart

## Data Sources

### Free
- Yahoo Finance: Market data, basic financials
- SEC EDGAR: Detailed financials from filings

### Premium
- Financial Modeling Prep: Cleaner data
- S&P Capital IQ: Consensus estimates

## Example

```
User: /fsi-comps MSFT --peers AAPL,GOOGL,AMZN,META --output excel