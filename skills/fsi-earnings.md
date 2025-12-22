# FSI: Earnings Analysis

> Analyze earnings releases, extract key metrics, and summarize management commentary.

## Overview

This skill analyzes quarterly earnings including:
- Revenue/EPS beat/miss vs consensus
- Key metrics extraction
- Guidance changes
- Management commentary highlights
- Sentiment analysis

## Usage

```
/fsi-earnings TICKER [options]
```

### Options
- `--quarter Q3-2024` - Specific quarter (default: latest)
- `--compare yoy` - Compare: yoy | qoq | guidance
- `--source transcript` - Source: transcript | 8k | press

## Process

### Step 1: Gather Earnings Data

```python
earnings_data = {
    # Actual Results
    'revenue_actual': 'Reported revenue',
    'eps_actual': 'Reported EPS (GAAP and Non-GAAP)',
    'ebitda_actual': 'Reported EBITDA',

    # Consensus Estimates
    'revenue_estimate': 'Street consensus revenue',
    'eps_estimate': 'Street consensus EPS',

    # Guidance
    'revenue_guide_low': 'Revenue guidance low',
    'revenue_guide_high': 'Revenue guidance high',
    'eps_guide_low': 'EPS guidance low',
    'eps_guide_high': 'EPS guidance high',

    # Prior Period
    'revenue_prior': 'Prior year same quarter',
    'eps_prior': 'Prior year same quarter'
}
```

### Step 2: Calculate Beat/Miss

```
Revenue:
- Beat/Miss $ = Actual - Estimate
- Beat/Miss % = (Actual - Estimate) / Estimate × 100

EPS:
- Beat/Miss $ = Actual - Estimate
- Beat/Miss % = (Actual - Estimate) / Estimate × 100

YoY Growth:
- Revenue Growth = (Current - Prior) / Prior × 100
- EPS Growth = (Current - Prior) / Prior × 100
```

### Step 3: Guidance Analysis

```
Guidance Change:
- Prior guidance midpoint
- New guidance midpoint
- Change $ and %
- Implied growth rate

Guidance vs Consensus:
- Guide midpoint vs Street estimate
- Positive/negative surprise
```

### Step 4: Transcript Analysis

Key sections to analyze:
1. **Prepared Remarks** - CEO/CFO highlights
2. **Q&A** - Analyst questions and responses
3. **Forward-Looking Statements** - Guidance commentary

Extract:
- Key themes (3-5 bullet points)
- Notable quotes
- Risks mentioned
- Opportunities highlighted
- Tone/sentiment (bullish/neutral/bearish)

## Output Format

```markdown
## Earnings Analysis: [COMPANY] Q[X] [YEAR]

### Headlines
- Revenue: $X.XB vs $X.XB est. (**BEAT/MISS** by X%)
- EPS: $X.XX vs $X.XX est. (**BEAT/MISS** by X%)
- Guidance: **RAISED/LOWERED/MAINTAINED**

### Key Metrics

| Metric | Actual | Estimate | Beat/Miss | YoY |
|--------|--------|----------|-----------|-----|
| Revenue | $X.XB | $X.XB | +X% | +X% |
| Gross Margin | X.X% | X.X% | +Xbps | +Xbps |
| Operating Income | $X.XB | $X.XB | +X% | +X% |
| EPS (Non-GAAP) | $X.XX | $X.XX | +X% | +X% |
| Free Cash Flow | $X.XB | - | - | +X% |

### Segment Performance

| Segment | Revenue | YoY Growth | % of Total |
|---------|---------|------------|------------|
| Segment A | $X.XB | +X% | X% |
| Segment B | $X.XB | +X% | X% |
| Segment C | $X.XB | +X% | X% |

### Guidance

| Metric | Prior | New | Change |
|--------|-------|-----|--------|
| Q[X+1] Revenue | $X.X-X.XB | $X.X-X.XB | +X% |
| Q[X+1] EPS | $X.XX-X.XX | $X.XX-X.XX | +X% |
| FY Revenue | $X.X-X.XB | $X.X-X.XB | +X% |
| FY EPS | $X.XX-X.XX | $X.XX-X.XX | +X% |

### Management Commentary

**Key Themes:**
1. [Theme 1 with supporting quote]
2. [Theme 2 with supporting quote]
3. [Theme 3 with supporting quote]

**Notable Quotes:**
> "[Important quote from CEO]"
> "[Important quote from CFO]"

**Risks Highlighted:**
- [Risk 1]
- [Risk 2]

**Opportunities:**
- [Opportunity 1]
- [Opportunity 2]

### Sentiment: [BULLISH/NEUTRAL/BEARISH]

**Reasoning:** [1-2 sentence explanation]
```

## Data Sources

### Free
- SEC EDGAR: 8-K filings, press releases
- Company IR websites: Transcripts (some)
- Yahoo Finance: Basic earnings data

### Premium
- Aiera: Full transcripts, AI summaries
- FactSet: Consensus estimates
- Bloomberg: Real-time data

## Example

```
User: /fsi-earnings NVDA --quarter Q3-2024 --source transcript
```
