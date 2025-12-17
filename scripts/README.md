# Scripts Directory

This directory contains automation scripts for the Personal Cookbook project.

## Available Scripts

### Deployment Scripts

#### `deploy.ts` - Automated Deployment Script ⭐ NEW
**Primary deployment script with full automation**

Features:
- Intelligent commit message generation
- Automated git operations (stage, commit, push)
- Vercel deployment verification
- Health check validation
- Rollback mechanism for failed deployments

Usage:
```bash
npm run deploy                # Recommended
npx tsx scripts/deploy.ts     # Direct execution
./scripts/deploy.sh           # Linux/Mac
.\scripts\deploy.ps1          # Windows PowerShell
.\scripts\deploy.bat          # Windows CMD
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed documentation.

#### `commit-and-push.*` - Simple Commit Scripts
**Basic commit and push without deployment verification**

Features:
- Intelligent commit message generation
- Interactive git operations
- No deployment verification

Usage:
```bash
./scripts/commit-and-push.sh    # Linux/Mac
.\scripts\commit-and-push.ps1   # Windows PowerShell
.\scripts\commit-and-push.bat   # Windows CMD
```

### Setup Scripts

#### `setup-github.*` - GitHub Repository Setup
**Initialize GitHub repository and configure remote**

Usage:
```bash
./scripts/setup-github.sh       # Linux/Mac
.\scripts\setup-github.ps1      # Windows PowerShell
.\scripts\setup-github.bat      # Windows CMD
```

### Database Scripts

#### `optimize-database.ts` - Database Optimization
**Optimize database performance and indexes**

Usage:
```bash
npm run db:optimize
npx tsx scripts/optimize-database.ts
```

#### `run-migration.ts` - Database Migration Runner
**Execute database migrations**

Usage:
```bash
npx tsx scripts/run-migration.ts
```

### Build Scripts

#### `generate-migration.js` - Migration Generator
**Generate new database migration files**

Usage:
```bash
node scripts/generate-migration.js
```

#### `generate-pwa-icons.js` - PWA Icon Generator
**Generate PWA icons in various sizes**

Usage:
```bash
node scripts/generate-pwa-icons.js
```

## Quick Reference

| Task | Command |
|------|---------|
| Deploy with verification | `npm run deploy` |
| Simple commit & push | `./scripts/commit-and-push.sh` |
| Setup GitHub repo | `./scripts/setup-github.sh` |
| Optimize database | `npm run db:optimize` |
| Run migrations | `npm run db:migrate` |
| Generate migration | `node scripts/generate-migration.js` |

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment script documentation
- [TESTING.md](./TESTING.md) - Testing guide for deployment scripts
- [COMMIT_GUIDE.md](../.github/COMMIT_GUIDE.md) - Commit message conventions

## Requirements Fulfilled

### Task 10.2: Create Automated Deployment Script ✅

All requirements completed:

1. ✅ **Intelligent commit message generation**
   - Analyzes file changes
   - Determines commit type and scope
   - Follows conventional commits format
   - Supports custom messages

2. ✅ **Automated git operations**
   - Stages all changes
   - Creates commits
   - Pushes to remote
   - Handles upstream tracking

3. ✅ **Vercel deployment verification**
   - Waits for deployment completion
   - Performs health checks
   - Validates database connectivity
   - Checks API availability

4. ✅ **Rollback mechanism**
   - Stores previous commit
   - Offers rollback on failure
   - Performs git reset
   - Force pushes to revert

**Requirements validated:** 8.1, 8.4

## Platform Support

All scripts support multiple platforms:

- ✅ Linux (bash)
- ✅ macOS (bash)
- ✅ Windows (PowerShell)
- ✅ Windows (Command Prompt)
- ✅ Cross-platform (TypeScript with tsx)

## Dependencies

- Node.js 18+
- npm
- Git
- tsx (for TypeScript scripts)
- curl (for health checks)
- Vercel CLI (optional, for enhanced deployment tracking)

## Environment Variables

Scripts use standard git configuration and project environment variables:

```bash
# Git configuration (required)
git config user.name
git config user.email

# Database (for health checks)
NEON_DATABASE_URL
NEON_DEV_DATABASE_URL

# Vercel (optional)
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## Troubleshooting

### Permission Issues

**Linux/Mac:**
```bash
chmod +x scripts/*.sh
```

**Windows PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Git Issues

```bash
# Check git configuration
git config --list

# Set user info
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check remote
git remote -v
```

### Node/NPM Issues

```bash
# Check versions
node --version
npm --version

# Reinstall dependencies
npm install
```

## Contributing

When adding new scripts:

1. Create TypeScript version (`.ts`) for cross-platform support
2. Add shell wrappers (`.sh`, `.ps1`, `.bat`) for convenience
3. Update this README
4. Add documentation in separate `.md` file if complex
5. Add npm script in `package.json` if appropriate
6. Test on multiple platforms

## Support

For issues or questions:
1. Check script documentation
2. Review error messages
3. Check git/npm configuration
4. Verify environment variables
5. Check Vercel dashboard for deployment issues
