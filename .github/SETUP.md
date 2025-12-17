# GitHub Repository Setup Guide

This guide will help you set up the GitHub repository for the Personal Cookbook project with proper automation and CI/CD pipeline.

## Repository Information

- **Repository Name**: mycookbook
- **GitHub User**: kronatus
- **Email**: soplace@gmail.com
- **Repository URL**: https://github.com/kronatus/mycookbook

## Initial Setup

### 1. Create GitHub Repository

#### Option A: Use Automated Setup Script (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\setup-github.ps1
```

**Windows (Command Prompt):**
```cmd
scripts\setup-github.bat
```

**Unix/Mac/Linux:**
```bash
bash scripts/setup-github.sh
```

The script will guide you through:
- Initializing the git repository
- Configuring git user settings
- Adding the remote repository
- Creating initial commit
- Pushing to GitHub
- Setting up develop branch

#### Option B: Manual Setup

If you prefer to set up manually:

```bash
# Initialize git if not already done
git init

# Add remote repository
git remote add origin https://github.com/kronatus/mycookbook.git

# Set up main branch
git branch -M main

# Initial commit and push
git add .
git commit -m "Initial commit: Personal Cookbook application"
git push -u origin main
```

### 2. Create Development Branch

```bash
# Create and push develop branch
git checkout -b develop
git push -u origin develop

# Return to main branch
git checkout main
```

## Branch Structure

The repository uses the following branch structure:

- **main**: Production-ready code, deployed to Vercel production
- **develop**: Development branch for integration testing
- **feature/***: Feature branches for new functionality
- **bugfix/***: Bug fix branches
- **hotfix/***: Emergency production fixes

## Branch Protection Rules

### Protect Main Branch

1. Go to: `Settings` → `Branches` → `Add branch protection rule`
2. Branch name pattern: `main`
3. Enable the following rules:
   - ✅ Require a pull request before merging
     - ✅ Require approvals (1 approval minimum)
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date before merging
     - Add required status checks:
       - `Run Tests`
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings

### Protect Develop Branch

1. Add another branch protection rule
2. Branch name pattern: `develop`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Add required status checks:
       - `Run Tests`

## GitHub Secrets Configuration

Configure the following secrets in your repository:

1. Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Required Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `NEON_DEV_DATABASE_URL` | Neon development branch connection string | From Neon dashboard → Development branch → Connection string |
| `NEON_DATABASE_URL` | Neon production branch connection string | From Neon dashboard → Main branch → Connection string |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | Your Vercel production URL (e.g., `https://mycookbook.vercel.app`) |
| `VERCEL_TOKEN` | Vercel deployment token | Vercel Dashboard → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel organization ID | Vercel Dashboard → Settings → General → Organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel Project Settings → General → Project ID |

### Adding Secrets via CLI (Optional)

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate
gh auth login

# Add secrets
gh secret set NEON_DEV_DATABASE_URL
gh secret set NEON_DATABASE_URL
gh secret set NEXTAUTH_SECRET
gh secret set NEXTAUTH_URL
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

## Vercel Integration

### Connect Vercel to GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `kronatus/mycookbook`
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
   - **Install Command**: `npm ci`

### Environment Variables in Vercel

Add the following environment variables in Vercel:

**Production Environment:**
- `NEON_DATABASE_URL`: Your Neon main branch connection string
- `NEXTAUTH_SECRET`: Same as GitHub secret
- `NEXTAUTH_URL`: Your production URL

**Preview Environment:**
- `NEON_DEV_DATABASE_URL`: Your Neon development branch connection string
- `NEXTAUTH_SECRET`: Same as GitHub secret
- `NEXTAUTH_URL`: Auto-generated preview URL

## Workflow Overview

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) includes:

1. **Test Job**: Runs on all pushes and pull requests
   - Linting
   - Unit tests
   - Build verification

2. **Deploy Preview**: Runs on pull requests
   - Deploys to Vercel preview environment
   - Uses development database branch
   - Comments PR with preview URL

3. **Deploy Production**: Runs on main branch pushes
   - Deploys to Vercel production
   - Uses production database branch
   - Creates deployment notification

### Development Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to GitHub
git push origin feature/my-new-feature

# 4. Create Pull Request to develop
# - GitHub Actions will run tests
# - Vercel will create preview deployment
# - Request review from team member

# 5. After approval, merge to develop
# - Delete feature branch

# 6. When ready for production, create PR from develop to main
# - Additional review required
# - After merge, automatic production deployment
```

## Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
<!-- Describe your changes in detail -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass locally
- [ ] Manual testing completed
- [ ] Property-based tests pass (if applicable)

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Related Issues
<!-- Link to related issues: Fixes #123 -->
```

## Monitoring and Notifications

### GitHub Notifications

Configure notification preferences:
1. Go to: `Settings` → `Notifications`
2. Enable notifications for:
   - Pull request reviews
   - CI/CD failures
   - Deployment status

### Vercel Notifications

1. Go to Vercel Dashboard → Project Settings → Notifications
2. Enable:
   - Deployment notifications
   - Build failure alerts
   - Performance insights

## Troubleshooting

### CI/CD Pipeline Fails

1. Check GitHub Actions logs: `Actions` tab in repository
2. Verify all secrets are correctly configured
3. Ensure Neon database is accessible
4. Check Vercel deployment logs

### Deployment Issues

1. Verify Vercel environment variables
2. Check database connection strings
3. Review build logs in Vercel dashboard
4. Ensure migrations are running correctly

### Branch Protection Issues

1. Verify you have admin access to the repository
2. Check that required status checks are passing
3. Ensure pull request has required approvals

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Neon Branching Guide](https://neon.tech/docs/guides/branching)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## Support

For issues or questions:
- Create an issue in the repository
- Check existing documentation
- Review GitHub Actions logs for detailed error messages
