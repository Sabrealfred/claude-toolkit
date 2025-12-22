# Connectors Comparison: n8n vs Coupler.io vs Claude Toolkit

## Summary

| Platform | Total Connectors | License | Reusable? |
|----------|-----------------|---------|-----------|
| **n8n** | 250+ built-in | Fair-code | ✅ Yes (TypeScript) |
| **Coupler.io** | 410 | Proprietary | ❌ No |
| **Claude Toolkit** | 30 | MIT | ✅ Yes |

---

## Category Comparison

### AI / LLM Services

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| OpenAI | ✅ | ❌ | ✅ | - |
| Anthropic | ❌ | ❌ | ✅ | - |
| Google Gemini | ✅ | ❌ | ✅ | - |
| Groq | ❌ | ❌ | ✅ | - |
| OpenRouter | ❌ | ❌ | ✅ | - |
| Perplexity | ✅ | ❌ | ❌ | High |
| Mistral | ✅ | ❌ | ❌ | Medium |
| DeepL | ✅ | ❌ | ❌ | Medium |
| HuggingFace | ❌ | ❌ | ✅ (via MCP) | - |

### CRM / Sales

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| HubSpot | ✅ | ✅ | ❌ | High |
| Salesforce | ✅ | ✅ | ❌ | High |
| Pipedrive | ✅ | ✅ | ❌ | Medium |
| Zoho CRM | ✅ | ✅ | ❌ | Medium |
| Copper | ✅ | ❌ | ❌ | Low |
| Freshsales | ✅ | ✅ | ❌ | Low |
| Agile CRM | ✅ | ❌ | ❌ | Low |

### Databases

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| Supabase | ✅ | ❌ | ✅ | - |
| PostgreSQL | ✅ | ✅ | ✅ (via Supabase) | - |
| MySQL | ✅ | ✅ | ❌ | Medium |
| MongoDB | ✅ | ✅ | ❌ | Medium |
| Airtable | ✅ | ✅ | ❌ | High |
| Notion | ✅ | ✅ | ❌ | High |
| Google Sheets | ✅ | ✅ | ❌ | High |
| NocoDB | ✅ | ❌ | ❌ | Medium |
| Baserow | ✅ | ❌ | ❌ | Low |

### Productivity / PM

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| Asana | ✅ | ✅ | ✅ | - |
| Trello | ✅ | ✅ | ❌ | Medium |
| ClickUp | ✅ | ✅ | ❌ | Medium |
| Linear | ✅ | ❌ | ❌ | High |
| Jira | ✅ | ✅ | ❌ | High |
| Monday | ✅ | ✅ | ❌ | Medium |
| Todoist | ✅ | ❌ | ❌ | Low |
| Notion | ✅ | ✅ | ❌ | High |

### Communication

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| Slack | ✅ | ✅ | ❌ | High |
| Discord | ✅ | ❌ | ❌ | High |
| Telegram | ✅ | ❌ | ❌ | High |
| Microsoft Teams | ✅ | ✅ | ❌ | High |
| WhatsApp | ✅ | ❌ | ❌ | Medium |
| Email (SMTP) | ✅ | ❌ | ✅ (Resend) | - |

### Marketing / Email

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| Mailchimp | ✅ | ✅ | ❌ | Medium |
| SendGrid | ✅ | ❌ | ❌ | Medium |
| Resend | ❌ | ❌ | ✅ | - |
| Brevo | ✅ | ❌ | ❌ | Low |
| ConvertKit | ✅ | ❌ | ❌ | Low |
| ActiveCampaign | ✅ | ✅ | ❌ | Medium |

### Cloud / DevOps

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| AWS S3 | ✅ | ✅ | ❌ | High |
| Google Cloud | ✅ | ✅ | ✅ (CLI) | - |
| Azure | ✅ | ✅ | ✅ (CLI) | - |
| Cloudflare | ✅ | ❌ | ✅ | - |
| Netlify | ✅ | ❌ | ✅ (CLI) | - |
| GitHub | ✅ | ✅ | ✅ (CLI) | - |
| GitLab | ✅ | ✅ | ❌ | Medium |
| Docker | ✅ | ❌ | ✅ (MCP) | - |

### Analytics

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| Google Analytics | ✅ | ✅ | ❌ | High |
| Mixpanel | ✅ | ✅ | ❌ | Medium |
| Amplitude | ❌ | ✅ | ❌ | Medium |
| Segment | ✅ | ❌ | ❌ | Medium |
| PostHog | ✅ | ❌ | ❌ | High |
| Plausible | ❌ | ❌ | ❌ | Low |
| Umami | ❌ | ❌ | ✅ | - |

### E-commerce

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| Shopify | ✅ | ✅ | ❌ | High |
| WooCommerce | ✅ | ✅ | ❌ | Medium |
| Stripe | ✅ | ✅ | ❌ | High |
| PayPal | ✅ | ✅ | ❌ | Medium |
| Gumroad | ✅ | ❌ | ❌ | Low |

### Forms / Surveys

| Service | n8n | Coupler | Claude Toolkit | Priority |
|---------|-----|---------|----------------|----------|
| Typeform | ✅ | ✅ | ❌ | Medium |
| Google Forms | ✅ | ✅ | ❌ | Medium |
| JotForm | ✅ | ✅ | ❌ | Low |
| Tally | ❌ | ❌ | ❌ | Medium |

---

## High Priority Connectors to Add

Based on market demand and ease of implementation:

### Tier 1 (Essential - Week 1-2)
1. **Slack** - Team communication
2. **Google Sheets** - Data storage
3. **Notion** - Knowledge base
4. **HubSpot** - CRM
5. **Stripe** - Payments

### Tier 2 (Important - Week 3-4)
6. **Airtable** - Database/spreadsheet
7. **Discord** - Community
8. **Telegram** - Messaging
9. **Linear** - Issue tracking
10. **Jira** - Enterprise PM

### Tier 3 (Nice to Have - Month 2)
11. **Shopify** - E-commerce
12. **Salesforce** - Enterprise CRM
13. **MySQL** - Database
14. **Google Analytics** - Analytics
15. **AWS S3** - Storage

---

## n8n Nodes We Can Port

n8n nodes are TypeScript and can be adapted. Each node has:
- `*.node.ts` - Main logic
- `*.credentials.ts` - Auth handling
- `GenericFunctions.ts` - API helpers

### Example: Porting Slack Node

```typescript
// n8n Slack node structure
packages/nodes-base/nodes/Slack/
├── Slack.node.ts          // Main node
├── SlackApi.credentials.ts // OAuth/API auth
├── GenericFunctions.ts     // API calls
├── MessageDescription.ts   // Message operations
├── ChannelDescription.ts   // Channel operations
└── UserDescription.ts      // User operations
```

### Conversion to Claude Toolkit:

```javascript
// api-connectors/slack.js
const { ApiClient } = require('./api-client');

class SlackClient {
  constructor(token) {
    this.client = new ApiClient(
      { baseUrl: 'https://slack.com/api' },
      { type: 'bearer', apiKey: token }
    );
  }

  async postMessage(channel, text, options = {}) {
    return this.client.post('/chat.postMessage', {
      channel,
      text,
      ...options
    });
  }

  async listChannels() {
    return this.client.get('/conversations.list');
  }

  // ... more methods
}

module.exports = { SlackClient };
```

---

## Implementation Plan

### Phase 1: Core Connectors (2 weeks)
```
Week 1:
- [ ] Slack (messaging)
- [ ] Google Sheets (data)
- [ ] Notion (knowledge)

Week 2:
- [ ] HubSpot (CRM)
- [ ] Stripe (payments)
- [ ] Discord (community)
```

### Phase 2: Extended Connectors (2 weeks)
```
Week 3:
- [ ] Airtable
- [ ] Telegram
- [ ] Linear

Week 4:
- [ ] Jira
- [ ] MySQL
- [ ] Google Analytics
```

### Phase 3: Enterprise (1 month)
```
- [ ] Salesforce
- [ ] Microsoft 365
- [ ] AWS S3
- [ ] Snowflake
```

---

## Resources

- [n8n Nodes Source](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes)
- [n8n Credentials Source](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/credentials)
- [n8n Node Development Docs](https://docs.n8n.io/integrations/creating-nodes/)
- [Coupler.io Integrations](https://www.coupler.io/integrations)
