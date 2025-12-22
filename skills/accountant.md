# Accountant: Automated Bookkeeping & Tax Preparation

> AI-powered accountant that extracts bank data, categorizes transactions, and prepares taxes.

## Overview

This skill provides automated accounting capabilities:
- Bank transaction import (OFX, CSV, Plaid)
- AI-powered transaction categorization
- Chart of accounts management
- Tax calculation (US Federal + State)
- Financial reports and tax forms

## Usage

```
/accountant [command] [options]
```

### Commands
- `import` - Import bank transactions
- `categorize` - Auto-categorize transactions
- `reconcile` - Bank reconciliation
- `report` - Generate financial reports
- `tax` - Calculate and prepare taxes

## Bank Data Import

### Supported Formats

| Format | Source | Notes |
|--------|--------|-------|
| OFX/QFX | Most US banks | Direct download from bank |
| CSV | Any bank | Manual column mapping |
| PDF | Bank statements | AI extraction |
| Plaid API | 12,000+ institutions | Requires API key |

### Import Process

```bash
# From OFX file
/accountant import ~/downloads/checking.ofx --account "Chase Checking"

# From CSV with mapping
/accountant import ~/downloads/transactions.csv --map "date,description,amount"

# From Plaid connection
/accountant import --plaid --institution "chase"
```

### Free Bank Connection Options

1. **SimpleFIN Bridge** - Open protocol for bank data
   - Self-hosted option available
   - Works with many banks

2. **OFX Direct Connect** - Built into most banks
   - Free download from bank website
   - Standard format (Quicken compatible)

3. **CSV Export** - Universal fallback
   - Every bank supports this
   - Requires column mapping

## Transaction Categorization

### IRS Schedule C Categories (Business)

```python
business_categories = {
    # Income
    "gross_receipts": "1099-NEC, invoices, sales",
    "returns_allowances": "Refunds, discounts given",
    "other_income": "Interest, miscellaneous",

    # Expenses (Schedule C Line Items)
    "advertising": "Marketing, ads, promotions",
    "car_truck": "Vehicle expenses, mileage",
    "commissions": "Sales commissions paid",
    "contract_labor": "1099 contractors",
    "depreciation": "Asset depreciation",
    "insurance": "Business insurance",
    "interest_mortgage": "Mortgage interest",
    "interest_other": "Loan interest",
    "legal_professional": "Lawyers, accountants, consultants",
    "office_expense": "Supplies, software subscriptions",
    "pension_profit_sharing": "Retirement contributions",
    "rent_lease_vehicles": "Vehicle leases",
    "rent_lease_equipment": "Equipment leases",
    "rent_lease_property": "Office/warehouse rent",
    "repairs_maintenance": "Repairs, maintenance",
    "supplies": "Business supplies",
    "taxes_licenses": "Business taxes, permits",
    "travel": "Business travel",
    "meals": "Business meals (50% deductible)",
    "utilities": "Phone, internet, utilities",
    "wages": "W-2 employee wages",
    "other_expenses": "Miscellaneous"
}
```

### Personal Tax Categories

```python
personal_categories = {
    # Income
    "wages": "W-2 income",
    "interest_income": "Bank interest",
    "dividend_income": "Stock dividends",
    "capital_gains": "Investment sales",
    "rental_income": "Rental property",
    "business_income": "Schedule C/K-1",

    # Deductions (Schedule A)
    "medical_dental": "Medical expenses",
    "state_local_taxes": "SALT (capped at $10k)",
    "mortgage_interest": "Home mortgage interest",
    "charitable": "Donations to 501(c)(3)",
    "casualty_theft": "Disaster losses",

    # Credits
    "child_tax_credit": "Per qualifying child",
    "education_credits": "AOC, LLC",
    "retirement_savings": "Saver's credit"
}
```

### AI Categorization Rules

```python
# Pattern matching rules
categorization_rules = [
    # Vendors to categories
    {"pattern": "AMAZON|AMZN", "category": "supplies", "confidence": 0.7},
    {"pattern": "UBER|LYFT", "category": "travel", "confidence": 0.8},
    {"pattern": "GOOGLE|META|FACEBOOK ADS", "category": "advertising", "confidence": 0.95},
    {"pattern": "AWS|AZURE|DIGITALOCEAN", "category": "office_expense", "confidence": 0.9},
    {"pattern": "STRIPE|PAYPAL FEE", "category": "commissions", "confidence": 0.95},
    {"pattern": "GUSTO|ADP|PAYCHEX", "category": "wages", "confidence": 0.95},
    {"pattern": "STATEFARM|GEICO|PROGRESSIVE", "category": "insurance", "confidence": 0.85},

    # Amount-based rules
    {"amount_pattern": ">10000", "flag": "review_required"},
    {"amount_pattern": "round_number", "flag": "potential_transfer"},
]
```

## Tax Calculations

### US Federal Tax (2024)

```python
# Single filer brackets
federal_brackets_single = [
    (11600, 0.10),    # 10% up to $11,600
    (47150, 0.12),    # 12% up to $47,150
    (100525, 0.22),   # 22% up to $100,525
    (191950, 0.24),   # 24% up to $191,950
    (243725, 0.32),   # 32% up to $243,725
    (609350, 0.35),   # 35% up to $609,350
    (float('inf'), 0.37)  # 37% above
]

# Standard deduction 2024
standard_deduction = {
    "single": 14600,
    "married_joint": 29200,
    "married_separate": 14600,
    "head_household": 21900
}

# Self-employment tax
se_tax_rate = 0.153  # 15.3% (12.4% SS + 2.9% Medicare)
se_tax_cap = 168600  # 2024 Social Security wage base
```

### Quarterly Estimated Taxes

```python
def calculate_estimated_tax(annual_income, filing_status):
    """Calculate quarterly estimated tax payments"""
    taxable = annual_income - standard_deduction[filing_status]
    federal_tax = calculate_federal_tax(taxable, filing_status)
    se_tax = calculate_se_tax(annual_income) if self_employed else 0

    total_annual = federal_tax + se_tax
    quarterly = total_annual / 4

    return {
        "Q1_due": "April 15",
        "Q2_due": "June 15",
        "Q3_due": "September 15",
        "Q4_due": "January 15",
        "amount_each": quarterly
    }
```

## Reports

### Financial Reports

```bash
# Profit & Loss
/accountant report pnl --period 2024

# Balance Sheet
/accountant report balance --date 2024-12-31

# Cash Flow
/accountant report cashflow --period Q4-2024

# Tax Summary
/accountant report tax --year 2024
```

### Tax Forms Generated

| Form | Description | Auto-Generated |
|------|-------------|----------------|
| Schedule C | Business Income | Yes |
| Schedule SE | Self-Employment Tax | Yes |
| Schedule A | Itemized Deductions | Yes |
| Schedule D | Capital Gains | Yes |
| Form 1099-NEC | Contractor Payments | Yes |
| Form 8829 | Home Office | Yes |
| 1040-ES | Estimated Tax | Yes |

## Integration with Finance MCP

```python
# Use finance-data MCP for market data
from mcps.finance_data import get_stock_info, get_historical_prices

# Calculate cost basis for investments
def calculate_cost_basis(transactions):
    """FIFO cost basis calculation for tax lots"""
    lots = []
    for tx in transactions:
        if tx.type == "BUY":
            lots.append({"shares": tx.shares, "price": tx.price, "date": tx.date})
        elif tx.type == "SELL":
            # FIFO: sell oldest lots first
            gain = calculate_fifo_gain(lots, tx)
    return lots, gains
```

## Recommended Stack

### Open Source (Free)

| Component | Tool | Purpose |
|-----------|------|---------|
| Accounting | [Firefly III](https://firefly-iii.org/) | Double-entry bookkeeping |
| Bank Import | [Firefly Data Importer](https://docs.firefly-iii.org/data-importer/) | OFX/CSV import |
| Tax Calc | [OpenTaxSolver](https://opentaxsolver.sourceforge.net/) | Federal/state tax math |
| PDF Extract | Tesseract + Claude | Statement parsing |

### Low Cost ($15-50/mo)

| Component | Tool | Purpose |
|-----------|------|---------|
| Accounting | [Akaunting](https://akaunting.com/) | Cloud accounting |
| Bank Sync | [SimpleFIN](https://www.simplefin.org/) | Bank aggregation |
| Tax Filing | [FreeTaxUSA](https://www.freetaxusa.com/) | Federal free, $15 state |

### Self-Hosted Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Claude Code                        │
│                  /accountant skill                   │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼───────┐           ┌───────▼───────┐
│  Firefly III  │           │ Finance MCP   │
│  (Accounting) │           │ (Market Data) │
└───────┬───────┘           └───────────────┘
        │
┌───────▼───────┐
│ Data Importer │
│  (Bank Sync)  │
└───────┬───────┘
        │
┌───────▼───────┐
│  Bank OFX/CSV │
│   Downloads   │
└───────────────┘
```

## Example Workflow

### Monthly Bookkeeping

```bash
# 1. Import bank transactions
/accountant import ~/downloads/chase_*.ofx --account "Business Checking"

# 2. Auto-categorize
/accountant categorize --confidence 0.8 --review-low

# 3. Review flagged transactions
/accountant review --flagged

# 4. Generate monthly P&L
/accountant report pnl --period "November 2024"
```

### Annual Tax Prep

```bash
# 1. Generate tax summary
/accountant tax summary --year 2024

# 2. Calculate Schedule C
/accountant tax schedule-c --year 2024

# 3. Estimate tax liability
/accountant tax estimate --filing-status single

# 4. Generate 1099s for contractors
/accountant tax 1099-nec --year 2024 --min-amount 600

# 5. Export to tax software
/accountant tax export --format turbotax --year 2024
```

## Sources

- [Firefly III](https://firefly-iii.org/) - Open source personal finance
- [Akaunting](https://akaunting.com/) - Free accounting software
- [OpenTaxSolver](https://opentaxsolver.sourceforge.net/) - Open source tax calculator
- [FreeTaxUSA](https://www.freetaxusa.com/) - Free federal tax filing
- [SimpleFIN](https://www.simplefin.org/) - Open banking protocol
