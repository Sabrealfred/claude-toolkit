/**
 * Standalone API Client Library (JavaScript)
 * Extracted from n8n connectors - No n8n runtime needed
 *
 * Usage:
 *   const { clients } = require('./api-client');
 *   const hubspot = clients.hubspot('your-api-key');
 *   const contacts = await hubspot.get('/crm/v3/objects/contacts');
 */

// API Base URLs (extracted from n8n)
const API_BASES = {
  hubspot: 'https://api.hubapi.com',
  stripe: 'https://api.stripe.com/v1',
  slack: 'https://api.slack.com/api',
  discord: 'https://discord.com/api/v10',
  github: 'https://api.github.com',
  airtable: 'https://api.airtable.com/v0',
  notion: 'https://api.notion.com/v1',
  openai: 'https://api.openai.com/v1',
  asana: 'https://app.asana.com/api/1.0',
  trello: 'https://api.trello.com/1',
  sendgrid: 'https://api.sendgrid.com/v3',
  twilio: 'https://api.twilio.com/2010-04-01',
  clickup: 'https://api.clickup.com/api/v2',
  pipedrive: 'https://api.pipedrive.com/v1',
  linear: 'https://api.linear.app/graphql',
  google_sheets: 'https://sheets.googleapis.com/v4',
  google_drive: 'https://www.googleapis.com/drive/v3',
  mixpanel: 'https://mixpanel.com/api',
  amplitude: 'https://amplitude.com/api/2',
  posthog: 'https://app.posthog.com/api',
  segment: 'https://api.segment.io/v1',
  intercom: 'https://api.intercom.io',
  freshdesk: 'https://{domain}.freshdesk.com/api/v2',
  monday: 'https://api.monday.com/v2',
  quickbooks: 'https://quickbooks.api.intuit.com/v3',
  xero: 'https://api.xero.com/api.xro/2.0',
  woocommerce: 'https://{store}/wp-json/wc/v3',
  facebook_graph: 'https://graph.facebook.com/v18.0',
  linkedin: 'https://api.linkedin.com/v2',
  twitter: 'https://api.twitter.com/2',
};

class ApiClient {
  constructor(service, auth, options = {}) {
    // Get base URL
    if (typeof service === 'string') {
      let url = API_BASES[service.toLowerCase()];
      if (!url) {
        throw new Error(`Unknown service: ${service}. Available: ${Object.keys(API_BASES).join(', ')}`);
      }
      // Replace placeholders
      Object.entries(options).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value);
      });
      this.baseUrl = url;
    } else {
      this.baseUrl = service.baseUrl;
    }

    this.auth = auth;
    this.defaultHeaders = { 'Content-Type': 'application/json' };
    this.setupAuth();
  }

  setupAuth() {
    switch (this.auth.type) {
      case 'bearer':
        this.defaultHeaders['Authorization'] = `Bearer ${this.auth.accessToken || this.auth.apiKey}`;
        break;
      case 'api_key':
        if (this.auth.headerName) {
          this.defaultHeaders[this.auth.headerName] = this.auth.apiKey;
        } else {
          this.defaultHeaders['Authorization'] = `Bearer ${this.auth.apiKey}`;
        }
        break;
      case 'basic':
        const creds = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString('base64');
        this.defaultHeaders['Authorization'] = `Basic ${creds}`;
        break;
    }
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body, query, headers = {} } = options;

    // Build URL with query params
    let url = `${this.baseUrl}${endpoint}`;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => params.append(k, String(v)));
      url += `?${params.toString()}`;
    }

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  // Convenience methods
  get(endpoint, query) {
    return this.request(endpoint, { method: 'GET', query });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Pre-configured client factories
const clients = {
  hubspot: (apiKey) => new ApiClient('hubspot', { type: 'bearer', apiKey }),
  stripe: (apiKey) => new ApiClient('stripe', { type: 'bearer', apiKey }),
  slack: (token) => new ApiClient('slack', { type: 'bearer', accessToken: token }),
  discord: (botToken) => new ApiClient('discord', { type: 'bearer', accessToken: botToken }),
  github: (token) => new ApiClient('github', { type: 'bearer', accessToken: token }),
  airtable: (apiKey) => new ApiClient('airtable', { type: 'bearer', apiKey }),
  notion: (apiKey) => new ApiClient('notion', { type: 'bearer', apiKey }),
  openai: (apiKey) => new ApiClient('openai', { type: 'bearer', apiKey }),
  asana: (token) => new ApiClient('asana', { type: 'bearer', accessToken: token }),
  sendgrid: (apiKey) => new ApiClient('sendgrid', { type: 'bearer', apiKey }),
  clickup: (apiKey) => new ApiClient('clickup', { type: 'bearer', apiKey }),
  pipedrive: (apiKey) => new ApiClient('pipedrive', { type: 'api_key', apiKey, headerName: 'x-api-key' }),
  intercom: (token) => new ApiClient('intercom', { type: 'bearer', accessToken: token }),
  posthog: (apiKey) => new ApiClient('posthog', { type: 'bearer', apiKey }),
  segment: (writeKey) => new ApiClient('segment', { type: 'basic', username: writeKey, password: '' }),
  monday: (apiKey) => new ApiClient('monday', { type: 'bearer', apiKey }),

  // Services requiring subdomain/instance
  freshdesk: (domain, apiKey) => new ApiClient('freshdesk', { type: 'basic', username: apiKey, password: 'X' }, { domain }),
  woocommerce: (store, key, secret) => new ApiClient('woocommerce', { type: 'basic', username: key, password: secret }, { store }),

  // Custom
  custom: (baseUrl, auth) => new ApiClient({ baseUrl }, auth),
};

// Quick helper for one-off requests
async function apiRequest(service, endpoint, options = {}) {
  const { apiKey, accessToken, method = 'GET', body, query } = options;
  const client = new ApiClient(service, {
    type: 'bearer',
    apiKey,
    accessToken
  });
  return client.request(endpoint, { method, body, query });
}

module.exports = {
  ApiClient,
  clients,
  apiRequest,
  API_BASES,
};

// ESM export
if (typeof exports !== 'undefined') {
  exports.ApiClient = ApiClient;
  exports.clients = clients;
  exports.apiRequest = apiRequest;
  exports.API_BASES = API_BASES;
}
