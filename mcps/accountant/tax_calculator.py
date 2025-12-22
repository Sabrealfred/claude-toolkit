#!/usr/bin/env python3
"""
US Tax Calculator

Calculates federal and state income taxes for:
- Individuals (W-2, 1099, investments)
- Self-employed (Schedule C)
- Partnerships/S-Corps (Schedule K-1)

Tax year: 2024 (update annually)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum
import json


class FilingStatus(Enum):
    SINGLE = "single"
    MARRIED_JOINT = "married_joint"
    MARRIED_SEPARATE = "married_separate"
    HEAD_HOUSEHOLD = "head_household"
    WIDOW = "qualifying_widow"


# ============================================
# 2024 TAX TABLES (Update these annually)
# ============================================

# Federal Tax Brackets 2024
FEDERAL_BRACKETS = {
    FilingStatus.SINGLE: [
        (11600, 0.10),
        (47150, 0.12),
        (100525, 0.22),
        (191950, 0.24),
        (243725, 0.32),
        (609350, 0.35),
        (float('inf'), 0.37)
    ],
    FilingStatus.MARRIED_JOINT: [
        (23200, 0.10),
        (94300, 0.12),
        (201050, 0.22),
        (383900, 0.24),
        (487450, 0.32),
        (731200, 0.35),
        (float('inf'), 0.37)
    ],
    FilingStatus.MARRIED_SEPARATE: [
        (11600, 0.10),
        (47150, 0.12),
        (100525, 0.22),
        (191950, 0.24),
        (243725, 0.32),
        (365600, 0.35),
        (float('inf'), 0.37)
    ],
    FilingStatus.HEAD_HOUSEHOLD: [
        (16550, 0.10),
        (63100, 0.12),
        (100500, 0.22),
        (191950, 0.24),
        (243700, 0.32),
        (609350, 0.35),
        (float('inf'), 0.37)
    ]
}

# Standard Deduction 2024
STANDARD_DEDUCTION = {
    FilingStatus.SINGLE: 14600,
    FilingStatus.MARRIED_JOINT: 29200,
    FilingStatus.MARRIED_SEPARATE: 14600,
    FilingStatus.HEAD_HOUSEHOLD: 21900,
    FilingStatus.WIDOW: 29200
}

# Additional deduction for age 65+ or blind
ADDITIONAL_DEDUCTION = {
    FilingStatus.SINGLE: 1950,
    FilingStatus.MARRIED_JOINT: 1550,
    FilingStatus.MARRIED_SEPARATE: 1550,
    FilingStatus.HEAD_HOUSEHOLD: 1950
}

# Capital Gains Tax Rates 2024
LTCG_BRACKETS = {
    FilingStatus.SINGLE: [
        (47025, 0.00),    # 0% up to $47,025
        (518900, 0.15),   # 15% up to $518,900
        (float('inf'), 0.20)  # 20% above
    ],
    FilingStatus.MARRIED_JOINT: [
        (94050, 0.00),
        (583750, 0.15),
        (float('inf'), 0.20)
    ]
}

# Net Investment Income Tax (NIIT) - 3.8%
NIIT_THRESHOLD = {
    FilingStatus.SINGLE: 200000,
    FilingStatus.MARRIED_JOINT: 250000,
    FilingStatus.MARRIED_SEPARATE: 125000,
    FilingStatus.HEAD_HOUSEHOLD: 200000
}

# Self-Employment Tax
SE_TAX_RATE = 0.153  # 15.3% (12.4% SS + 2.9% Medicare)
SS_WAGE_BASE = 168600  # 2024 Social Security wage base
MEDICARE_ADDITIONAL_RATE = 0.009  # Additional 0.9% over $200k

# State Tax Rates (simplified - top marginal rates)
STATE_TAX_RATES = {
    "CA": 0.133,  # California top rate
    "NY": 0.109,  # New York top rate
    "TX": 0.00,   # No state income tax
    "FL": 0.00,   # No state income tax
    "WA": 0.00,   # No state income tax
    "NV": 0.00,   # No state income tax
    "WY": 0.00,   # No state income tax
    "SD": 0.00,   # No state income tax
    "AK": 0.00,   # No state income tax
    "TN": 0.00,   # No state income tax
    "NH": 0.00,   # No state income tax (interest/dividends only)
    "NJ": 0.1075, # New Jersey
    "MA": 0.09,   # Massachusetts (flat)
    "IL": 0.0495, # Illinois (flat)
    "PA": 0.0307, # Pennsylvania (flat)
    "AZ": 0.025,  # Arizona (flat)
    "CO": 0.044,  # Colorado (flat)
    "GA": 0.0549, # Georgia
    "NC": 0.0525, # North Carolina (flat)
    "VA": 0.0575, # Virginia
    "OH": 0.0399, # Ohio top rate
    "MI": 0.0425, # Michigan (flat)
    "MN": 0.0985, # Minnesota top rate
    "OR": 0.099,  # Oregon top rate
    "HI": 0.11,   # Hawaii top rate
}

# SALT Cap (State and Local Tax Deduction)
SALT_CAP = 10000


@dataclass
class TaxInput:
    """Input for tax calculation"""
    # Income
    wages: float = 0.0              # W-2 wages
    self_employment: float = 0.0    # Schedule C net profit
    interest: float = 0.0           # Interest income
    dividends_qualified: float = 0.0  # Qualified dividends
    dividends_ordinary: float = 0.0   # Ordinary dividends
    short_term_gains: float = 0.0   # Short-term capital gains
    long_term_gains: float = 0.0    # Long-term capital gains
    rental_income: float = 0.0      # Rental income (net)
    k1_income: float = 0.0          # Partnership/S-Corp income
    other_income: float = 0.0       # Other income

    # Deductions
    mortgage_interest: float = 0.0
    property_tax: float = 0.0
    state_tax_paid: float = 0.0
    charitable: float = 0.0
    medical: float = 0.0

    # Retirement contributions
    traditional_401k: float = 0.0   # Pre-tax 401k
    traditional_ira: float = 0.0    # Traditional IRA
    hsa: float = 0.0                # HSA contribution

    # Credits
    children_under_17: int = 0
    children_17_plus: int = 0
    education_expenses: float = 0.0

    # Filing info
    filing_status: FilingStatus = FilingStatus.SINGLE
    state: str = "CA"
    age_65_plus: bool = False
    spouse_age_65_plus: bool = False


@dataclass
class TaxResult:
    """Output from tax calculation"""
    # AGI
    gross_income: float
    adjustments: float
    agi: float

    # Taxable income
    deductions: float
    deduction_type: str  # "standard" or "itemized"
    taxable_income: float

    # Federal tax
    federal_tax_ordinary: float
    federal_tax_ltcg: float
    federal_tax_total: float
    effective_rate: float
    marginal_rate: float

    # Self-employment tax
    se_tax: float
    se_deduction: float

    # State tax
    state_tax: float
    state: str

    # Credits
    child_tax_credit: float
    education_credits: float
    total_credits: float

    # Final amounts
    total_tax: float
    tax_after_credits: float

    # Quarterly estimates
    quarterly_estimate: float

    # Breakdown
    breakdown: Dict


def calculate_federal_tax(taxable_income: float,
                          filing_status: FilingStatus) -> Tuple[float, float]:
    """
    Calculate federal income tax on ordinary income.
    Returns: (tax_amount, marginal_rate)
    """
    brackets = FEDERAL_BRACKETS.get(filing_status, FEDERAL_BRACKETS[FilingStatus.SINGLE])

    tax = 0.0
    prev_bracket = 0
    marginal_rate = 0.10

    for bracket_max, rate in brackets:
        if taxable_income <= prev_bracket:
            break

        taxable_in_bracket = min(taxable_income, bracket_max) - prev_bracket
        tax += taxable_in_bracket * rate
        marginal_rate = rate
        prev_bracket = bracket_max

    return tax, marginal_rate


def calculate_ltcg_tax(ltcg: float, qualified_dividends: float,
                       taxable_income: float,
                       filing_status: FilingStatus) -> float:
    """Calculate tax on long-term capital gains and qualified dividends"""
    total_ltcg = ltcg + qualified_dividends
    if total_ltcg <= 0:
        return 0.0

    brackets = LTCG_BRACKETS.get(filing_status, LTCG_BRACKETS[FilingStatus.SINGLE])

    # LTCG is taxed on top of ordinary income
    ordinary_income = taxable_income - total_ltcg
    tax = 0.0
    prev_bracket = 0

    for bracket_max, rate in brackets:
        if ordinary_income >= bracket_max:
            prev_bracket = bracket_max
            continue

        # Portion of LTCG in this bracket
        bracket_start = max(ordinary_income, prev_bracket)
        bracket_end = min(ordinary_income + total_ltcg, bracket_max)

        if bracket_end > bracket_start:
            tax += (bracket_end - bracket_start) * rate

        prev_bracket = bracket_max

        if bracket_end >= ordinary_income + total_ltcg:
            break

    return tax


def calculate_se_tax(self_employment_income: float) -> Tuple[float, float]:
    """
    Calculate self-employment tax.
    Returns: (se_tax, deduction)
    """
    if self_employment_income <= 0:
        return 0.0, 0.0

    # Net SE income for tax purposes (92.35%)
    net_se = self_employment_income * 0.9235

    # Social Security portion (12.4% up to wage base)
    ss_taxable = min(net_se, SS_WAGE_BASE)
    ss_tax = ss_taxable * 0.124

    # Medicare portion (2.9% on all, plus 0.9% over $200k)
    medicare_tax = net_se * 0.029
    if net_se > 200000:
        medicare_tax += (net_se - 200000) * MEDICARE_ADDITIONAL_RATE

    total_se_tax = ss_tax + medicare_tax

    # Deduction is half of SE tax
    se_deduction = total_se_tax / 2

    return total_se_tax, se_deduction


def calculate_niit(magi: float, investment_income: float,
                   filing_status: FilingStatus) -> float:
    """Calculate Net Investment Income Tax (3.8%)"""
    threshold = NIIT_THRESHOLD.get(filing_status, 200000)

    if magi <= threshold:
        return 0.0

    excess = magi - threshold
    taxable = min(excess, investment_income)

    return taxable * 0.038


def calculate_child_tax_credit(children_under_17: int, children_17_plus: int,
                               agi: float, filing_status: FilingStatus) -> float:
    """Calculate child tax credit (2024)"""
    # $2,000 per child under 17
    credit = children_under_17 * 2000

    # $500 per other dependent
    credit += children_17_plus * 500

    # Phase out thresholds
    threshold = 400000 if filing_status == FilingStatus.MARRIED_JOINT else 200000

    if agi > threshold:
        reduction = ((agi - threshold) // 1000) * 50
        credit = max(0, credit - reduction)

    return credit


def calculate_state_tax(taxable_income: float, state: str) -> float:
    """Calculate state income tax (simplified)"""
    rate = STATE_TAX_RATES.get(state.upper(), 0.05)
    return taxable_income * rate


def calculate_taxes(tax_input: TaxInput) -> TaxResult:
    """Main tax calculation function"""

    # Step 1: Calculate Gross Income
    gross_income = (
        tax_input.wages +
        tax_input.self_employment +
        tax_input.interest +
        tax_input.dividends_qualified +
        tax_input.dividends_ordinary +
        tax_input.short_term_gains +
        tax_input.long_term_gains +
        tax_input.rental_income +
        tax_input.k1_income +
        tax_input.other_income
    )

    # Step 2: Calculate Adjustments (Above-the-line deductions)
    se_tax, se_deduction = calculate_se_tax(tax_input.self_employment)

    adjustments = (
        se_deduction +
        tax_input.traditional_ira +
        tax_input.hsa
    )
    # Note: 401k is already excluded from wages

    # Step 3: Calculate AGI
    agi = gross_income - adjustments

    # Step 4: Calculate Deductions
    standard = STANDARD_DEDUCTION[tax_input.filing_status]

    # Additional deduction for 65+
    if tax_input.age_65_plus:
        standard += ADDITIONAL_DEDUCTION.get(tax_input.filing_status, 1550)
    if tax_input.spouse_age_65_plus and tax_input.filing_status == FilingStatus.MARRIED_JOINT:
        standard += ADDITIONAL_DEDUCTION.get(tax_input.filing_status, 1550)

    # Itemized deductions
    salt = min(tax_input.property_tax + tax_input.state_tax_paid, SALT_CAP)
    medical_deductible = max(0, tax_input.medical - (agi * 0.075))

    itemized = (
        tax_input.mortgage_interest +
        salt +
        tax_input.charitable +
        medical_deductible
    )

    # Use larger of standard or itemized
    if itemized > standard:
        deductions = itemized
        deduction_type = "itemized"
    else:
        deductions = standard
        deduction_type = "standard"

    # Step 5: Calculate Taxable Income
    # Separate ordinary income from preferential income
    preferential_income = tax_input.long_term_gains + tax_input.dividends_qualified

    taxable_income = max(0, agi - deductions)
    ordinary_taxable = max(0, taxable_income - preferential_income)

    # Step 6: Calculate Federal Tax
    federal_ordinary, marginal_rate = calculate_federal_tax(
        ordinary_taxable, tax_input.filing_status
    )

    federal_ltcg = calculate_ltcg_tax(
        tax_input.long_term_gains,
        tax_input.dividends_qualified,
        taxable_income,
        tax_input.filing_status
    )

    federal_total = federal_ordinary + federal_ltcg

    # Step 7: Calculate NIIT
    investment_income = (
        tax_input.interest +
        tax_input.dividends_qualified +
        tax_input.dividends_ordinary +
        tax_input.short_term_gains +
        tax_input.long_term_gains +
        max(0, tax_input.rental_income)
    )
    niit = calculate_niit(agi, investment_income, tax_input.filing_status)

    # Step 8: Calculate State Tax
    state_tax = calculate_state_tax(taxable_income, tax_input.state)

    # Step 9: Calculate Credits
    child_credit = calculate_child_tax_credit(
        tax_input.children_under_17,
        tax_input.children_17_plus,
        agi,
        tax_input.filing_status
    )

    # Education credits (simplified - American Opportunity or Lifetime Learning)
    education_credit = min(tax_input.education_expenses * 0.2, 2000)

    total_credits = child_credit + education_credit

    # Step 10: Final Calculations
    total_tax = federal_total + se_tax + niit + state_tax
    tax_after_credits = max(0, total_tax - total_credits)

    effective_rate = (tax_after_credits / gross_income * 100) if gross_income > 0 else 0

    # Quarterly estimate
    quarterly_estimate = tax_after_credits / 4

    return TaxResult(
        gross_income=round(gross_income, 2),
        adjustments=round(adjustments, 2),
        agi=round(agi, 2),
        deductions=round(deductions, 2),
        deduction_type=deduction_type,
        taxable_income=round(taxable_income, 2),
        federal_tax_ordinary=round(federal_ordinary, 2),
        federal_tax_ltcg=round(federal_ltcg, 2),
        federal_tax_total=round(federal_total, 2),
        effective_rate=round(effective_rate, 2),
        marginal_rate=round(marginal_rate * 100, 1),
        se_tax=round(se_tax, 2),
        se_deduction=round(se_deduction, 2),
        state_tax=round(state_tax, 2),
        state=tax_input.state,
        child_tax_credit=round(child_credit, 2),
        education_credits=round(education_credit, 2),
        total_credits=round(total_credits, 2),
        total_tax=round(total_tax, 2),
        tax_after_credits=round(tax_after_credits, 2),
        quarterly_estimate=round(quarterly_estimate, 2),
        breakdown={
            "federal_ordinary": round(federal_ordinary, 2),
            "federal_ltcg": round(federal_ltcg, 2),
            "se_tax": round(se_tax, 2),
            "niit": round(niit, 2),
            "state_tax": round(state_tax, 2),
            "credits_applied": round(total_credits, 2)
        }
    )


def print_tax_summary(result: TaxResult):
    """Print formatted tax summary"""
    print("\n" + "=" * 50)
    print("           TAX CALCULATION SUMMARY")
    print("=" * 50)

    print(f"\n📊 INCOME")
    print(f"   Gross Income:        ${result.gross_income:>12,.2f}")
    print(f"   Adjustments:         ${result.adjustments:>12,.2f}")
    print(f"   AGI:                 ${result.agi:>12,.2f}")

    print(f"\n📝 DEDUCTIONS ({result.deduction_type})")
    print(f"   Deductions:          ${result.deductions:>12,.2f}")
    print(f"   Taxable Income:      ${result.taxable_income:>12,.2f}")

    print(f"\n💰 FEDERAL TAX")
    print(f"   Ordinary Income:     ${result.federal_tax_ordinary:>12,.2f}")
    print(f"   LTCG/Qual Div:       ${result.federal_tax_ltcg:>12,.2f}")
    print(f"   Total Federal:       ${result.federal_tax_total:>12,.2f}")
    print(f"   Marginal Rate:       {result.marginal_rate:>12.1f}%")

    if result.se_tax > 0:
        print(f"\n👔 SELF-EMPLOYMENT TAX")
        print(f"   SE Tax:              ${result.se_tax:>12,.2f}")
        print(f"   SE Deduction:        ${result.se_deduction:>12,.2f}")

    print(f"\n🏛️ STATE TAX ({result.state})")
    print(f"   State Tax:           ${result.state_tax:>12,.2f}")

    print(f"\n🎁 CREDITS")
    print(f"   Child Tax Credit:    ${result.child_tax_credit:>12,.2f}")
    print(f"   Education Credits:   ${result.education_credits:>12,.2f}")
    print(f"   Total Credits:       ${result.total_credits:>12,.2f}")

    print(f"\n" + "=" * 50)
    print(f"   TOTAL TAX:           ${result.total_tax:>12,.2f}")
    print(f"   Less Credits:        ${result.total_credits:>12,.2f}")
    print(f"   TAX AFTER CREDITS:   ${result.tax_after_credits:>12,.2f}")
    print(f"   Effective Rate:      {result.effective_rate:>12.2f}%")
    print("=" * 50)

    print(f"\n📅 QUARTERLY ESTIMATES")
    print(f"   Q1 (Apr 15):         ${result.quarterly_estimate:>12,.2f}")
    print(f"   Q2 (Jun 15):         ${result.quarterly_estimate:>12,.2f}")
    print(f"   Q3 (Sep 15):         ${result.quarterly_estimate:>12,.2f}")
    print(f"   Q4 (Jan 15):         ${result.quarterly_estimate:>12,.2f}")


# Example usage
if __name__ == "__main__":
    # Example: Self-employed software consultant in California
    tax_input = TaxInput(
        wages=0,
        self_employment=250000,
        interest=1500,
        dividends_qualified=5000,
        long_term_gains=25000,

        mortgage_interest=15000,
        property_tax=8000,
        charitable=5000,

        traditional_401k=23000,  # Solo 401k
        hsa=4150,

        children_under_17=2,

        filing_status=FilingStatus.MARRIED_JOINT,
        state="CA"
    )

    result = calculate_taxes(tax_input)
    print_tax_summary(result)
