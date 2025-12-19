/**
 * Unified API Registry with Multi-Account Support
 * Like gcloud, supports multiple accounts per service
 *
 * Architecture:
 *   - api-registry.template.js  -> Template (safe to share)
 *   - credentials.local.js      -> Your real credentials (DO NOT SHARE)
 *   - api-registry.js           -> This file (loads credentials, provides API)
 *
 * Usage:
 *   const { getClient, listServices } = require('./api-registry');
 *   const client = getClient('asana');
 *   const googleClient = getClient('google', 'gerardo');
 */

const { ApiClient, clients } = require('./api-client');
const path = require('path');
const fs = require('fs');

// ============================================
// LOAD CREDENTIALS
// Priority: credentials.local.js > env vars > defaults
// ============================================
let LOCAL_CREDENTIALS = {};

const localCredsPath = path.join(__dirname, 'credentials.local.js');
if (fs.existsSync(localCredsPath)) {
  try {
    LOCAL_CREDENTIALS = require('./credentials.local.js');
    console.log('[api-registry] Loaded credentials from credentials.local.js');
  } catch (e) {
    console.warn('[api-registry] Failed to load credentials.local.js:', e.message);
  }
}

// ============================================
// DEFAULT CREDENTIALS (No secrets here!)
// Services available but not configured
// ============================================
const DEFAULT_SERVICES = {
  // AI Services
  openai: { _default: null, accounts: {}, status: 'not_configured' },
  anthropic: { _default: null, accounts: {}, status: 'not_configured' },
  gemini: { _default: null, accounts: {}, status: 'not_configured' },
  groq: { _default: null, accounts: {}, status: 'not_configured' },
  openrouter: { _default: null, accounts: {}, status: 'not_configured' },

  // Databases
  supabase: { _default: null, accounts: {}, status: 'not_configured' },

  // Cloud Providers
  google: { _default: null, accounts: {}, status: 'not_configured' },
  azure: { _default: null, accounts: {}, status: 'not_configured' },
  aws: { _default: null, accounts: {}, status: 'not_configured' },

  // Productivity
  asana: { _default: null, accounts: {}, status: 'not_configured' },
  notion: { _default: null, accounts: {}, status: 'not_configured' },
  slack: { _default: null, accounts: {}, status: 'not_configured' },
  discord: { _default: null, accounts: {}, status: 'not_configured' },
  trello: { _default: null, accounts: {}, status: 'not_configured' },
  clickup: { _default: null, accounts: {}, status: 'not_configured' },
  linear: { _default: null, accounts: {}, status: 'not_configured' },
  jira: { _default: null, accounts: {}, status: 'not_configured' },

  // CRM / Sales
  hubspot: { _default: null, accounts: {}, status: 'not_configured' },
  salesforce: { _default: null, accounts: {}, status: 'not_configured' },
  pipedrive: { _default: null, accounts: {}, status: 'not_configured' },
  zendesk: { _default: null, accounts: {}, status: 'not_configured' },

  // Dev Tools
  github: { _default: null, accounts: {}, status: 'not_configured' },
  airtable: { _default: null, accounts: {}, status: 'not_configured' },

  // Payments
  stripe: { _default: null, accounts: {}, status: 'not_configured' },

  // Email
  sendgrid: { _default: null, accounts: {}, status: 'not_configured' },
  mailchimp: { _default: null, accounts: {}, status: 'not_configured' },
  twilio: { _default: null, accounts: {}, status: 'not_configured' },
  resend: { _default: null, accounts: {}, status: 'not_configured' },

  // E-Commerce
  shopify: { _default: null, accounts: {}, status: 'not_configured' },

  // Social
  telegram: { _default: null, accounts: {}, status: 'not_configured' },

  // Infrastructure
  cloudflare: { _default: null, accounts: {}, status: 'not_configured' },

  // Analytics
  umami: { _default: null, accounts: {}, status: 'not_configured' },

  // Trading
  hummingbot: { _default: null, accounts: {}, status: 'not_configured' },
};

// Merge local credentials with defaults
const CREDENTIALS = { ...DEFAULT_SERVICES };
Object.entries(LOCAL_CREDENTIALS).forEach(([service, config]) => {
  if (config._default && Object.keys(config.accounts).length > 0) {
    CREDENTIALS[service] = { ...config, status: 'configured' };
  }
});

// ============================================
// REGISTRY CLASS
// ============================================
class ApiRegistry {
  constructor() {
    this.credentials = CREDENTIALS;
    this.activeAccounts = {}; // Track which account is active per service
  }

  /**
   * List all available services
   */
  listServices() {
    const configured = [];
    const notConfigured = [];

    Object.entries(this.credentials).forEach(([service, config]) => {
      if (config.status === 'not_configured' || !config._default) {
        notConfigured.push(service);
      } else {
        configured.push({
          service,
          accounts: Object.keys(config.accounts),
          default: config._default,
        });
      }
    });

    return { configured, notConfigured };
  }

  /**
   * List accounts for a service (like: gcloud auth list)
   */
  listAccounts(service) {
    const config = this.credentials[service];
    if (!config) {
      throw new Error(`Unknown service: ${service}`);
    }

    const active = this.activeAccounts[service] || config._default;
    return {
      service,
      accounts: Object.keys(config.accounts).map(name => ({
        name,
        active: name === active,
      })),
      default: config._default,
    };
  }

  /**
   * Switch active account (like: gcloud config set account)
   */
  setActiveAccount(service, accountName) {
    const config = this.credentials[service];
    if (!config) {
      throw new Error(`Unknown service: ${service}`);
    }
    if (!config.accounts[accountName]) {
      throw new Error(`Account '${accountName}' not found for ${service}. Available: ${Object.keys(config.accounts).join(', ')}`);
    }

    this.activeAccounts[service] = accountName;
    return { service, activeAccount: accountName };
  }

  /**
   * Get credentials for a service/account
   */
  getCredentials(service, accountName = null) {
    const config = this.credentials[service];
    if (!config) {
      throw new Error(`Unknown service: ${service}`);
    }

    if (config.status === 'not_configured') {
      throw new Error(`Service '${service}' is not configured. Add credentials to credentials.local.js`);
    }

    const account = accountName || this.activeAccounts[service] || config._default;
    const creds = config.accounts[account];

    if (!creds) {
      throw new Error(`No credentials found for ${service}/${account}`);
    }

    return { account, ...creds };
  }

  /**
   * Get a configured API client
   */
  getClient(service, accountName = null) {
    const creds = this.getCredentials(service, accountName);

    // Service-specific client creation
    switch (service) {
      case 'asana':
        return clients.asana(creds.accessToken);

      case 'openrouter':
        return new ApiClient(
          { baseUrl: 'https://openrouter.ai/api/v1' },
          { type: 'bearer', apiKey: creds.apiKey }
        );

      case 'gemini':
        return new ApiClient(
          { baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
          { type: 'api_key', apiKey: creds.apiKey, headerName: 'x-goog-api-key' }
        );

      case 'anthropic':
        return new ApiClient(
          { baseUrl: 'https://api.anthropic.com/v1' },
          { type: 'api_key', apiKey: creds.apiKey, headerName: 'x-api-key' }
        );

      case 'groq':
        return new ApiClient(
          { baseUrl: 'https://api.groq.com/openai/v1' },
          { type: 'bearer', apiKey: creds.apiKey }
        );

      case 'supabase':
        return {
          url: creds.projectUrl,
          anonKey: creds.anonKey,
          accessToken: creds.accessToken,
          rest: new ApiClient(
            { baseUrl: `${creds.projectUrl}/rest/v1` },
            { type: 'bearer', apiKey: creds.anonKey }
          ),
          // PostgreSQL connection string
          connectionString: `postgresql://postgres.${creds.projectUrl.split('//')[1].split('.')[0]}:${creds.dbPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
        };

      case 'google':
        // Google uses gcloud CLI, return config info
        return {
          type: 'gcloud',
          email: creds.email,
          projectId: creds.projectId,
          hint: 'Use gcloud CLI: gcloud auth application-default print-access-token',
        };

      case 'azure':
        // Azure uses az CLI
        return {
          type: 'azure-cli',
          email: creds.email,
          tenantId: creds.tenantId,
          subscriptionId: creds.subscriptionId,
          hint: 'Use az CLI: az account get-access-token',
        };

      case 'resend':
        return new ApiClient(
          { baseUrl: 'https://api.resend.com' },
          { type: 'bearer', apiKey: creds.apiKey }
        );

      case 'cloudflare':
        return new ApiClient(
          { baseUrl: 'https://api.cloudflare.com/client/v4' },
          { type: 'bearer', apiKey: creds.apiToken }
        );

      case 'umami':
        // Umami is self-hosted analytics, return config
        return {
          type: 'analytics',
          url: creds.url,
          websiteId: creds.websiteId,
        };

      case 'hummingbot':
        // Hummingbot is local trading bot
        return new ApiClient(
          { baseUrl: creds.apiUrl },
          { type: 'basic', username: creds.username, password: creds.password }
        );

      default:
        // Try generic client factory
        if (clients[service]) {
          const key = creds.apiKey || creds.accessToken;
          if (!key) {
            throw new Error(`No API key or access token found for ${service}`);
          }
          return clients[service](key);
        }
        throw new Error(`No client factory for service: ${service}`);
    }
  }

  /**
   * Add a new account to a service (runtime only, not persisted)
   */
  addAccount(service, accountName, credentials) {
    if (!this.credentials[service]) {
      this.credentials[service] = { _default: accountName, accounts: {}, status: 'configured' };
    }

    this.credentials[service].accounts[accountName] = credentials;

    // Set as default if first account
    if (!this.credentials[service]._default) {
      this.credentials[service]._default = accountName;
    }

    this.credentials[service].status = 'configured';

    return { service, account: accountName, status: 'added' };
  }

  /**
   * Print status (like: gcloud auth list)
   */
  status() {
    console.log('\n=== API REGISTRY STATUS ===\n');

    const { configured, notConfigured } = this.listServices();

    console.log('CONFIGURED SERVICES:');
    console.log('--------------------');
    configured.forEach(s => {
      const active = this.activeAccounts[s.service] || s.default;
      console.log(`  ${s.service}:`);
      s.accounts.forEach(acc => {
        const marker = acc === active ? '*' : ' ';
        console.log(`    ${marker} ${acc}${acc === s.default ? ' (default)' : ''}`);
      });
    });

    console.log('\nNOT CONFIGURED:');
    console.log('---------------');
    console.log(`  ${notConfigured.join(', ')}`);
    console.log('\n');
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================
const registry = new ApiRegistry();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Quick client getter
 * Usage: getClient('asana') or getClient('google', 'christina')
 */
function getClient(service, account = null) {
  return registry.getClient(service, account);
}

/**
 * Quick credentials getter
 */
function getCredentials(service, account = null) {
  return registry.getCredentials(service, account);
}

/**
 * List all services
 */
function listServices() {
  return registry.listServices();
}

/**
 * Add new credentials (runtime only)
 */
function addCredentials(service, accountName, credentials) {
  return registry.addAccount(service, accountName, credentials);
}

/**
 * Set active account
 */
function setAccount(service, accountName) {
  return registry.setActiveAccount(service, accountName);
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  registry,
  getClient,
  getCredentials,
  listServices,
  addCredentials,
  setAccount,
  ApiRegistry,
  CREDENTIALS,
};

// CLI usage
if (require.main === module) {
  registry.status();
}
