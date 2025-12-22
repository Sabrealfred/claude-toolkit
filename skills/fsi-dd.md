# FSI: Due Diligence Data Pack

> Process deal documents and extract key information into structured format.

## Overview

This skill processes due diligence documents and extracts:
- Financial information
- Customer/supplier lists
- Contract terms
- Risk factors
- Key personnel
- Output to Excel/structured format

## Usage

```
/fsi-dd [document_path] [options]
```

### Options
- `--type buyside` - DD type: buyside | sellside | lender
- `--focus financials` - Focus: financials | legal | commercial | all
- `--output excel` - Output: markdown | excel | json

## Document Types Supported

| Document | Key Extractions |
|----------|-----------------|
| CIM (Confidential Info Memo) | Business overview, financials, customers |
| Financial Statements | Revenue, EBITDA, margins, trends |
| Customer Contracts | Terms, pricing, duration, renewal |
| Supplier Agreements | Key suppliers, concentration |
| Employment Agreements | Key person terms, compensation |
| Lease Agreements | Locations, terms, costs |
| IP Documentation | Patents, trademarks, licenses |
| Legal Documents | Litigation, regulatory issues |

## Process

### Step 1: Document Intake

```python
supported_formats = [
    '.pdf',    # Most common
    '.docx',   # Word documents
    '.xlsx',   # Spreadsheets
    '.pptx',   # Presentations
    '.txt',    # Plain text
    '.csv'     # Data files
]

# Process each document
for doc in documents:
    text = extract_text(doc)
    classify_document(text)
    extract_relevant_info(text)
```

### Step 2: Financial Extraction

```
Key Financial Metrics to Extract:

Income Statement:
- Revenue (3-5 years historical)
- Gross Profit / Gross Margin
- EBITDA / EBITDA Margin
- Net Income / Net Margin
- Revenue by segment/geography

Balance Sheet:
- Total Assets
- Total Debt
- Cash and Equivalents
- Working Capital
- Net Debt

Cash Flow:
- Operating Cash Flow
- CapEx
- Free Cash Flow
- Debt Service

Quality of Earnings Adjustments:
- One-time items
- Pro forma adjustments
- Normalized EBITDA
```

### Step 3: Commercial Extraction

```
Customer Analysis:
- Top 10 customers by revenue
- Customer concentration (% of revenue)
- Contract terms and expiration
- Pricing mechanisms
- Historical churn

Supplier Analysis:
- Key suppliers
- Supplier concentration
- Contract terms
- Alternative sources

Market Analysis:
- Market size (TAM/SAM/SOM)
- Growth rates
- Competitive positioning
- Market share
```

### Step 4: Risk Identification

```
Risk Categories:

Financial Risks:
- Customer concentration
- Revenue volatility
- Margin pressure
- Working capital issues

Operational Risks:
- Key person dependency
- Single points of failure
- Technology obsolescence
- Supply chain risks

Legal/Regulatory Risks:
- Pending litigation
- Regulatory compliance
- Environmental issues
- IP disputes

Market Risks:
- Competition
- Market decline
- Pricing pressure
- Disintermediation
```

## Output Format

### Excel Data Pack

**Tab 1: Executive Summary**
```
| Section | Key Finding | Risk Level |
|---------|-------------|------------|
| Financial | Revenue growing X% CAGR | Low |
| Commercial | Top 3 customers = X% | Medium |
| Legal | Pending litigation $XM | High |
```

**Tab 2: Financial Summary**
```
| Metric | FY-2 | FY-1 | FY | LTM | CAGR |
|--------|------|------|----|----|------|
| Revenue | $XM | $XM | $XM | $XM | X% |
| EBITDA | $XM | $XM | $XM | $XM | X% |
| Margin | X% | X% | X% | X% | - |
```

**Tab 3: Customer Analysis**
```
| Customer | Revenue | % Total | Contract End | Terms |
|----------|---------|---------|--------------|-------|
| Customer A | $XM | X% | MM/YY | [terms] |
```

**Tab 4: Risk Matrix**
```
| Risk | Category | Likelihood | Impact | Mitigation |
|------|----------|------------|--------|------------|
| [Risk] | [Cat] | H/M/L | H/M/L | [Action] |
```

**Tab 5: Document Index**
```
| Document | Type | Pages | Key Contents |
|----------|------|-------|--------------|
| CIM | Overview | 50 | Business, financials |
```

## Integration with M&A Pipeline

This skill integrates with `/ma-pipeline`:

```bash
# Start DD process
/ma-pipeline start --deal "Target Co"

# Process documents
/fsi-dd /path/to/dataroom --type buyside

# Generate DD checklist
/ma-pipeline checklist --from-dd
```

## Example

```
User: /fsi-dd ~/deals/targetco/dataroom/ --type buyside --output excel
```

Output: `targetco_dd_pack.xlsx` with all extracted information
