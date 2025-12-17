# Deployment Pipeline Documentation

## Task 10.3: Set Up Deployment Pipeline ✅

This document describes the complete deployment pipeline configuration for the Personal Cookbook application.

## Overview

The deployment pipeline automates the entire process from code commit to production deployment, including:
- Automated testing and linting
- Database migrations
- Vercel deployment (preview and production)
- Health checks and verification
- Monitoring and error tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                  (Source Code + CI/CD)                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Pull Request│   │  Push to     │   │  Push to     │
│              │   │  develop     │   │  main        │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│              GitHub Actions CI/CD Pipeline                    │
│                                                               │
│  1. Run Tests (Unit + Property-Based)                        │
│  2. Run Linter                                               │
│  3. Run Database Migrations                                  │
│  4. Build Application                                        │
└──────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Preview    │   │   Preview    │   │  Production  │
│  Deployment  │   │  Deployment  │   │  Deployment  │
│  (PR)        │   │  (develop)   │   │  (main)      │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │   Vercel     │
                    │  Platform    │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │    Health    │
                    │    Check     │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Monitoring  │
                    │   & Logs     │
                    └──────────────┘
```

## Components

### 1. Vercel Configuration (`vercel.json`)

**Purpose:** Configures Vercel deployment settings, environment variables, and security headers.

**Key Features:**
- Environment variable management
- Security headers (CSP, XSS protection, etc.)
- API route timeout configuration
- URL rewrites for health endpoint
- Build and deployment settings

**Configuration:**
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEON_DATABASE_URL": "@neon-database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

### 2. CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Purpose:** Automates testing, building, and deployment processes.

**Jobs:**

#### Test Job
- Runs on: All pushes and pull requests
- Steps:
  1. Checkout code
  2. Setup Node.js 18 with npm cache
  3. Install dependencies (`npm ci`)
  4. Run linter (`npm run lint`)
  5. Run unit tests with dev database
  6. Run database migrations
  7. Build application

#### Deploy Preview Job
- Runs on: Pull requests only
- Depends on: Test job success
- Steps:
  1. Checkout code
  2. Deploy to Vercel preview environment
  3. Comment on PR with preview URL

#### Deploy Production Job
- Runs on: Push to main branch only
- Depends on: Test job success
- Steps:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run production database migrations
  5. Deploy to Vercel production
  6. Wait for deployment to be ready (30s)
  7. Verify deployment health (5 retries)
  8. Create deployment notification
  9. Notify on failure

### 3. Database Migration Automation

**Purpose:** Ensures database schema is up-to-date before deployment.

**Implementation:**

**Development/Preview:**
```yaml
- name: Run database migrations
  env:
    NEON_DEV_DATABASE_URL: ${{ secrets.NEON_DEV_DATABASE_URL }}
  run: npm run db:migrate
```

**Production:**
```yaml
- name: Run production database migrations
  env:
    NEON_DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
  run: npm run db:migrate
```

**Migration Files:**
- Location: `drizzle/` directory
- Format: SQL files generated by Drizzle Kit
- Execution: Automated via `src/db/migrate.ts`

**Migration Strategy:**
1. Migrations run before deployment
2. Separate databases for dev/prod (Neon branching)
3. Rollback capability via Neon point-in-time recovery
4. Migration history tracked in database

### 4. Monitoring and Error Tracking (`src/lib/monitoring.ts`)

**Purpose:** Centralized logging, error tracking, and performance monitoring.

**Features:**

#### Error Tracking
```typescript
import { logError } from '@/lib/monitoring';

try {
  // Your code
} catch (error) {
  logError(error, {
    userId: user.id,
    url: req.url,
    method: req.method,
  });
}
```

#### Performance Monitoring
```typescript
import { startTimer } from '@/lib/monitoring';

const endTimer = startTimer('recipe-ingestion');
// ... perform operation
endTimer(); // Logs duration
```

#### API Request Tracking
```typescript
import { trackApiRequest } from '@/lib/monitoring';

trackApiRequest('POST', '/api/recipes', 200, 150, userId);
```

#### Database Query Tracking
```typescript
monitoring.trackDatabaseQuery(
  'SELECT * FROM recipes WHERE id = ?',
  45, // duration in ms
  true // success
);
```

**Log Levels:**
- `error`: Critical errors requiring attention
- `warning`: Potential issues (slow queries, etc.)
- `info`: General information
- `performance`: Performance metrics
- `api_request`: API request logs
- `db_query`: Database query logs

**Integration:**
- Logs automatically captured by Vercel
- Structured JSON logging for easy parsing
- Environment-aware (dev vs production)
- Ready for integration with Sentry, LogRocket, etc.

### 5. Health Check Endpoint (`/api/health`)

**Purpose:** Verify application and database health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "message": "Database connection successful",
  "version": "0.1.0"
}
```

**Status Codes:**
- `200`: Healthy
- `503`: Unhealthy (database disconnected)
- `500`: Error

**Used By:**
- CI/CD pipeline for deployment verification
- Monitoring services for uptime checks
- Load balancers for health checks

## Environment Variables

### Required Secrets (GitHub)

Configure in: GitHub Repository → Settings → Secrets and variables → Actions

| Secret Name | Description | Example |
|------------|-------------|---------|
| `NEON_DATABASE_URL` | Production database connection string | `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/main` |
| `NEON_DEV_DATABASE_URL` | Development database connection string | `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dev` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `your-secret-key-here` |
| `NEXTAUTH_URL` | Application URL | `https://your-app.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | `vercel_blob_rw_xxx` |
| `VERCEL_TOKEN` | Vercel API token | `xxx` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_xxx` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_xxx` |

### Vercel Environment Variables

Configure in: Vercel Dashboard → Project → Settings → Environment Variables

**Production:**
- `NEON_DATABASE_URL`: Production database URL
- `NEXTAUTH_SECRET`: Production auth secret
- `NEXTAUTH_URL`: Production URL
- `BLOB_READ_WRITE_TOKEN`: Blob storage token

**Preview:**
- `NEON_DATABASE_URL`: Development database URL
- `NEXTAUTH_SECRET`: Development auth secret
- `NEXTAUTH_URL`: Preview URL (auto-generated)
- `BLOB_READ_WRITE_TOKEN`: Blob storage token

**Development:**
- `NEON_DEV_DATABASE_URL`: Development database URL
- `NEXTAUTH_SECRET`: Development auth secret
- `NEXTAUTH_URL`: `http://localhost:3000`

## Deployment Workflows

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ...

# Commit and push
git add .
git commit -m "feat(api): add new endpoint"
git push origin feature/new-feature

# Create pull request
# → Triggers CI/CD pipeline
# → Runs tests
# → Creates preview deployment
# → Comments on PR with preview URL
```

### 2. Preview Deployment

```bash
# Push to develop branch
git checkout develop
git merge feature/new-feature
git push origin develop

# → Triggers CI/CD pipeline
# → Runs tests
# → Runs migrations on dev database
# → Deploys to preview environment
```

### 3. Production Deployment

```bash
# Merge to main branch
git checkout main
git merge develop
git push origin main

# → Triggers CI/CD pipeline
# → Runs tests
# → Runs migrations on production database
# → Deploys to production
# → Waits 30 seconds
# → Runs health checks (5 retries)
# → Creates deployment notification
```

### 4. Manual Deployment (Alternative)

```bash
# Use deployment script
npm run deploy

# → Analyzes changes
# → Generates commit message
# → Commits and pushes
# → Optionally verifies deployment
# → Runs health checks
# → Offers rollback on failure
```

## Monitoring and Observability

### Vercel Dashboard

**Access:** https://vercel.com/dashboard

**Features:**
- Real-time deployment status
- Build logs and errors
- Function execution logs
- Performance metrics
- Error tracking

### Application Logs

**Access:** Vercel Dashboard → Project → Logs

**Log Types:**
- Build logs
- Function logs (API routes)
- Edge function logs
- Static file requests

**Structured Logging:**
```json
{
  "level": "error",
  "message": "Database query failed",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "query": "SELECT * FROM recipes",
  "duration": 1500
}
```

### Health Monitoring

**Endpoint:** `https://your-app.vercel.app/api/health`

**Monitoring Services:**
- UptimeRobot
- Pingdom
- StatusCake
- Custom monitoring scripts

**Example Monitoring Script:**
```bash
#!/bin/bash
HEALTH_URL="https://your-app.vercel.app/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" != "200" ]; then
  echo "Health check failed: $RESPONSE"
  # Send alert
fi
```

### Performance Monitoring

**Metrics Tracked:**
- API response times
- Database query durations
- Page load times
- Function execution times

**Slow Request Alerts:**
- API requests > 1000ms
- Database queries > 500ms

### Error Tracking

**Current Implementation:**
- Console-based logging
- Structured JSON format
- Environment-aware

**Future Integration:**
- Sentry for error tracking
- LogRocket for session replay
- DataDog for APM

## Rollback Procedures

### Automatic Rollback (via deployment script)

```bash
npm run deploy

# If deployment fails:
# → Script offers rollback option
# → Reverts to previous commit
# → Force pushes to GitHub
# → Vercel automatically redeploys previous version
```

### Manual Rollback (via Vercel)

1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find previous successful deployment
4. Click "Promote to Production"

### Manual Rollback (via Git)

```bash
# Find previous commit
git log --oneline

# Revert to previous commit
git reset --hard <commit-hash>

# Force push
git push --force origin main

# Vercel automatically redeploys
```

### Database Rollback (via Neon)

1. Go to Neon Console
2. Navigate to your database
3. Use point-in-time recovery
4. Restore to timestamp before migration

## Troubleshooting

### Deployment Fails

**Check:**
1. Build logs in Vercel dashboard
2. Environment variables are set correctly
3. Database connection is working
4. All tests are passing

**Common Issues:**
- Missing environment variables
- Database connection timeout
- Build errors (TypeScript, ESLint)
- Dependency installation failures

### Health Check Fails

**Check:**
1. Database connection string
2. Database is accessible from Vercel
3. Health endpoint is deployed
4. No runtime errors

**Debug:**
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Check response
curl -v https://your-app.vercel.app/api/health
```

### Migration Fails

**Check:**
1. Migration files are valid SQL
2. Database credentials are correct
3. Database is accessible
4. No conflicting migrations

**Debug:**
```bash
# Run migrations locally
npm run db:migrate

# Check migration status
npm run db:studio
```

### Slow Performance

**Check:**
1. Database query performance
2. API response times in logs
3. Function execution times
4. Network latency

**Optimize:**
- Add database indexes
- Implement caching
- Optimize queries
- Use edge functions

## Security

### Headers

Configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Environment Variables

- Never commit secrets to Git
- Use GitHub Secrets for CI/CD
- Use Vercel Environment Variables for deployment
- Rotate secrets regularly

### Database Security

- Use connection pooling
- Enable SSL connections
- Restrict IP access (if needed)
- Use separate databases for dev/prod

### API Security

- Implement rate limiting
- Use authentication middleware
- Validate all inputs
- Sanitize user data

## Performance Optimization

### Build Optimization

- Next.js automatic code splitting
- Image optimization
- Static generation where possible
- Edge runtime for API routes

### Database Optimization

- Connection pooling via Neon
- Query optimization with indexes
- Full-text search with PostgreSQL
- Caching frequently accessed data

### Caching Strategy

- Static assets: 1 year cache
- API responses: No cache (dynamic)
- Images: CDN caching
- Database queries: Redis caching (optional)

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check deployment status
- Review performance metrics

**Weekly:**
- Review slow queries
- Check disk usage
- Update dependencies

**Monthly:**
- Rotate secrets
- Review security headers
- Optimize database
- Clean up old deployments

### Backup Strategy

**Database:**
- Neon automatic backups
- Point-in-time recovery available
- Manual exports via export service

**Code:**
- Git version control
- GitHub repository
- Multiple branches

**Environment Variables:**
- Document in `.env.example`
- Store securely in password manager
- Keep backup of production values

## Requirements Validation

### Requirement 8.1: Automated Data Storage ✅
- Automated git operations via CI/CD
- Database migrations automated
- Vercel automatic deployments
- Version control for all code

### Requirement 8.4: System Maintenance and Availability ✅
- Health checks verify availability
- Monitoring tracks system health
- Automated deployments maintain consistency
- Rollback procedures ensure stability
- Error tracking identifies issues

## Future Enhancements

**Monitoring:**
- Integrate Sentry for error tracking
- Add DataDog for APM
- Implement custom dashboards

**Deployment:**
- Blue-green deployments
- Canary releases
- A/B testing infrastructure

**Testing:**
- E2E tests in CI/CD
- Performance regression tests
- Load testing automation

**Security:**
- Automated security scanning
- Dependency vulnerability checks
- OWASP compliance testing

## Support

**Documentation:**
- `.github/DEPLOYMENT_SYSTEM.md` - Deployment script
- `scripts/DEPLOYMENT.md` - Manual deployment
- `scripts/TESTING.md` - Testing procedures

**Resources:**
- Vercel Documentation: https://vercel.com/docs
- Neon Documentation: https://neon.tech/docs
- Next.js Documentation: https://nextjs.org/docs

**Contact:**
- Check GitHub Issues
- Review Vercel logs
- Consult team documentation

## Conclusion

The deployment pipeline is fully configured and production-ready with:

✅ Vercel configuration with environment variables  
✅ Automated CI/CD pipeline with GitHub Actions  
✅ Database migration automation  
✅ Health check verification  
✅ Monitoring and error tracking  
✅ Security headers and best practices  
✅ Rollback procedures  
✅ Comprehensive documentation  

All requirements for Task 10.3 have been successfully completed.
