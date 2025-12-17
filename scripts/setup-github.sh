#!/bin/bash

# GitHub Repository Setup Script
# This script helps initialize the GitHub repository with proper configuration

set -e

echo "🚀 Personal Cookbook - GitHub Setup Script"
echo "=========================================="
echo ""

# Repository configuration
REPO_NAME="mycookbook"
GITHUB_USER="kronatus"
GITHUB_EMAIL="soplace@gmail.com"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: git is not installed"
    echo "Please install git and try again"
    exit 1
fi

# Check if GitHub CLI is installed (optional but recommended)
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI detected"
    GH_CLI_AVAILABLE=true
else
    echo "ℹ️  GitHub CLI not found (optional)"
    echo "   Install from: https://cli.github.com/"
    GH_CLI_AVAILABLE=false
fi

echo ""
echo "Repository Configuration:"
echo "  Name: ${REPO_NAME}"
echo "  User: ${GITHUB_USER}"
echo "  Email: ${GITHUB_EMAIL}"
echo "  URL: ${REPO_URL}"
echo ""

# Configure git user
echo "📝 Configuring git user..."
git config user.name "${GITHUB_USER}"
git config user.email "${GITHUB_EMAIL}"
echo "✅ Git user configured"

# Check if already initialized
if [ -d .git ]; then
    echo "ℹ️  Git repository already initialized"
else
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
fi

# Check if remote exists
if git remote get-url origin &> /dev/null; then
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "ℹ️  Remote 'origin' already exists: ${CURRENT_REMOTE}"
    
    if [ "${CURRENT_REMOTE}" != "${REPO_URL}" ]; then
        read -p "⚠️  Remote URL doesn't match. Update it? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote set-url origin "${REPO_URL}"
            echo "✅ Remote URL updated"
        fi
    fi
else
    echo "🔗 Adding remote repository..."
    git remote add origin "${REPO_URL}"
    echo "✅ Remote added: ${REPO_URL}"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "${CURRENT_BRANCH}" ]; then
    echo "🌿 Creating main branch..."
    git checkout -b main
    echo "✅ Main branch created"
elif [ "${CURRENT_BRANCH}" != "main" ]; then
    echo "ℹ️  Current branch: ${CURRENT_BRANCH}"
    read -p "Switch to main branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout -b main 2>/dev/null || git checkout main
        echo "✅ Switched to main branch"
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "📋 Uncommitted changes detected"
    echo ""
    git status --short
    echo ""
    read -p "Create initial commit? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Staging all files..."
        git add .
        
        echo "💾 Creating initial commit..."
        git commit -m "chore: initial commit - Personal Cookbook application

- Set up Next.js 14 project with TypeScript
- Configure Drizzle ORM with Neon PostgreSQL
- Implement recipe management and ingestion features
- Add GitHub Actions CI/CD pipeline
- Configure branch protection and automation

Repository: ${REPO_URL}"
        echo "✅ Initial commit created"
    fi
fi

# Push to GitHub
echo ""
read -p "Push to GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to GitHub..."
    
    # Check if we need to set upstream
    if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} &> /dev/null; then
        git push -u origin main
    else
        git push
    fi
    
    echo "✅ Pushed to GitHub"
fi

# Create develop branch
echo ""
read -p "Create and push develop branch? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if git show-ref --verify --quiet refs/heads/develop; then
        echo "ℹ️  Develop branch already exists"
    else
        echo "🌿 Creating develop branch..."
        git checkout -b develop
        git push -u origin develop
        git checkout main
        echo "✅ Develop branch created and pushed"
    fi
fi

# GitHub CLI setup (if available)
if [ "$GH_CLI_AVAILABLE" = true ]; then
    echo ""
    read -p "Configure GitHub repository settings via CLI? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔧 Configuring repository settings..."
        
        # Set repository description
        gh repo edit --description "Personal cookbook web application for aggregating and managing recipes from various sources"
        
        # Enable features
        gh repo edit --enable-issues --enable-wiki=false --enable-projects=false
        
        echo "✅ Repository settings configured"
        
        # Branch protection
        echo ""
        read -p "Set up branch protection rules? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🛡️  Setting up branch protection..."
            echo "Note: This requires admin access to the repository"
            
            # Protect main branch
            gh api repos/${GITHUB_USER}/${REPO_NAME}/branches/main/protection \
                --method PUT \
                --field required_status_checks='{"strict":true,"contexts":["Run Tests"]}' \
                --field enforce_admins=false \
                --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
                --field restrictions=null \
                2>/dev/null && echo "✅ Main branch protected" || echo "⚠️  Could not set branch protection (may require admin access)"
        fi
    fi
fi

echo ""
echo "=========================================="
echo "✅ GitHub setup complete!"
echo ""
echo "Next steps:"
echo "  1. Configure GitHub secrets (see .github/SETUP.md)"
echo "  2. Connect repository to Vercel"
echo "  3. Set up Neon database branches"
echo "  4. Configure environment variables"
echo ""
echo "Documentation:"
echo "  - Setup Guide: .github/SETUP.md"
echo "  - Contributing: CONTRIBUTING.md"
echo "  - README: README.md"
echo ""
echo "Happy coding! 🍳"
