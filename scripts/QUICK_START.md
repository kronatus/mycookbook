# Quick Start: Automated Deployment

## TL;DR

```bash
# Make your changes, then:
npm run deploy
```

That's it! The script will:
1. ✅ Analyze your changes
2. ✅ Generate a smart commit message
3. ✅ Commit and push to GitHub
4. ✅ Verify Vercel deployment (optional)
5. ✅ Run health checks
6. ✅ Offer rollback if anything fails

## Common Commands

```bash
# Full deployment with verification
npm run deploy

# Alternative ways to run
./scripts/deploy.sh        # Linux/Mac
.\scripts\deploy.ps1       # Windows PowerShell
.\scripts\deploy.bat       # Windows CMD
```

## Quick Examples

### Example 1: Accept Suggested Message
```
npm run deploy
# Proposed: feat(api): update API endpoints
# Type: y
```

### Example 2: Custom Message
```
npm run deploy
# Proposed: feat(api): update API endpoints
# Type: custom
# Enter: fix(auth): resolve session timeout issue
```

### Example 3: Skip Verification
```
npm run deploy
# Type: y (for commit message)
# Type: n (for deployment verification)
```

## What Gets Automated

| Task | Automated? | Details |
|------|-----------|---------|
| Analyze changes | ✅ Yes | Detects file types and changes |
| Generate commit message | ✅ Yes | Smart conventional commits |
| Stage files | ✅ Yes | `git add .` |
| Commit | ✅ Yes | With generated/custom message |
| Push | ✅ Yes | To current branch |
| Wait for deployment | ⚠️ Optional | You choose |
| Health checks | ⚠️ Optional | If you verify deployment |
| Rollback | ⚠️ On failure | If deployment fails |

## Commit Message Examples

The script automatically generates messages like:

- `feat(api): update API endpoints` - API changes
- `feat(ui): update UI components` - UI changes
- `feat(db): update database schema` - Database changes
- `docs: update documentation` - Documentation
- `test: update tests` - Test changes
- `ci: update CI/CD configuration` - CI/CD changes
- `chore(scripts): update build scripts` - Script changes

## When to Use

✅ **Use this script when:**
- You want automated commit messages
- You want deployment verification
- You want health checks
- You want rollback capability
- You're deploying to production

❌ **Don't use when:**
- You need a very specific commit message (use custom option)
- You're in the middle of a complex git operation
- You want to commit only specific files (use git directly)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Permission denied | `chmod +x scripts/deploy.sh` (Linux/Mac) |
| Script won't run | Use `npm run deploy` instead |
| Push fails | Pull latest changes first: `git pull` |
| Health check fails | Check Vercel dashboard and database |

## Need More Info?

- **Full Documentation**: `scripts/DEPLOYMENT.md`
- **Testing Guide**: `scripts/TESTING.md`
- **Scripts Overview**: `scripts/README.md`
- **System Overview**: `.github/DEPLOYMENT_SYSTEM.md`

## Pro Tips

💡 **Tip 1**: The script remembers your last commit for rollback  
💡 **Tip 2**: You can skip deployment verification to save time  
💡 **Tip 3**: Custom messages are great for specific fixes  
💡 **Tip 4**: Health checks ensure your deployment actually works  
💡 **Tip 5**: Rollback is automatic if deployment fails  

## Support

Having issues? Check:
1. Git is installed and configured
2. You're in a git repository
3. You have changes to commit
4. Your remote is configured correctly
5. Vercel project is connected (for verification)

---

**Ready to deploy?** Just run: `npm run deploy` 🚀
