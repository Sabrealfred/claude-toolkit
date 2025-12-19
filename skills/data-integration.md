---
name: data-integration
description: Open-source data integration and ETL/ELT specialist. Use n8n for workflow automation, Airbyte for data pipelines. Free Coupler.io alternative.
---

# Data Integration Skill (Coupler.io Alternative)

Open-source data integration using n8n (automation) and Airbyte (ELT pipelines).

## Quick Comparison: Coupler.io vs Open Source

| Feature | Coupler.io | n8n | Airbyte |
|---------|------------|-----|---------|
| **Cost** | $24+/month | FREE (self-hosted) | FREE (self-hosted) |
| **Connectors** | 200+ | 1,200+ | 600+ |
| **Skill Level** | No-code | Low-code | Developer |
| **Best For** | Quick spreadsheets | Automation workflows | Data warehouses |
| **Self-Host** | No | Yes | Yes |
| **AI Integration** | ChatGPT, Claude | OpenAI, Anthropic | External |

---

## n8n - Workflow Automation

### Docker Installation (Recommended)

```bash
# Quick start with Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n

# With PostgreSQL persistence
docker compose -f docker-compose.yml up -d
```

### docker-compose.yml for n8n

```yaml
version: '3.8'
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8n
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: n8n
      POSTGRES_DB: n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
```

### n8n Key Connectors (Coupler.io Equivalents)

| Category | n8n Nodes |
|----------|-----------|
| **Ads/Marketing** | Facebook Ads, Google Ads, LinkedIn Ads, TikTok Ads |
| **Analytics** | Google Analytics, Mixpanel, Amplitude, PostHog |
| **CRM** | HubSpot, Salesforce, Pipedrive, Zoho CRM |
| **Finance** | Stripe, PayPal, QuickBooks, Xero |
| **E-commerce** | Shopify, WooCommerce, Magento |
| **Spreadsheets** | Google Sheets, Airtable, Excel, Notion |
| **Databases** | PostgreSQL, MySQL, MongoDB, Supabase |
| **AI/ML** | OpenAI, Anthropic, Hugging Face |
| **Communication** | Slack, Discord, Telegram, Email |
| **Project Mgmt** | Asana, Jira, ClickUp, Monday |

### Example: Google Sheets to Supabase

```json
{
  "name": "Sync Google Sheets to Supabase",
  "nodes": [
    {
      "name": "Google Sheets Trigger",
      "type": "n8n-nodes-base.googleSheetsTrigger",
      "parameters": {
        "sheetId": "YOUR_SHEET_ID",
        "sheetName": "Sheet1"
      }
    },
    {
      "name": "Transform Data",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "return items.map(item => ({ json: { ...item.json, synced_at: new Date().toISOString() } }));"
      }
    },
    {
      "name": "Supabase Insert",
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "insert",
        "tableId": "synced_data"
      }
    }
  ]
}
```

### Example: HubSpot to Google Sheets

```json
{
  "name": "Export HubSpot Contacts to Sheets",
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": { "interval": [{ "field": "hours", "hoursInterval": 1 }] }
      }
    },
    {
      "name": "HubSpot Get Contacts",
      "type": "n8n-nodes-base.hubspot",
      "parameters": {
        "resource": "contact",
        "operation": "getAll"
      }
    },
    {
      "name": "Google Sheets Append",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "appendOrUpdate",
        "sheetId": "YOUR_SHEET_ID"
      }
    }
  ]
}
```

---

## Airbyte - ELT Data Pipelines

### Docker Installation

```bash
# Clone Airbyte
git clone https://github.com/airbytehq/airbyte.git
cd airbyte

# Run with Docker
./run-ab-platform.sh
```

### Access
- URL: http://localhost:8000
- Default credentials: airbyte/password

### Airbyte Key Connectors

| Source Type | Connectors |
|-------------|------------|
| **Databases** | PostgreSQL, MySQL, MongoDB, Snowflake, BigQuery |
| **APIs** | Stripe, Salesforce, HubSpot, Zendesk, Jira |
| **Files** | S3, GCS, Azure Blob, SFTP, Local Files |
| **Marketing** | Facebook Ads, Google Ads, LinkedIn, TikTok |
| **Analytics** | Google Analytics 4, Amplitude, Mixpanel |
| **E-commerce** | Shopify, Amazon, WooCommerce |

### Destinations

| Destination | Type |
|-------------|------|
| **Warehouses** | BigQuery, Snowflake, Redshift, Databricks |
| **Databases** | PostgreSQL, MySQL, ClickHouse |
| **Lakes** | S3, GCS, Azure, Delta Lake |
| **Local** | Local JSON, CSV, Parquet |

---

## Coupler.io Feature Mapping

### Data Sources → n8n/Airbyte Equivalent

| Coupler.io Source | n8n Node | Airbyte Connector |
|-------------------|----------|-------------------|
| Facebook Ads | n8n-nodes-base.facebookAds | source-facebook-marketing |
| Google Ads | n8n-nodes-base.googleAds | source-google-ads |
| Google Analytics 4 | n8n-nodes-base.googleAnalytics | source-google-analytics-v4 |
| HubSpot | n8n-nodes-base.hubspot | source-hubspot |
| Salesforce | n8n-nodes-base.salesforce | source-salesforce |
| Stripe | n8n-nodes-base.stripe | source-stripe |
| Shopify | n8n-nodes-base.shopify | source-shopify |
| QuickBooks | n8n-nodes-base.quickbooks | source-quickbooks |
| Xero | n8n-nodes-base.xero | source-xero |
| Airtable | n8n-nodes-base.airtable | source-airtable |
| Notion | n8n-nodes-base.notion | source-notion |
| Jira | n8n-nodes-base.jira | source-jira |
| Asana | n8n-nodes-base.asana | source-asana |
| Slack | n8n-nodes-base.slack | source-slack |
| PostgreSQL | n8n-nodes-base.postgres | source-postgres |
| MySQL | n8n-nodes-base.mySql | source-mysql |
| MongoDB | n8n-nodes-base.mongoDb | source-mongodb-v2 |

### Data Destinations → Equivalent

| Coupler.io Dest | n8n Node | Airbyte Destination |
|-----------------|----------|---------------------|
| Google Sheets | n8n-nodes-base.googleSheets | destination-google-sheets |
| BigQuery | n8n-nodes-base.googleBigQuery | destination-bigquery |
| PostgreSQL | n8n-nodes-base.postgres | destination-postgres |
| Excel | n8n-nodes-base.microsoftExcel | destination-csv (export) |
| Looker Studio | Via Sheets/BigQuery | Via BigQuery |
| Power BI | Via database | Via database |

---

## n8n vs Airbyte: When to Use What

| Scenario | Use n8n | Use Airbyte |
|----------|---------|-------------|
| **Real-time triggers** | ✅ | ❌ |
| **Complex transformations** | ✅ | ❌ |
| **Scheduled data sync** | ✅ | ✅ |
| **Large data volumes** | ❌ | ✅ |
| **Data warehouse loading** | ❌ | ✅ |
| **Multi-step workflows** | ✅ | ❌ |
| **API-first automation** | ✅ | ❌ |
| **CDC (Change Data Capture)** | ❌ | ✅ |

### Recommendation

- **Use n8n** for: Automation workflows, triggers, transformations, API integrations
- **Use Airbyte** for: Bulk data sync, warehouse loading, scheduled ETL/ELT

---

## Combined Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                            │
├─────────────────────────────────────────────────────────────┤
│ Ads: Facebook, Google, LinkedIn, TikTok                     │
│ CRM: HubSpot, Salesforce, Pipedrive                         │
│ Finance: Stripe, QuickBooks, Xero                           │
│ Analytics: GA4, Mixpanel, PostHog                           │
│ E-commerce: Shopify, WooCommerce                            │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│      n8n        │     │    Airbyte      │
│ (Real-time +    │     │ (Batch ELT +    │
│  Automation)    │     │  Data Sync)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Warehouse                            │
├─────────────────────────────────────────────────────────────┤
│ Supabase PostgreSQL / BigQuery / Snowflake                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BI Dashboard                              │
├─────────────────────────────────────────────────────────────┤
│ Apache Superset / Metabase / Tremor React Dashboard         │
└─────────────────────────────────────────────────────────────┘
```

---

## n8n AI Integration

### OpenAI Node

```javascript
// n8n Code Node with OpenAI
const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.openai.com/v1/chat/completions',
  headers: {
    'Authorization': `Bearer ${$credentials.openAiApi.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: {
    model: 'gpt-4',
    messages: [
      { role: 'user', content: $input.first().json.text }
    ],
  },
});

return [{ json: { response: response.choices[0].message.content } }];
```

### Claude (Anthropic) Node

```javascript
// n8n Code Node with Claude
const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.anthropic.com/v1/messages',
  headers: {
    'x-api-key': $credentials.anthropicApi.apiKey,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  },
  body: {
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: $input.first().json.text }
    ],
  },
});

return [{ json: { response: response.content[0].text } }];
```

---

## Custom Connectors

### n8n Custom Node (HTTP Request)

```javascript
// For any API without a dedicated node
{
  "name": "Custom API",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://api.example.com/data",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "options": {
      "response": { "response": { "responseFormat": "json" } }
    }
  }
}
```

### Airbyte Custom Connector (Low-Code CDK)

```yaml
# source.yaml
version: "0.29.0"

definitions:
  requester:
    url_base: "https://api.example.com"
    http_method: "GET"
    authenticator:
      type: "BearerAuthenticator"
      api_token: "{{ config['api_key'] }}"

  retriever:
    record_selector:
      extractor:
        field_path: ["data"]
    requester:
      $ref: "#/definitions/requester"

  base_stream:
    retriever:
      $ref: "#/definitions/retriever"

streams:
  - $ref: "#/definitions/base_stream"
    name: "users"
    primary_key: "id"
    $parameters:
      path: "/users"

spec:
  connection_specification:
    $schema: http://json-schema.org/draft-07/schema#
    type: object
    required:
      - api_key
    properties:
      api_key:
        type: string
        airbyte_secret: true
```

---

## Cost Comparison

| Solution | Monthly Cost | Setup Time | Maintenance |
|----------|-------------|------------|-------------|
| **Coupler.io** | $24-199/month | Minutes | None |
| **n8n Cloud** | $20+/month | Minutes | None |
| **n8n Self-Host** | $0 (server cost) | 30 min | Low |
| **Airbyte Cloud** | $0-500+/month | Minutes | None |
| **Airbyte Self-Host** | $0 (server cost) | 1 hour | Medium |

### Recommended Stack (FREE)

1. **Digital Ocean Droplet** ($6/month) or local server
2. **n8n** (for workflows & automation)
3. **Airbyte** (for bulk data sync)
4. **Supabase** (as data warehouse - free tier)
5. **Metabase/Superset** (for BI dashboards)

---

## Quick Start Workflows

### 1. Marketing Data Sync

```
Google Ads → n8n (daily trigger) → Transform → Supabase
Facebook Ads → n8n (daily trigger) → Transform → Supabase
LinkedIn Ads → n8n (daily trigger) → Transform → Supabase
```

### 2. CRM Integration

```
HubSpot Webhook → n8n → Enrich with Clearbit → Supabase → Slack notification
```

### 3. E-commerce Analytics

```
Shopify → Airbyte (hourly sync) → PostgreSQL → Apache Superset Dashboard
```

### 4. Finance Reporting

```
Stripe → Airbyte → BigQuery ← Looker Studio (reports)
QuickBooks → Airbyte ↗
```

---

## Integration with Other Skills

- **bi-dashboard**: Visualize integrated data
- **supabase-expert**: Store and query data
- **devops**: Deploy n8n/Airbyte containers
- **multi-agent-patterns**: AI-powered data processing
- **pm-status**: Project data aggregation

---

## References

- [n8n Documentation](https://docs.n8n.io/)
- [n8n 1,200+ Integrations](https://n8n.io/integrations/)
- [Airbyte Connectors](https://docs.airbyte.com/integrations)
- [Airbyte GitHub](https://github.com/airbytehq/airbyte)

---

*Use this skill when building: data pipelines, automation workflows, ETL/ELT systems, marketing analytics, CRM integrations, or any data synchronization needs without paid tools like Coupler.io.*