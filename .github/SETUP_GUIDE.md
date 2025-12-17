# Deployment Pipeline Setup Guide

## Quick Start

This guide will help you set up the complete deployment pipeline for the Personal Cookbook application.

## Prerequisites

- GitHub account
- Vercel account
- Neon PostgreSQL account
- Node.js 18+ installed locally

## Step 1: Database Setup (Neon)

### 1.1 Create Neon Project

1. Go to https://neon.tech
2. Sign in or create an account
3. Click "Create Project"
4. Name your project: "personal-cookbook"
5. Select region: US East (Ohio) or closest to you

### 1.2 Create Database Branches

**Main Branch (Production):**
- Automatically created with project
- Copy connection string
- Save as `NEON_DATABASE_URL`

**Development Branch:**
1. Click "Branches" in sidebar
2. Click "Create Branch"
3. Name: "development"
4. Copy connection string
5. Save as `NEON_DEV_DATABASE_URL`

### 1.3 Connection Strings Format

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

Example:
```
postgresql://user:pass@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Step 2: Vercel Setup

### 2.1 Create Vercel Project

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### 2.2 Configure Environment Variables

**Production Environment:**

Go to: Project Settings → Environment Variables → Production

Add the following:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEON_DATABASE_URL` | `postgresql://...` | Production database URL |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Auth secret |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production URL |
| `BLOB_READ_WRITE_TOKEN` | From Vercel Blob settings | File upload token |

**Preview Environment:**

Go to: Project Settings → Environment Variables → Preview

Add the following:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEON_DATABASE_URL` | `postgresql://...` (dev branch) | Dev database URL |
| `NEXTAUTH_SECRET` | Same as production | Auth secret |
| `NEXTAUTH_URL` | Leave empty (auto-generated) | Preview URL |
| `BLOB_READ_WRITE_TOKEN` | Same as production | File upload token |

**Development Environment:**

Go to: Project Settings → Environment Variables → Development

Add the following:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEON_DEV_DATABASE_URL` | `postgresql://...` (dev branch) | Dev database URL |
| `NEXTAUTH_SECRET` | Same as production | Auth secret |
| `NEXTAUTH_URL` | `http://localhost:3000` | Local URL |

### 2.3 Get Vercel Tokens

**Vercel API Token:**
1. Go to Account Settings → Tokens
2. Click "Create Token"
3. Name: "GitHub Actions"
4. Scope: Full Account
5. Copy token (save as `VERCEL_TOKEN`)

**Organization ID:**
1. Go to Account Settings → General
2. Copy "Team ID" or "User ID"
3. Save as `VERCEL_ORG_ID`

**Project ID:**
1. Go to Project Settings → General
2. Copy "Project ID"
3. Save as `VERCEL_PROJECT_ID`

### 2.4 Enable Vercel Blob (Optional)

1. Go to Storage tab in Vercel dashboard
2. Click "Create Database"
3. Select "Blob"
4. Copy the token
5. Add to environment variables as `BLOB_READ_WRITE_TOKEN`

## Step 3: GitHub Setup

### 3.1 Configure Repository Secrets

Go to: Repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Value | Source |
|------------|-------|--------|
| `NEON_DATABASE_URL` | Production DB URL | Neon main branch |
| `NEON_DEV_DATABASE_URL` | Development DB URL | Neon dev branch |
| `NEXTAUTH_SECRET` | Generated secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | Vercel production URL |
| `BLOB_READ_WRITE_TOKEN` | Blob token | Vercel Blob settings |
| `VERCEL_TOKEN` | API token | Vercel account settings |
| `VERCEL_ORG_ID` | Organization ID | Vercel account settings |
| `VERCEL_PROJECT_ID` | Project ID | Vercel project settings |

### 3.2 Enable GitHub Actions

1. Go to: Repository → Settings → Actions → General
2. Set "Actions permissions" to "Allow all actions"
3. Set "Workflow permissions" to "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Click "Save"

### 3.3 Configure Branch Protection (Optional)

Go to: Repository → Settings → Branches

**Protect main branch:**
1. Click "Add rule"
2. Branch name pattern: `main`
3. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
4. Select status checks:
   - Run Tests
   - Run linter
5. Click "Create"

## Step 4: Local Development Setup

### 4.1 Clone Repository

```bash
git clone https://github.com/your-username/personal-cookbook.git
cd personal-cookbook
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Configure Local Environment

Create `.env.local` file:

```bash
# Copy from example
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Development database (Neon dev branch)
NEON_DEV_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dev

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Vercel Blob Storage (optional for local dev)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### 4.4 Validate Environment

```bash
npm run validate-env
```

Expected output:
```
✅ NEON_DEV_DATABASE_URL
✅ NEXTAUTH_SECRET
✅ NEXTAUTH_URL
✅ NODE_ENV
⚠️  BLOB_READ_WRITE_TOKEN is not set (optional)

✅ Validation Passed
```

### 4.5 Run Database Migrations

```bash
npm run db:migrate
```

### 4.6 Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Step 5: Verify Deployment Pipeline

### 5.1 Test CI/CD Pipeline

Create a test branch:

```bash
git checkout -b test/pipeline
echo "# Test" >> README.md
git add .
git commit -m "test: verify CI/CD pipeline"
git push origin test/pipeline
```

Create pull request on GitHub:
1. Go to repository on GitHub
2. Click "Pull requests"
3. Click "New pull request"
4. Select `test/pipeline` branch
5. Click "Create pull request"

**Expected Results:**
- ✅ Tests run automatically
- ✅ Linter runs automatically
- ✅ Preview deployment created
- ✅ Comment added to PR with preview URL

### 5.2 Test Production Deployment

Merge to main:

```bash
git checkout main
git merge test/pipeline
git push origin main
```

**Expected Results:**
- ✅ Tests run automatically
- ✅ Database migrations run
- ✅ Production deployment created
- ✅ Health check passes
- ✅ Deployment notification created

### 5.3 Verify Health Endpoint

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "message": "Database connection successful",
  "version": "0.1.0"
}
```

## Step 6: Monitoring Setup

### 6.1 Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. View real-time logs

### 6.2 Error Tracking (Optional)

**Sentry Integration:**
1. Create Sentry account
2. Create new project
3. Get DSN
4. Add to environment variables: `SENTRY_DSN`
5. Update `src/lib/monitoring.ts` to use Sentry

### 6.3 Uptime Monitoring (Optional)

**UptimeRobot:**
1. Create UptimeRobot account
2. Add new monitor
3. Type: HTTP(s)
4. URL: `https://your-app.vercel.app/api/health`
5. Interval: 5 minutes
6. Set up alerts

## Troubleshooting

### Build Fails

**Check:**
- Environment variables are set correctly
- All dependencies are installed
- TypeScript compiles without errors
- Tests pass locally

**Debug:**
```bash
npm run lint
npm test
npm run build
```

### Database Connection Fails

**Check:**
- Database URL is correct
- Database is accessible from Vercel
- SSL mode is enabled
- Connection pooling is configured

**Debug:**
```bash
npm run validate-env:db
```

### Deployment Fails

**Check:**
- Vercel token is valid
- Organization ID is correct
- Project ID is correct
- GitHub Actions has permissions

**Debug:**
- Check GitHub Actions logs
- Check Vercel deployment logs
- Verify environment variables

### Health Check Fails

**Check:**
- Application is deployed
- Database is connected
- Health endpoint is accessible
- No runtime errors

**Debug:**
```bash
curl -v https://your-app.vercel.app/api/health
```

## Maintenance

### Daily
- Monitor error logs in Vercel dashboard
- Check deployment status
- Review performance metrics

### Weekly
- Review slow queries
- Check disk usage
- Update dependencies

### Monthly
- Rotate secrets
- Review security headers
- Optimize database
- Clean up old deployments

## Security Checklist

- [ ] All secrets stored in GitHub Secrets
- [ ] Environment variables not committed to Git
- [ ] Database uses SSL connections
- [ ] API routes have authentication
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] CORS configured correctly

## Next Steps

1. Set up custom domain in Vercel
2. Configure email notifications
3. Set up monitoring dashboards
4. Implement automated backups
5. Add performance monitoring
6. Set up error tracking service

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Deployment Pipeline Documentation](.github/DEPLOYMENT_PIPELINE.md)
- [Monitoring Documentation](../src/lib/MONITORING.md)

## Support

For issues or questions:
1. Check documentation in `.github/` directory
2. Review Vercel logs
3. Check GitHub Actions logs
4. Consult team documentation
5. Create GitHub issue

## Conclusion

Your deployment pipeline is now fully configured! 🎉

The system will automatically:
- Run tests on every push
- Deploy previews for pull requests
- Deploy to production on main branch merges
- Run database migrations
- Verify deployment health
- Track errors and performance

Happy deploying! 🚀
