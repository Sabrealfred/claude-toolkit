#!/bin/bash
# Setup Google Analytics 4 MCP for Claude Code
# Usage: ./setup-ga4-mcp.sh

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       Google Analytics 4 MCP Setup for Claude Code       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    exit 1
fi

if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code CLI not found"
    exit 1
fi

echo "✅ All prerequisites found"
echo ""

# Check gcloud auth
echo "Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1; then
    echo "⚠️  Not authenticated with gcloud"
    echo "Run: gcloud auth login"
    exit 1
fi
echo ""

# Get project
PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT" ]; then
    echo "Enter your Google Cloud Project ID:"
    read -r PROJECT
    gcloud config set project "$PROJECT"
fi
echo "Using project: $PROJECT"
echo ""

# Enable APIs
echo "Enabling Analytics APIs..."
gcloud services enable analyticsdata.googleapis.com analyticsadmin.googleapis.com
echo "✅ APIs enabled"
echo ""

# Create service account
SA_NAME="ga4-mcp-reader"
SA_EMAIL="$SA_NAME@$PROJECT.iam.gserviceaccount.com"
KEY_FILE="$HOME/.config/ga4-service-account.json"

echo "Creating service account: $SA_NAME..."
if gcloud iam service-accounts describe "$SA_EMAIL" &>/dev/null; then
    echo "Service account already exists"
else
    gcloud iam service-accounts create "$SA_NAME" \
        --display-name="GA4 MCP Reader" \
        --description="Service account for Google Analytics 4 MCP"
    echo "✅ Service account created"
fi
echo ""

# Create key
echo "Creating service account key..."
mkdir -p "$HOME/.config"
if [ -f "$KEY_FILE" ]; then
    echo "Key file already exists at: $KEY_FILE"
    read -p "Overwrite? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing key"
    else
        gcloud iam service-accounts keys create "$KEY_FILE" \
            --iam-account="$SA_EMAIL"
        echo "✅ New key created"
    fi
else
    gcloud iam service-accounts keys create "$KEY_FILE" \
        --iam-account="$SA_EMAIL"
    echo "✅ Key created at: $KEY_FILE"
fi
echo ""

# Get GA4 Property ID
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  GA4 Property Setup                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "You need to:"
echo "1. Go to Google Analytics: https://analytics.google.com"
echo "2. Select your property (matwal.com)"
echo "3. Go to Admin > Property Settings"
echo "4. Copy the PROPERTY ID (numeric, e.g., 123456789)"
echo ""
echo "5. Go to Admin > Property Access Management"
echo "6. Click + Add users"
echo "7. Add this email: $SA_EMAIL"
echo "8. Grant 'Viewer' role"
echo ""
read -p "Enter your GA4 Property ID: " GA4_PROPERTY_ID

if [ -z "$GA4_PROPERTY_ID" ]; then
    echo "❌ Property ID required"
    exit 1
fi
echo ""

# Install MCP server
echo "Installing Google Analytics MCP..."
pip install google-analytics-mcp --quiet
echo "✅ MCP server installed"
echo ""

# Configure Claude Code MCP
echo "Configuring Claude Code MCP..."
claude mcp add ga4-analytics \
    -e GOOGLE_APPLICATION_CREDENTIALS="$KEY_FILE" \
    -e GA4_PROPERTY_ID="$GA4_PROPERTY_ID" \
    -- python3 -m ga4_mcp_server

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Configuration:"
echo "  Service Account: $SA_EMAIL"
echo "  Key File: $KEY_FILE"
echo "  Property ID: $GA4_PROPERTY_ID"
echo ""
echo "Verify with: claude mcp list"
echo ""
echo "Try asking Claude:"
echo '  "Show me analytics for the last 7 days"'
echo ""
