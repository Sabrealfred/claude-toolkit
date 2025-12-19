/**
 * API Registry Template - NO CREDENTIALS
 * Copy this to api-registry.local.js and fill in your credentials
 *
 * NEVER commit api-registry.local.js to git!
 */

const CREDENTIALS_TEMPLATE = {
  // === AI SERVICES ===
  openai: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'sk-...',
      }
    }
  },

  anthropic: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'sk-ant-...',
      }
    }
  },

  gemini: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'AIza...',
      }
    }
  },

  groq: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'gsk_...',
      }
    }
  },

  openrouter: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'sk-or-...',
      }
    }
  },

  // === DATABASES ===
  supabase: {
    _default: 'project-name',
    accounts: {
      'project-name': {
        projectUrl: 'https://xxxxx.supabase.co',
        anonKey: 'eyJ...',
        serviceRoleKey: 'eyJ...',
        dbPassword: '...',
      }
    }
  },

  // === CLOUD PROVIDERS ===
  google: {
    _default: 'main',
    accounts: {
      'main': {
        email: 'you@example.com',
        projectId: 'your-project-id',
        type: 'application-default',
      }
    }
  },

  azure: {
    _default: 'main',
    accounts: {
      'main': {
        email: 'you@example.com',
        tenantId: '...',
        clientId: '...',
        clientSecret: '...',
      }
    }
  },

  aws: {
    _default: 'main',
    accounts: {
      'main': {
        accessKeyId: 'AKIA...',
        secretAccessKey: '...',
        region: 'us-east-1',
      }
    }
  },

  // === PRODUCTIVITY ===
  asana: {
    _default: 'main',
    accounts: {
      'main': {
        accessToken: '2/...',
      }
    }
  },

  notion: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'secret_...',
      }
    }
  },

  slack: {
    _default: 'main',
    accounts: {
      'main': {
        botToken: 'xoxb-...',
      }
    }
  },

  discord: {
    _default: 'main',
    accounts: {
      'main': {
        botToken: '...',
      }
    }
  },

  // === CRM / SALES ===
  hubspot: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: '...',
      }
    }
  },

  salesforce: {
    _default: 'main',
    accounts: {
      'main': {
        instanceUrl: 'https://xxx.salesforce.com',
        accessToken: '...',
      }
    }
  },

  pipedrive: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: '...',
      }
    }
  },

  // === DEV TOOLS ===
  github: {
    _default: 'main',
    accounts: {
      'main': {
        token: 'ghp_...',
      }
    }
  },

  linear: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'lin_api_...',
      }
    }
  },

  // === PAYMENTS ===
  stripe: {
    _default: 'main',
    accounts: {
      'main': {
        secretKey: 'sk_live_...',
        publishableKey: 'pk_live_...',
      },
      'test': {
        secretKey: 'sk_test_...',
        publishableKey: 'pk_test_...',
      }
    }
  },

  // === EMAIL ===
  sendgrid: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'SG...',
      }
    }
  },

  mailchimp: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: '...-us1', // datacenter suffix
      }
    }
  },

  // === E-COMMERCE ===
  shopify: {
    _default: 'main',
    accounts: {
      'main': {
        store: 'your-store',
        accessToken: 'shpat_...',
      }
    }
  },
};

module.exports = { CREDENTIALS_TEMPLATE };
