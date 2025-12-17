# Automated Deployment Script

## Overview

The automated deployment script provides intelligent commit message generation, automated git operations, Vercel deployment verification, and rollback capabilities for failed deployments.

## Features

### 1. Intelligent Commit Message Generation
- Analyzes changed files to determine commit type (feat, fix, docs, test, chore, ci)
- Automatically detects scope based on file paths (api, ui, db, services, etc.)
- Generates descriptive commit messages following conventional commits format
- Supports custom commit messages

### 2. Automated Git Operations
- Stages all changes automatically
- Creates commits with generated or custom messages
- Pushes to remote repository with upstream tracking
- Handles both new and existing branches

### 3. Vercel Deployment Verification
- Waits for Vercel deployment to complete
- Performs health checks on deployed application
- Verifies database connectivity
- Checks API endpoint availability

### 4. Rollback Mechanism
- Stores previous commit hash before deployment
- Offers rollback option if deployment fails
- Performs force push to revert changes
- Ensures system stability

## Usage

### Quick Start

```bash
# Using npm script (recommended)
npm run deploy

# Using shell scripts directly
./scripts/deploy.sh        # Linux/Mac
.\scripts\deploy.ps1       # Windows PowerShell
.\scripts\deploy.bat       # Windows Command Prompt

# Using tsx directly
npx tsx scripts/deploy.ts
```

### Interactive Flow

1. **Change Analysis**: Script analyzes git changes and displays summary
2. **Commit Message**: Proposes intelligent commit message (can customize)
3. **Confirmation**: Asks for confirmation before committing
4. **Push**: Commits and pushes changes to GitHub
5. **Deployment Verification** (optional): Waits for and verifies Vercel deployment
6. **Health Check**: Runs health checks on deployed application
7. **Rollback** (if needed): Offers rollback if deployment fails

### Example Session

```
================================
🚀 Automated Deployment Script
================================

📊 Changes detected:
   ✨ Added: 2 file(s)
   📝 Modified: 3 file(s)

💬 Proposed commit message:
   feat(api): update API endpoints

Use this message? (y/n/custom): y

📦 Staging changes...
💾 Creating commit...
🚀 Pushing to origin/main...
✅ Successfully pushed to GitHub!

Wait for and verify Vercel deployment? (y/n): y

⏳ Waiting for Vercel deployment...
(This may take a few minutes)

🏥 Running health checks...
Checking: https://your-app.vercel.app/api/health
✅ Health check passed!
   Status: healthy
   Database: connected
   Version: 0.1.0

✅ Deployment successful and healthy!
🌐 URL: https://your-app.vercel.app

================================
✨ Done!
================================
```

## Commit Message Format

The script follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>
```

### Commit Types

- **feat**: New feature or enhancement
- **fix**: Bug fix
- **docs**: Documentation changes
- **test**: Test additions or modifications
- **chore**: Maintenance tasks
- **ci**: CI/CD configuration changes
- **refactor**: Code refactoring
- **style**: Code style changes (formatting, etc.)

### Automatic Scope Detection

| File Pattern | Scope | Example |
|-------------|-------|---------|
| `app/api/` | api | `feat(api): update API endpoints` |
| `components/` | ui | `feat(ui): update UI components` |
| `src/services/` | services | `feat(services): update services` |
| `src/db/` | db | `feat(db): update database schema` |
| `scripts/` | scripts | `chore(scripts): update build scripts` |
| `.github/` | - | `ci: update CI/CD configuration` |
| `*.md`, `docs/` | - | `docs: update documentation` |
| `test`, `spec` | - | `test: update tests` |

## Health Check Endpoint

The script uses the `/api/health` endpoint to verify deployment:

### Response Format

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "version": "0.1.0"
}
```

### Status Codes

- **200**: Healthy - all systems operational
- **503**: Unhealthy - service degraded or unavailable

## Rollback Process

If deployment fails or health checks don't pass:

1. Script offers rollback option
2. User confirms rollback (y/n)
3. Git resets to previous commit
4. Force pushes to remote repository
5. Vercel automatically redeploys previous version

### Manual Rollback

If needed, you can manually rollback:

```bash
# Find the commit to rollback to
git log --oneline

# Reset to that commit
git reset --hard <commit-hash>

# Force push
git push --force
```

## Configuration

### Environment Variables

The script uses standard git configuration and doesn't require additional environment variables. However, for Vercel CLI integration:

```bash
# Optional: Install Vercel CLI for enhanced deployment tracking
npm install -g vercel

# Login to Vercel
vercel login
```

### Git Configuration

Ensure git is configured with your credentials:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Troubleshooting

### Script Won't Run

**Problem**: Permission denied or script not found

**Solution**:
```bash
# Make script executable (Linux/Mac)
chmod +x scripts/deploy.sh

# Or use npm script
npm run deploy
```

### Push Fails

**Problem**: Push rejected or authentication failed

**Solution**:
```bash
# Pull latest changes first
git pull --rebase

# Check remote configuration
git remote -v

# Re-authenticate if needed
git config credential.helper store
```

### Health Check Fails

**Problem**: Health check returns 503 or times out

**Solution**:
1. Check Vercel dashboard for deployment status
2. Verify database connection string in environment variables
3. Check application logs in Vercel
4. Consider rollback if issue persists

### Deployment Timeout

**Problem**: Script times out waiting for deployment

**Solution**:
1. Check Vercel dashboard manually
2. Deployment may still be in progress
3. Script timeout is set to 5 minutes
4. Large deployments may take longer

## Advanced Usage

### Skip Deployment Verification

If you want to push without waiting for deployment:

```bash
npm run deploy
# When prompted: "Wait for and verify Vercel deployment? (y/n): n"
```

### Custom Commit Messages

Always use custom messages for specific scenarios:

```bash
npm run deploy
# When prompted: "Use this message? (y/n/custom): custom"
# Enter: "fix(auth): resolve session timeout issue"
```

### Automated CI/CD Integration

For GitHub Actions integration, see `.github/workflows/` directory.

## Requirements

- Node.js 18+ with npm
- Git installed and configured
- GitHub repository initialized
- Vercel project connected (for deployment verification)
- curl (for health checks)

## Related Scripts

- `commit-and-push.sh/ps1/bat`: Simple commit and push without deployment verification
- `setup-github.sh/ps1/bat`: Initial GitHub repository setup
- `optimize-database.ts`: Database optimization script

## Support

For issues or questions:
1. Check Vercel dashboard for deployment status
2. Review application logs
3. Check GitHub Actions for CI/CD issues
4. Verify environment variables are set correctly

## Requirements Validation

This script fulfills the following requirements:

- **Requirement 8.1**: Automated git operations with intelligent commit messages
- **Requirement 8.4**: Deployment verification and rollback mechanisms
