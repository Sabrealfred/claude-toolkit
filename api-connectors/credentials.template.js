/**
 * Credentials Template for Claude Toolkit
 * ========================================
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to credentials.local.js
 * 2. Fill in your actual API keys
 * 3. NEVER commit credentials.local.js to git!
 *
 * The api-registry.js will automatically load credentials.local.js
 */

module.exports = {
  // ============================================
  // AI SERVICES
  // ============================================

  anthropic: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-api03-YOUR_KEY_HERE',
      }
    }
  },

  openai: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: process.env.OPENAI_API_KEY || 'sk-YOUR_KEY_HERE',
      }
    }
  },

  gemini: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: process.env.GEMINI_API_KEY || 'AIzaSy-YOUR_KEY_HERE',
      }
    }
  },

  groq: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: process.env.GROQ_API_KEY || 'gsk_YOUR_KEY_HERE',
      }
    }
  },

  openrouter: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: process.env.OPENROUTER_API_KEY || 'sk-or-v1-YOUR_KEY_HERE',
      }
    }
  },

  // ============================================
  // DATABASES
  // ============================================

  supabase: {
    _default: 'my-project',
    accounts: {
      'my-project': {
        projectRef: 'your-project-ref',
        projectUrl: 'https://your-project-ref.supabase.co',
        anonKey: 'eyJ...YOUR_ANON_KEY',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        dbPassword: process.env.SUPABASE_DB_PASSWORD || 'your-db-password',
        accessToken: process.env.SUPABASE_ACCESS_TOKEN || '',
      }
    }
  },

  // ============================================
  // CLOUD PROVIDERS
  // ============================================

  google: {
    _default: 'main',
    accounts: {
      'main': {
        email: 'your-email@example.com',
        projectId: 'your-gcp-project-id',
        quotaProject: 'your-quota-project',
        type: 'application-default',
      }
    }
  },

  azure: {
    _default: 'main',
    accounts: {
      'main': {
        email: 'your-email@example.com',
        tenantId: 'your-tenant-id',
        subscriptionId: 'your-subscription-id',
        appId: 'your-app-id',
      }
    }
  },

  aws: {
    _default: 'main',
    accounts: {
      'main': {
        accessKeyId: 'AKIA...',
        secretAccessKey: 'your-secret',
        region: 'us-east-1',
      }
    }
  },

  cloudflare: {
    _default: 'main',
    accounts: {
      'main': {
        apiToken: 'your-cloudflare-api-token',
        zoneId: 'your-zone-id',
      }
    }
  },

  // ============================================
  // EMAIL SERVICES
  // ============================================

  resend: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 're_YOUR_KEY_HERE',
        fromEmail: 'Your Name <noreply@yourdomain.com>',
      }
    }
  },

  sendgrid: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'SG.YOUR_KEY_HERE',
      }
    }
  },

  // ============================================
  // PRODUCTIVITY / PROJECT MANAGEMENT
  // ============================================

  asana: {
    _default: 'main',
    accounts: {
      'main': {
        accessToken: '2/YOUR_TOKEN_HERE',
        projectId: 'your-default-project-id',
      }
    }
  },

  notion: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'secret_YOUR_KEY_HERE',
      }
    }
  },

  slack: {
    _default: 'main',
    accounts: {
      'main': {
        botToken: 'xoxb-YOUR_TOKEN_HERE',
        webhookUrl: 'https://hooks.slack.com/services/...',
      }
    }
  },

  // ============================================
  // DEV TOOLS
  // ============================================

  github: {
    _default: 'main',
    accounts: {
      'main': {
        token: 'ghp_YOUR_TOKEN_HERE',
      }
    }
  },

  linear: {
    _default: 'main',
    accounts: {
      'main': {
        apiKey: 'lin_api_YOUR_KEY_HERE',
      }
    }
  },

  // ============================================
  // PAYMENTS
  // ============================================

  stripe: {
    _default: 'test',
    accounts: {
      'test': {
        secretKey: 'sk_test_YOUR_KEY_HERE',
        publishableKey: 'pk_test_YOUR_KEY_HERE',
      },
      'live': {
        secretKey: 'sk_live_YOUR_KEY_HERE',
        publishableKey: 'pk_live_YOUR_KEY_HERE',
      }
    }
  },

  // ============================================
  // ANALYTICS
  // ============================================

  umami: {
    _default: 'main',
    accounts: {
      'main': {
        url: 'https://your-umami-instance.com/script.js',
        websiteId: 'your-website-id',
      }
    }
  },

  // ============================================
  // TRADING (optional)
  // ============================================

  hummingbot: {
    _default: 'local',
    accounts: {
      'local': {
        apiUrl: 'http://localhost:8000',
        username: 'admin',
        password: 'admin',
      }
    }
  },
};
