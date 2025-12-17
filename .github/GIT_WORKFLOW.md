# Git Workflow Quick Reference

This guide provides quick reference commands for common Git operations in the Personal Cookbook project.

## Initial Setup

```bash
# Clone the repository
git clone https://github.com/kronatus/mycookbook.git
cd mycookbook

# Configure your identity
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Install dependencies
npm install
```

## Daily Development Workflow

### Starting a New Feature

```bash
# 1. Switch to develop and update
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/my-feature-name

# 3. Make your changes
# ... edit files ...

# 4. Check status
git status

# 5. Stage changes
git add .
# or stage specific files
git add path/to/file.ts

# 6. Commit with conventional commit message
git commit -m "feat: add new feature description"

# 7. Push to your branch
git push origin feature/my-feature-name
```

### Committing Changes

```bash
# Stage all changes
git add .

# Stage specific files
git add src/services/recipe-service.ts

# Commit with message
git commit -m "feat(recipes): add recipe scaling functionality"

# Amend last commit (if needed)
git commit --amend -m "feat(recipes): add recipe scaling functionality"
```

### Syncing with Remote

```bash
# Fetch latest changes
git fetch origin

# Pull latest changes from current branch
git pull

# Pull latest changes from develop
git checkout develop
git pull origin develop

# Update your feature branch with latest develop
git checkout feature/my-feature
git merge develop
# or use rebase for cleaner history
git rebase develop
```

## Branch Management

### Creating Branches

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Create branch from specific branch
git checkout -b feature/new-feature develop

# Push new branch to remote
git push -u origin feature/new-feature
```

### Switching Branches

```bash
# Switch to existing branch
git checkout main
git checkout develop
git checkout feature/my-feature

# Switch to previous branch
git checkout -
```

### Deleting Branches

```bash
# Delete local branch
git branch -d feature/old-feature

# Force delete local branch
git branch -D feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature
```

## Viewing History and Status

```bash
# View commit history
git log

# View compact history
git log --oneline

# View history with graph
git log --graph --oneline --all

# View changes in working directory
git diff

# View staged changes
git diff --staged

# View status
git status

# View status (short format)
git status -s
```

## Undoing Changes

### Unstage Files

```bash
# Unstage all files
git reset

# Unstage specific file
git reset path/to/file.ts
```

### Discard Changes

```bash
# Discard changes in working directory
git checkout -- path/to/file.ts

# Discard all changes
git checkout -- .

# Restore file from specific commit
git checkout abc123 -- path/to/file.ts
```

### Revert Commits

```bash
# Revert last commit (creates new commit)
git revert HEAD

# Revert specific commit
git revert abc123

# Reset to previous commit (dangerous!)
git reset --hard HEAD~1
```

## Stashing Changes

```bash
# Stash current changes
git stash

# Stash with message
git stash save "WIP: working on feature"

# List stashes
git stash list

# Apply most recent stash
git stash apply

# Apply and remove most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{1}

# Drop stash
git stash drop stash@{0}

# Clear all stashes
git stash clear
```

## Pull Requests

### Creating a Pull Request

```bash
# 1. Push your feature branch
git push origin feature/my-feature

# 2. Go to GitHub and create PR
# Or use GitHub CLI:
gh pr create --base develop --title "feat: my feature" --body "Description"
```

### Updating a Pull Request

```bash
# Make additional changes
git add .
git commit -m "fix: address review comments"
git push origin feature/my-feature

# Or amend and force push (use carefully!)
git add .
git commit --amend --no-edit
git push --force-with-lease origin feature/my-feature
```

## Resolving Conflicts

```bash
# 1. Update your branch
git checkout feature/my-feature
git fetch origin
git merge origin/develop

# 2. If conflicts occur, resolve them in your editor
# Look for conflict markers: <<<<<<<, =======, >>>>>>>

# 3. After resolving, stage the files
git add path/to/resolved-file.ts

# 4. Complete the merge
git commit

# 5. Push the resolved changes
git push origin feature/my-feature
```

## Tagging Releases

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to remote
git push origin v1.0.0

# Push all tags
git push origin --tags

# List tags
git tag

# Delete tag
git tag -d v1.0.0
git push origin --delete v1.0.0
```

## Useful Aliases

Add these to your `~/.gitconfig`:

```ini
[alias]
    st = status -s
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all
    amend = commit --amend --no-edit
```

## Common Scenarios

### Forgot to Create Feature Branch

```bash
# You're on develop and made changes
git stash
git checkout -b feature/my-feature
git stash pop
```

### Need to Switch Branches with Uncommitted Changes

```bash
# Stash changes
git stash

# Switch branch
git checkout other-branch

# Return and restore changes
git checkout original-branch
git stash pop
```

### Accidentally Committed to Wrong Branch

```bash
# On wrong branch
git log  # Note the commit hash

# Switch to correct branch
git checkout correct-branch

# Cherry-pick the commit
git cherry-pick abc123

# Go back and remove from wrong branch
git checkout wrong-branch
git reset --hard HEAD~1
```

### Update Feature Branch with Latest Develop

```bash
# Option 1: Merge (preserves history)
git checkout feature/my-feature
git merge develop

# Option 2: Rebase (cleaner history)
git checkout feature/my-feature
git rebase develop
```

## Emergency Procedures

### Undo Last Push (Use with Caution!)

```bash
# Only if no one else has pulled
git reset --hard HEAD~1
git push --force-with-lease origin feature/my-feature
```

### Recover Deleted Branch

```bash
# Find the commit hash
git reflog

# Recreate branch
git checkout -b recovered-branch abc123
```

### Abort Merge

```bash
git merge --abort
```

### Abort Rebase

```bash
git rebase --abort
```

## GitHub CLI Commands

```bash
# View pull requests
gh pr list

# Create pull request
gh pr create

# View PR details
gh pr view 123

# Checkout PR locally
gh pr checkout 123

# Merge PR
gh pr merge 123

# View issues
gh issue list

# Create issue
gh issue create
```

## Best Practices

1. **Commit Often**: Make small, focused commits
2. **Write Good Messages**: Follow conventional commit format
3. **Pull Before Push**: Always pull latest changes before pushing
4. **Review Before Commit**: Use `git diff` to review changes
5. **Test Before Push**: Run tests locally before pushing
6. **Keep Branches Updated**: Regularly merge/rebase with develop
7. **Clean Up**: Delete merged branches
8. **Use Stash**: Don't commit half-done work

## Getting Help

```bash
# Get help for any command
git help <command>
git <command> --help

# Quick help
git <command> -h
```

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub CLI](https://cli.github.com/)
