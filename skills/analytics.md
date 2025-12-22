# Analytics Skill

> Website analytics and reporting using Google Analytics 4 MCP.

## Overview

This skill provides access to Google Analytics 4 data for websites. You can query traffic, user behavior, conversions, and generate reports similar to the Squarespace analytics dashboard.

## Prerequisites

### MCP Server Required
The `ga4-analytics` MCP server must be configured. Check with:
```bash
claude mcp list | grep ga4
```

If not configured, see [Setup Instructions](#setup-instructions) below.

## Available Reports

### Traffic Overview
Ask for:
- "Show me traffic for the last 7 days"
- "Compare this week vs last week"
- "What are my top pages?"

### User Behavior
- "Where are my visitors coming from?"
- "What devices are people using?"
- "What's my bounce rate?"

### Conversions & Goals
- "How many form submissions this month?"
- "What's my conversion rate?"
- "Show goal completions"

### Real-time
- "How many users are on the site right now?"
- "What pages are being viewed live?"

## Common Queries

### Daily Summary
```
Give me a summary of today's analytics:
- Total users and sessions
- Top 5 pages
- Traffic sources breakdown
- Device breakdown
```

### Weekly Report (like Squarespace)
```
Generate a weekly analytics report:
- Total visits vs last week
- Unique visitors
- Page views
- Average time on site
- Top referrers
- Top pages
- Geographic breakdown
```

### Monthly Performance
```
Monthly analytics summary:
- Month-over-month comparison
- Traffic trends
- Best performing content
- Conversion metrics
```

## Metrics Available

| Category | Metrics |
|----------|---------|
| **Users** | activeUsers, newUsers, totalUsers, returningUsers |
| **Sessions** | sessions, engagedSessions, sessionsPerUser |
| **Pageviews** | screenPageViews, screenPageViewsPerSession |
| **Engagement** | averageSessionDuration, bounceRate, engagementRate |
| **Events** | eventCount, conversions, eventValue |

## Dimensions Available

| Category | Dimensions |
|----------|------------|
| **Time** | date, dateHour, dayOfWeek, month, year |
| **Source** | source, medium, sourceMedium, campaign |
| **Geography** | country, city, region, continent |
| **Technology** | deviceCategory, browser, operatingSystem |
| **Pages** | pagePath, pageTitle, landingPage |

## Example Prompts

### For Matwal.com
```
Show me matwal.com analytics for the last 30 days:
- How many visitors?
- Top 10 pages viewed
- Where is traffic coming from?
- Mobile vs desktop breakdown
```

### Compare Periods
```
Compare December vs November for matwal.com:
- Traffic difference
- User engagement changes
- Top growing pages
```

### SEO Analysis
```
Analyze organic search traffic:
- Top landing pages from Google
- Keywords driving traffic
- Organic vs paid breakdown
```

---

## Setup Instructions

### 1. Install MCP Server
```bash
pip install google-analytics-mcp
```

### 2. Create Service Account

In Google Cloud Console:
1. Go to IAM & Admin > Service Accounts
2. Create new service account: `ga4-mcp-reader`
3. Download JSON key file
4. Save to: `/root/.config/ga4-service-account.json`

### 3. Add to Google Analytics

In Google Analytics 4:
1. Go to Admin > Property Access Management
2. Add the service account email
3. Grant "Viewer" role

### 4. Find Your Property ID

In Google Analytics 4:
1. Go to Admin > Property Settings
2. Copy the Property ID (numeric, e.g., `123456789`)

### 5. Configure MCP

```bash
claude mcp add ga4-analytics \
  -e GOOGLE_APPLICATION_CREDENTIALS=/root/.config/ga4-service-account.json \
  -e GA4_PROPERTY_ID=YOUR_PROPERTY_ID \
  -- python3 -m ga4_mcp_server
```

### 6. Verify Setup
```bash
claude mcp list
# Should show: ga4-analytics
```

---

## Troubleshooting

### "Permission denied"
- Verify service account has Viewer access in GA4
- Check the Property ID is correct

### "API not enabled"
```bash
gcloud services enable analyticsdata.googleapis.com
```

### "No data returned"
- Confirm the property has data
- Check date range isn't in the future

---

## Quick Reference

| What You Want | Ask For |
|---------------|---------|
| Today's traffic | "Show today's analytics" |
| Weekly summary | "Weekly analytics report" |
| Top pages | "What are my most viewed pages?" |
| Traffic sources | "Where is my traffic coming from?" |
| Mobile users | "Mobile vs desktop breakdown" |
| Bounce rate | "What's my bounce rate?" |
| Real-time users | "How many users right now?" |
| Geographic data | "Show visitors by country" |
