# Smart Commit & Push Guide

Quick reference for using the intelligent commit and push scripts.

## Overview

The `commit-and-push` scripts automatically analyze your changes and generate meaningful commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Usage

### PowerShell (Recommended for Windows)
```powershell
.\scripts\commit-and-push.ps1
```

### Command Prompt
```cmd
scripts\commit-and-push.bat
```

### Bash (Git Bash/Unix/Mac)
```bash
bash scripts/commit-and-push.sh
```

## How It Works

1. **Analyzes Changes**: Scans all modified, added, and deleted files
2. **Determines Type**: Identifies the type of changes (feat, fix, docs, etc.)
3. **Generates Message**: Creates a conventional commit message
4. **Asks for Confirmation**: Lets you approve, reject, or customize the message
5. **Commits**: Stages all changes and creates the commit
6. **Pushes**: Optionally pushes to GitHub

## Commit Types

The script automatically detects commit types based on file patterns:

| Type | When Used | Example |
|------|-----------|---------|
| `feat` | New features or updates to components, API, services | `feat: update UI components` |
| `fix` | Bug fixes | `fix: resolve login issue` |
| `docs` | Documentation changes (`.md` files) | `docs: update README` |
| `test` | Test files | `test: add unit tests` |
| `chore` | Build scripts, configuration | `chore: update build scripts` |
| `ci` | CI/CD changes (`.github/` files) | `ci: update GitHub Actions` |

## File Pattern Detection

The script looks for these patterns to determine commit type:

- **Components**: `components/` → `feat: update UI components`
- **API**: `app/api/` → `feat: update API endpoints`
- **Services**: `src/services/` → `feat: update services`
- **Database**: `src/db/`, `drizzle` → `feat: update database schema`
- **Tests**: `test`, `spec` → `test: update tests`
- **Docs**: `.md`, `docs/` → `docs: update documentation`
- **Scripts**: `scripts/` → `chore: update build scripts`
- **CI/CD**: `.github/` → `ci: update CI/CD configuration`

## Examples

### Example 1: Modified a Component

**Changes:**
- Modified: `components/RecipeCard.tsx`

**Generated Message:**
```
feat: update UI components
```

### Example 2: Updated Documentation

**Changes:**
- Modified: `README.md`
- Modified: `.github/SETUP.md`

**Generated Message:**
```
docs: update documentation
```

### Example 3: Added Tests

**Changes:**
- Added: `src/services/__tests__/recipe-service.test.ts`

**Generated Message:**
```
test: update tests
```

### Example 4: Multiple Changes

**Changes:**
- Modified: `app/api/recipes/route.ts`
- Modified: `src/services/recipe-service.ts`
- Added: `src/services/__tests__/recipe-service.test.ts`

**Generated Message:**
```
feat: update services
```

## Interactive Options

When the script shows the proposed commit message, you have three options:

### 1. Accept (y)
```
Use this message? (y/n/custom): y
```
Uses the auto-generated message.

### 2. Reject (n)
```
Use this message? (y/n/custom): n
```
Cancels the commit operation.

### 3. Custom (custom or c)
```
Use this message? (y/n/custom): custom
Enter custom commit message: fix(auth): resolve token expiration issue
```
Lets you write your own commit message.

## Custom Commit Messages

When writing custom messages, follow the Conventional Commits format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples:

**Simple:**
```
feat: add recipe scaling
```

**With Scope:**
```
feat(api): add recipe scaling endpoint
```

**With Body:**
```
feat(api): add recipe scaling endpoint

Implement automatic ingredient quantity adjustment
when users change serving sizes.
```

**With Footer:**
```
fix(auth): resolve token expiration

Fixes #123
```

## Common Commit Types

### Features
```
feat: add new feature
feat(scope): add new feature with scope
```

### Bug Fixes
```
fix: resolve bug
fix(scope): resolve specific bug
```

### Documentation
```
docs: update documentation
docs(readme): update installation guide
```

### Tests
```
test: add unit tests
test(services): add recipe service tests
```

### Refactoring
```
refactor: restructure code
refactor(api): simplify route handlers
```

### Performance
```
perf: improve query performance
perf(db): optimize database queries
```

### Chores
```
chore: update dependencies
chore(deps): bump next from 14.0.0 to 14.1.0
```

### CI/CD
```
ci: update GitHub Actions
ci(deploy): add production deployment step
```

## Workflow

### Daily Development Workflow

1. **Make your changes** in your code editor
2. **Run the script**:
   ```powershell
   .\scripts\commit-and-push.ps1
   ```
3. **Review the proposed message**
4. **Confirm or customize**
5. **Push to GitHub** (when prompted)

### Quick Commit Without Push

If you want to commit but not push immediately:

1. Run the script
2. Confirm the commit message
3. Answer "n" when asked to push
4. Push later with: `git push`

## Troubleshooting

### No Changes Detected

**Message:**
```
No changes to commit
```

**Solution:** Make sure you have modified, added, or deleted files.

### Failed to Stage Changes

**Message:**
```
Error: Failed to stage changes
```

**Solution:** 
- Check for nested git repositories
- Ensure files aren't locked
- Check file permissions

### Failed to Push

**Message:**
```
Error: Failed to push to GitHub
```

**Solutions:**
1. Pull latest changes first: `git pull`
2. Check your GitHub credentials
3. Verify repository permissions
4. Ensure remote repository exists

### Not a Git Repository

**Message:**
```
Error: Not a git repository
```

**Solution:** Run the setup script first:
```powershell
.\scripts\setup-github.ps1
```

## Advanced Usage

### Skip the Script

If you prefer manual commits:

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat: your message here"

# Push
git push
```

### Amend Last Commit

If you need to modify the last commit:

```bash
# Make additional changes
git add .

# Amend the commit
git commit --amend --no-edit

# Force push (use carefully!)
git push --force-with-lease
```

### View Commit History

```bash
# View recent commits
git log --oneline -10

# View detailed history
git log
```

## Best Practices

1. **Commit Often**: Make small, focused commits
2. **Review Changes**: Always review what you're committing
3. **Write Clear Messages**: Be descriptive but concise
4. **Test Before Commit**: Run tests locally first
5. **Pull Before Push**: Keep your branch up to date
6. **Use Scopes**: Add scopes for better organization

## Integration with IDE

### VS Code

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Smart Commit & Push",
      "type": "shell",
      "command": ".\\scripts\\commit-and-push.ps1",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": false
      }
    }
  ]
}
```

Then run with: `Ctrl+Shift+B` → Select "Smart Commit & Push"

### Keyboard Shortcut

Create a keyboard shortcut in your terminal:

**PowerShell Profile** (`$PROFILE`):
```powershell
function Commit-And-Push {
    .\scripts\commit-and-push.ps1
}
Set-Alias -Name cap -Value Commit-And-Push
```

Then use: `cap` to run the script

## Related Documentation

- [Git Workflow Guide](.github/GIT_WORKFLOW.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Setup Guide](.github/SETUP.md)

## Support

For issues or questions:
- Check the [Git Workflow Guide](.github/GIT_WORKFLOW.md)
- Review [Troubleshooting](#troubleshooting) section
- Create an issue on GitHub
