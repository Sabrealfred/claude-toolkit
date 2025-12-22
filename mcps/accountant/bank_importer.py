#!/usr/bin/env python3
"""
Bank Transaction Importer

Imports bank transactions from:
- OFX/QFX files (Quicken format)
- CSV files (with column mapping)
- PDF statements (with OCR)

Auto-categorizes using AI rules.
"""

import os
import re
import csv
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

# OFX parsing
try:
    from ofxparse import OfxParser
    HAS_OFX = True
except ImportError:
    HAS_OFX = False
    print("Warning: ofxparse not installed. Run: pip install ofxparse")

# PDF parsing
try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False


@dataclass
class Transaction:
    """Normalized transaction record"""
    date: str
    description: str
    amount: float
    category: Optional[str] = None
    account: Optional[str] = None
    transaction_id: Optional[str] = None
    memo: Optional[str] = None
    payee: Optional[str] = None
    confidence: float = 0.0
    needs_review: bool = False


# IRS Schedule C Categories for business expenses
CATEGORY_RULES = [
    # Advertising & Marketing
    {"patterns": ["GOOGLE ADS", "META ADS", "FACEBOOK ADS", "LINKEDIN ADS", "TWITTER ADS",
                  "MAILCHIMP", "HUBSPOT", "CONSTANT CONTACT", "HOOTSUITE"],
     "category": "advertising", "confidence": 0.95},

    # Office & Software
    {"patterns": ["AWS", "AMAZON WEB", "AZURE", "GOOGLE CLOUD", "DIGITALOCEAN", "HEROKU",
                  "GITHUB", "GITLAB", "ATLASSIAN", "JIRA", "SLACK", "ZOOM", "MICROSOFT 365",
                  "ADOBE", "FIGMA", "NOTION", "AIRTABLE", "DROPBOX", "GOOGLE WORKSPACE"],
     "category": "office_expense", "confidence": 0.9},

    # Contract Labor / Fees
    {"patterns": ["STRIPE FEE", "PAYPAL FEE", "SQUARE FEE", "UPWORK", "FIVERR", "TOPTAL"],
     "category": "contract_labor", "confidence": 0.9},

    # Legal & Professional
    {"patterns": ["LAW OFFICE", "ATTORNEY", "CPA", "ACCOUNTANT", "QUICKBOOKS", "XERO",
                  "FRESHBOOKS", "GUSTO FEE", "JUSTWORKS"],
     "category": "legal_professional", "confidence": 0.85},

    # Travel
    {"patterns": ["UNITED AIRLINES", "DELTA", "AMERICAN AIR", "SOUTHWEST", "JETBLUE",
                  "MARRIOTT", "HILTON", "HYATT", "AIRBNB", "EXPEDIA", "KAYAK"],
     "category": "travel", "confidence": 0.85},

    # Car & Transportation
    {"patterns": ["UBER", "LYFT", "HERTZ", "ENTERPRISE RENT", "AVIS", "SHELL", "CHEVRON",
                  "EXXON", "BP ", "PARKING"],
     "category": "car_truck", "confidence": 0.8},

    # Meals (50% deductible)
    {"patterns": ["DOORDASH", "UBER EATS", "GRUBHUB", "RESTAURANT", "CAFE", "COFFEE",
                  "STARBUCKS", "CHIPOTLE", "PANERA"],
     "category": "meals", "confidence": 0.7},

    # Insurance
    {"patterns": ["INSURANCE", "GEICO", "PROGRESSIVE", "STATE FARM", "ALLSTATE",
                  "TRAVELERS", "HARTFORD"],
     "category": "insurance", "confidence": 0.85},

    # Utilities
    {"patterns": ["AT&T", "VERIZON", "T-MOBILE", "COMCAST", "SPECTRUM", "CON EDISON",
                  "PG&E", "DUKE ENERGY", "ELECTRIC", "GAS COMPANY", "WATER UTILITY"],
     "category": "utilities", "confidence": 0.85},

    # Rent
    {"patterns": ["RENT", "LEASE PMT", "REGUS", "WEWORK", "INDUSTRIOUS"],
     "category": "rent_lease_property", "confidence": 0.8},

    # Supplies
    {"patterns": ["OFFICE DEPOT", "STAPLES", "AMAZON", "AMZN", "BEST BUY", "B&H PHOTO",
                  "NEWEGG", "COSTCO", "SAM'S CLUB"],
     "category": "supplies", "confidence": 0.6},  # Lower confidence - could be personal

    # Payroll
    {"patterns": ["GUSTO", "ADP", "PAYCHEX", "PAYROLL", "PAYCOM", "RIPPLING"],
     "category": "wages", "confidence": 0.95},

    # Banking & Interest
    {"patterns": ["INTEREST CHARGE", "FINANCE CHARGE", "LOAN PMT"],
     "category": "interest_other", "confidence": 0.9},

    # Taxes & Licenses
    {"patterns": ["IRS", "FRANCHISE TAX", "STATE TAX", "BUSINESS LICENSE", "PERMIT"],
     "category": "taxes_licenses", "confidence": 0.9},
]

# Personal categories
PERSONAL_RULES = [
    {"patterns": ["SALARY", "PAYROLL", "DIRECT DEP"], "category": "wages_income", "confidence": 0.95},
    {"patterns": ["DIVIDEND", "DIV PAYMENT"], "category": "dividend_income", "confidence": 0.9},
    {"patterns": ["INTEREST PAID"], "category": "interest_income", "confidence": 0.9},
    {"patterns": ["CHARITY", "DONATION", "UNITED WAY", "RED CROSS"], "category": "charitable", "confidence": 0.85},
    {"patterns": ["DOCTOR", "HOSPITAL", "PHARMACY", "CVS PHARM", "WALGREENS", "MEDICAL"],
     "category": "medical_dental", "confidence": 0.8},
    {"patterns": ["MORTGAGE", "HOME LOAN"], "category": "mortgage_interest", "confidence": 0.85},
]


def categorize_transaction(description: str, amount: float,
                          mode: str = "business") -> tuple:
    """
    Categorize transaction based on description patterns.

    Returns: (category, confidence, needs_review)
    """
    description_upper = description.upper()
    rules = CATEGORY_RULES if mode == "business" else PERSONAL_RULES

    for rule in rules:
        for pattern in rule["patterns"]:
            if pattern in description_upper:
                return (rule["category"], rule["confidence"], rule["confidence"] < 0.8)

    # No match found
    return ("uncategorized", 0.0, True)


def parse_ofx(file_path: str, account_name: str = None) -> List[Transaction]:
    """Parse OFX/QFX file and return normalized transactions"""
    if not HAS_OFX:
        raise ImportError("ofxparse required: pip install ofxparse")

    transactions = []

    with open(file_path, 'rb') as f:
        ofx = OfxParser.parse(f)

    for account in ofx.accounts:
        acct_name = account_name or account.account_id

        for tx in account.statement.transactions:
            category, confidence, needs_review = categorize_transaction(
                tx.memo or tx.payee or "",
                float(tx.amount)
            )

            transactions.append(Transaction(
                date=tx.date.strftime("%Y-%m-%d"),
                description=tx.memo or tx.payee or "Unknown",
                amount=float(tx.amount),
                category=category,
                account=acct_name,
                transaction_id=tx.id,
                payee=tx.payee,
                confidence=confidence,
                needs_review=needs_review
            ))

    return transactions


def parse_csv(file_path: str, column_map: Dict[str, str],
              account_name: str = None) -> List[Transaction]:
    """
    Parse CSV file with custom column mapping.

    column_map example: {"date": "Date", "description": "Description", "amount": "Amount"}
    """
    transactions = []

    with open(file_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Get values using column map
            date_str = row.get(column_map.get("date", "Date"), "")
            desc = row.get(column_map.get("description", "Description"), "")
            amount_str = row.get(column_map.get("amount", "Amount"), "0")

            # Parse amount (handle various formats)
            amount_str = amount_str.replace("$", "").replace(",", "").strip()
            if amount_str.startswith("(") and amount_str.endswith(")"):
                amount_str = "-" + amount_str[1:-1]

            try:
                amount = float(amount_str)
            except ValueError:
                continue

            # Parse date (try common formats)
            date = None
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y"]:
                try:
                    date = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    continue

            if not date:
                continue

            category, confidence, needs_review = categorize_transaction(desc, amount)

            transactions.append(Transaction(
                date=date.strftime("%Y-%m-%d"),
                description=desc,
                amount=amount,
                category=category,
                account=account_name or Path(file_path).stem,
                confidence=confidence,
                needs_review=needs_review
            ))

    return transactions


def detect_csv_columns(file_path: str) -> Dict[str, str]:
    """Auto-detect CSV column mapping"""
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames

    column_map = {}

    # Date column patterns
    for h in headers:
        h_lower = h.lower()
        if "date" in h_lower or "posted" in h_lower:
            column_map["date"] = h
            break

    # Description patterns
    for h in headers:
        h_lower = h.lower()
        if any(p in h_lower for p in ["description", "memo", "details", "payee", "name"]):
            column_map["description"] = h
            break

    # Amount patterns
    for h in headers:
        h_lower = h.lower()
        if any(p in h_lower for p in ["amount", "debit", "credit", "value"]):
            column_map["amount"] = h
            break

    return column_map


def generate_summary(transactions: List[Transaction]) -> Dict:
    """Generate summary report of imported transactions"""
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = sum(t.amount for t in transactions if t.amount < 0)

    # Group by category
    by_category = {}
    for tx in transactions:
        cat = tx.category or "uncategorized"
        if cat not in by_category:
            by_category[cat] = {"count": 0, "total": 0.0}
        by_category[cat]["count"] += 1
        by_category[cat]["total"] += tx.amount

    # Transactions needing review
    needs_review = [t for t in transactions if t.needs_review]

    return {
        "total_transactions": len(transactions),
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net": round(total_income + total_expenses, 2),
        "by_category": {k: {"count": v["count"], "total": round(v["total"], 2)}
                       for k, v in sorted(by_category.items(), key=lambda x: x[1]["total"])},
        "needs_review_count": len(needs_review),
        "date_range": {
            "start": min(t.date for t in transactions) if transactions else None,
            "end": max(t.date for t in transactions) if transactions else None
        }
    }


def export_to_json(transactions: List[Transaction], output_path: str):
    """Export transactions to JSON file"""
    data = [asdict(t) for t in transactions]
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    return output_path


def export_to_csv(transactions: List[Transaction], output_path: str):
    """Export transactions to CSV file"""
    if not transactions:
        return None

    fieldnames = list(asdict(transactions[0]).keys())

    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for tx in transactions:
            writer.writerow(asdict(tx))

    return output_path


# CLI Interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("""
Bank Transaction Importer

Usage:
    python bank_importer.py <file.ofx|file.csv> [--account NAME] [--output FILE]

Examples:
    python bank_importer.py checking.ofx --account "Chase Checking"
    python bank_importer.py transactions.csv --output categorized.json
""")
        sys.exit(1)

    file_path = sys.argv[1]
    account_name = None
    output_path = None

    # Parse arguments
    args = sys.argv[2:]
    for i, arg in enumerate(args):
        if arg == "--account" and i + 1 < len(args):
            account_name = args[i + 1]
        elif arg == "--output" and i + 1 < len(args):
            output_path = args[i + 1]

    # Detect file type and parse
    ext = Path(file_path).suffix.lower()

    if ext in [".ofx", ".qfx"]:
        transactions = parse_ofx(file_path, account_name)
    elif ext == ".csv":
        column_map = detect_csv_columns(file_path)
        print(f"Detected columns: {column_map}")
        transactions = parse_csv(file_path, column_map, account_name)
    else:
        print(f"Unsupported file type: {ext}")
        sys.exit(1)

    # Generate summary
    summary = generate_summary(transactions)
    print(f"\n=== Import Summary ===")
    print(f"Total transactions: {summary['total_transactions']}")
    print(f"Date range: {summary['date_range']['start']} to {summary['date_range']['end']}")
    print(f"Total income: ${summary['total_income']:,.2f}")
    print(f"Total expenses: ${summary['total_expenses']:,.2f}")
    print(f"Net: ${summary['net']:,.2f}")
    print(f"\nNeeds review: {summary['needs_review_count']} transactions")

    print(f"\n=== By Category ===")
    for cat, data in summary["by_category"].items():
        print(f"  {cat}: {data['count']} txns, ${data['total']:,.2f}")

    # Export if requested
    if output_path:
        if output_path.endswith(".json"):
            export_to_json(transactions, output_path)
        else:
            export_to_csv(transactions, output_path)
        print(f"\nExported to: {output_path}")
