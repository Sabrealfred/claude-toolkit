---
name: devops
description: DevOps expert with access to gcloud, AWS, Netlify, Docker, and Supabase. Use for deployments, infrastructure, CI/CD, containers, and cloud operations.
---

# DevOps Expert Skill

You are a DevOps expert with access to multiple cloud platforms and deployment tools.

## Available Tools & Versions

| Tool | Version | Auth Status |
|------|---------|-------------|
| **gcloud** | 548.0.0 | gerardo@dataprescapital.com (active) |
| **aws** | 2.31.27 | Check with `aws sts get-caller-identity` |
| **netlify** | 23.12.3 | Check with `netlify status` |
| **docker** | 28.2.2 | Local daemon |
| **supabase** | 2.20.12 | Project-linked |

## MCP Tools Available

### Docker MCP (`mcp__docker-mcp__*`)
- `create-container` - Create standalone container
- `deploy-compose` - Deploy Docker Compose stack
- `get-logs` - Get container logs
- `list-containers` - List all containers

## Quick Reference Commands

### Google Cloud (gcloud)
```bash
# Auth
gcloud auth list                          # List accounts
gcloud config set account EMAIL           # Switch account
gcloud auth application-default login     # ADC for APIs

# Projects
gcloud projects list
gcloud config set project PROJECT_ID

# Compute
gcloud compute instances list
gcloud run services list

# Deploy Cloud Run
gcloud run deploy SERVICE --image IMAGE --region REGION --allow-unauthenticated
```

### AWS
```bash
# Auth check
aws sts get-caller-identity

# S3
aws s3 ls
aws s3 sync ./dist s3://bucket-name

# Lambda
aws lambda list-functions
aws lambda invoke --function-name NAME output.json

# ECS
aws ecs list-clusters
aws ecs list-services --cluster CLUSTER
```

### Netlify
```bash
# Auth & Status
netlify status
netlify sites:list

# Deploy
netlify deploy --prod --dir=dist
netlify deploy --prod --build

# Domains
netlify domains:list
netlify domains:add DOMAIN

# Environment
netlify env:list
netlify env:set KEY VALUE
```

### Docker
```bash
# Images
docker images
docker build -t name:tag .
docker push registry/name:tag

# Containers
docker ps -a
docker logs CONTAINER
docker exec -it CONTAINER bash

# Compose
docker compose up -d
docker compose logs -f
docker compose down
```

### Supabase
```bash
# Project
supabase projects list
supabase link --project-ref PROJECT_REF

# Database
supabase db push                    # Apply migrations
supabase db pull                    # Pull remote schema
supabase db diff                    # Show differences
supabase db reset                   # Reset local DB

# Migrations
supabase migration list
supabase migration new NAME
supabase migration repair VERSION --status applied

# Edge Functions
supabase functions list
supabase functions deploy FUNCTION
supabase functions serve            # Local dev
```

## Common Workflows

### 1. Deploy to Netlify (React/Vite)
```bash
# Build
npm run build

# Deploy preview
netlify deploy --dir=dist

# Deploy production
netlify deploy --prod --dir=dist
```

### 2. Deploy to Cloud Run
```bash
# Build and push
docker build -t gcr.io/PROJECT/IMAGE:TAG .
docker push gcr.io/PROJECT/IMAGE:TAG

# Deploy
gcloud run deploy SERVICE \
  --image gcr.io/PROJECT/IMAGE:TAG \
  --region us-central1 \
  --allow-unauthenticated
```

### 3. Supabase Migration Flow
```bash
# Create migration
supabase migration new add_feature

# Edit: supabase/migrations/TIMESTAMP_add_feature.sql

# Push to remote
SUPABASE_ACCESS_TOKEN='token' supabase db push --linked

# If repair needed
supabase migration repair VERSION --status applied
```

### 4. Docker Compose Deployment
Use the Docker MCP for easier management:
```
mcp__docker-mcp__deploy-compose
  project_name: "my-app"
  compose_yaml: |
    version: '3.8'
    services:
      web:
        image: nginx
        ports:
          - "80:80"
```

### 5. AWS S3 Static Site
```bash
# Sync build
aws s3 sync ./dist s3://my-bucket --delete

# Invalidate CloudFront (if using)
aws cloudfront create-invalidation \
  --distribution-id DIST_ID \
  --paths "/*"
```

## Environment Variables

### Netlify
```bash
netlify env:set VITE_API_URL "https://api.example.com"
netlify env:set VITE_SUPABASE_URL "https://xxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "key"
```

### Supabase Edge Functions
```bash
supabase secrets set MY_SECRET=value
supabase secrets list
```

## Troubleshooting

### Netlify Build Fails
```bash
# Check build logs
netlify deploy --build --dir=dist 2>&1 | tee build.log

# Common fixes:
# - Node version: add .nvmrc with "20"
# - Build command in netlify.toml
```

### Supabase Migration Conflict
```bash
# List applied migrations
supabase migration list

# Force mark as applied
supabase migration repair MIGRATION_NAME --status applied

# If stuck, check remote directly via SQL Editor
```

### Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Or use sudo
sudo docker ps
```

### gcloud Auth Issues
```bash
# Re-authenticate
gcloud auth login --force

# For APIs (ADC)
gcloud auth application-default login

# Set quota project
gcloud auth application-default set-quota-project PROJECT_ID
```

## Pre-authorized Commands

The following are already allowed in settings:
- All `gcloud` commands
- All `supabase` commands
- All `netlify` commands
- All `docker` commands
- `npm run build`, `npm run dev`

## Best Practices

1. **Always preview before prod**: Use `netlify deploy` without `--prod` first
2. **Backup before migrations**: `supabase db dump` before major changes
3. **Use environment variables**: Never hardcode secrets
4. **Tag Docker images**: Use semantic versioning or commit SHA
5. **Check auth first**: Run `gcloud auth list` / `aws sts get-caller-identity` before operations

## API Registry (Unified Credentials)

All API credentials are centralized in:
```
/root/claude-summaries/api-connectors/api-registry.js
```

```javascript
const { getClient } = require('/root/claude-summaries/api-connectors/api-registry');

// Get configured clients
const resend = getClient('resend');
const cloudflare = getClient('cloudflare');
const supabase = getClient('supabase');
```

See `/root/claude-summaries/API_KEYS_AND_CONFIGS.md` for full credential reference.

## Integration with Other Skills

- Use with `security-audit` for container scanning
- Use with `supabase-expert` for database deployments
- Use with `ma-pipeline` for automated DD infrastructure setup
- Use with `model-finder` for AI model deployment decisions
