# Standalone API Connectors

**Extracted from n8n** - No n8n runtime required!

## Architecture

```
api-connectors/
├── api-client.js          # Core API client (standalone)
├── api-client.ts          # TypeScript version
├── api-registry.js        # Multi-account registry (like gcloud)
├── api-registry.template.js  # Template (safe to share)
├── credentials.local.js   # YOUR CREDENTIALS (DO NOT SHARE!)
├── connectors.json        # Extracted n8n connector metadata
├── examples.js            # Usage examples
└── .gitignore             # Protects credentials.local.js
```

## Quick Start

```javascript
const { getClient, listServices } = require('./api-registry');

// Get a configured client
const asana = getClient('asana');
const tasks = await asana.get('/tasks');

// Use a specific account (like gcloud)
const google = getClient('google', 'christina');

// List all services
const { configured, notConfigured } = listServices();
```

## Current Status

### Configured Services (8)
| Service | Accounts | Default |
|---------|----------|---------|
| supabase | matwal-premium | matwal-premium |
| google | gerardo, christina | gerardo |
| azure | samuel | samuel |
| asana | main | main |
| openrouter | main | main |
| gemini | main | main |
| anthropic | main | main |
| groq | main | main |

### Not Configured (20+)
hubspot, stripe, slack, discord, github, notion, openai, salesforce, shopify, etc.

## Adding New Credentials

1. Edit `credentials.local.js`:

```javascript
module.exports = {
  // Add a new service
  hubspot: {
    _default: 'company1',
    accounts: {
      'company1': { apiKey: 'your-key-here' },
      'company2': { apiKey: 'another-key' },
    }
  },
  // ... existing services
};
```

2. Use it:
```javascript
const hubspot = getClient('hubspot');
const contacts = await hubspot.get('/crm/v3/objects/contacts');

// Switch accounts
const hubspot2 = getClient('hubspot', 'company2');
```

## Multi-Account Support (like gcloud)

```javascript
const { registry, setAccount, getClient } = require('./api-registry');

// List accounts for a service
registry.listAccounts('google');
// { service: 'google', accounts: [{ name: 'gerardo', active: true }, { name: 'christina', active: false }] }

// Switch active account
setAccount('google', 'christina');

// Now getClient uses christina by default
const client = getClient('google');
```

## Standalone API Client

Use without the registry:

```javascript
const { clients, ApiClient } = require('./api-client');

// Pre-configured factories
const github = clients.github('your-token');
const repos = await github.get('/user/repos');

// Custom API
const myApi = new ApiClient(
  { baseUrl: 'https://api.myservice.com/v1' },
  { type: 'bearer', apiKey: 'my-key' }
);
```

## Supported Authentication Types

- **bearer**: `Authorization: Bearer {token}`
- **api_key**: Custom header with API key
- **basic**: `Authorization: Basic {base64(user:pass)}`
- **oauth2**: For services using OAuth (use CLI auth)

## Available Connectors (from n8n)

24 priority connectors extracted:
- CRM: HubSpot, Salesforce, Pipedrive
- Dev: GitHub, Linear, Jira, ClickUp
- Communication: Slack, Discord, Telegram
- Databases: Supabase, Postgres
- AI: OpenAI, Anthropic, Gemini
- Email: SendGrid, Mailchimp, Twilio
- E-commerce: Stripe, Shopify
- Productivity: Asana, Trello, Notion, Airtable

See `connectors.json` for full metadata.

## Security

- `credentials.local.js` is in `.gitignore` - NEVER commit it
- Use environment variables for production:
  ```javascript
  apiKey: process.env.HUBSPOT_API_KEY || ''
  ```
- Template file (`api-registry.template.js`) is safe to share
