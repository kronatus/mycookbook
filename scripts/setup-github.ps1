# GitHub Repository Setup Script for Windows (PowerShell)
# This script helps initialize the GitHub repository with proper configuration

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Personal Cookbook - GitHub Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Repository configuration
$REPO_NAME = "mycookbook"
$GITHUB_USER = "kronatus"
$GITHUB_EMAIL = "soplace@gmail.com"
$REPO_URL = "https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Check if git is installed
try {
    $null = git --version
} catch {
    Write-Host "Error: git is not installed" -ForegroundColor Red
    Write-Host "Please install git and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Repository Configuration:" -ForegroundColor Green
Write-Host "  Name: $REPO_NAME"
Write-Host "  User: $GITHUB_USER"
Write-Host "  Email: $GITHUB_EMAIL"
Write-Host "  URL: $REPO_URL"
Write-Host ""

# Configure git user
Write-Host "Configuring git user..." -ForegroundColor Yellow
git config user.name "$GITHUB_USER"
git config user.email "$GITHUB_EMAIL"
Write-Host "Git user configured" -ForegroundColor Green
Write-Host ""

# Check if already initialized
if (Test-Path .git) {
    Write-Host "Git repository already initialized" -ForegroundColor Cyan
} else {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git repository initialized" -ForegroundColor Green
}
Write-Host ""

# Check if remote exists
try {
    $currentRemote = git remote get-url origin 2>$null
    Write-Host "Remote 'origin' already exists: $currentRemote" -ForegroundColor Cyan
    
    if ($currentRemote -ne $REPO_URL) {
        $update = Read-Host "Remote URL doesn't match. Update it? (y/n)"
        if ($update -eq 'y' -or $update -eq 'Y') {
            git remote set-url origin "$REPO_URL"
            Write-Host "Remote URL updated" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    git remote add origin "$REPO_URL"
    Write-Host "Remote added: $REPO_URL" -ForegroundColor Green
}
Write-Host ""

# Check current branch
try {
    $currentBranch = git branch --show-current 2>$null
    if ([string]::IsNullOrEmpty($currentBranch)) {
        Write-Host "Creating main branch..." -ForegroundColor Yellow
        git checkout -b main
        Write-Host "Main branch created" -ForegroundColor Green
    } elseif ($currentBranch -ne "main") {
        Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan
        $switch = Read-Host "Switch to main branch? (y/n)"
        if ($switch -eq 'y' -or $switch -eq 'Y') {
            try {
                git checkout -b main 2>$null
            } catch {
                git checkout main
            }
            Write-Host "Switched to main branch" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Creating main branch..." -ForegroundColor Yellow
    git checkout -b main
    Write-Host "Main branch created" -ForegroundColor Green
}
Write-Host ""

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Uncommitted changes detected" -ForegroundColor Yellow
    Write-Host ""
    git status --short
    Write-Host ""
    $commit = Read-Host "Create initial commit? (y/n)"
    if ($commit -eq 'y' -or $commit -eq 'Y') {
        Write-Host "Staging all files..." -ForegroundColor Yellow
        git add .
        
        Write-Host "Creating initial commit..." -ForegroundColor Yellow
        $commitMessage = @"
chore: initial commit - Personal Cookbook application

- Set up Next.js 14 project with TypeScript
- Configure Drizzle ORM with Neon PostgreSQL
- Implement recipe management and ingestion features
- Add GitHub Actions CI/CD pipeline
- Configure branch protection and automation

Repository: $REPO_URL
"@
        git commit -m $commitMessage
        Write-Host "Initial commit created" -ForegroundColor Green
    }
}
Write-Host ""

# Push to GitHub
$push = Read-Host "Push to GitHub? (y/n)"
if ($push -eq 'y' -or $push -eq 'Y') {
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    
    try {
        # Check if upstream is set
        $null = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
        git push
    } catch {
        git push -u origin main
    }
    
    Write-Host "Pushed to GitHub" -ForegroundColor Green
}
Write-Host ""

# Create develop branch
$develop = Read-Host "Create and push develop branch? (y/n)"
if ($develop -eq 'y' -or $develop -eq 'Y') {
    try {
        $null = git show-ref --verify --quiet refs/heads/develop 2>$null
        Write-Host "Develop branch already exists" -ForegroundColor Cyan
    } catch {
        Write-Host "Creating develop branch..." -ForegroundColor Yellow
        git checkout -b develop
        git push -u origin develop
        git checkout main
        Write-Host "Develop branch created and pushed" -ForegroundColor Green
    }
}
Write-Host ""

# Check for GitHub CLI
try {
    $null = gh --version 2>$null
    $ghAvailable = $true
    Write-Host "GitHub CLI detected" -ForegroundColor Green
} catch {
    $ghAvailable = $false
    Write-Host "GitHub CLI not found (optional)" -ForegroundColor Cyan
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Cyan
}

# GitHub CLI setup (if available)
if ($ghAvailable) {
    Write-Host ""
    $configure = Read-Host "Configure GitHub repository settings via CLI? (y/n)"
    if ($configure -eq 'y' -or $configure -eq 'Y') {
        Write-Host "Configuring repository settings..." -ForegroundColor Yellow
        
        try {
            # Set repository description
            gh repo edit --description "Personal cookbook web application for aggregating and managing recipes from various sources"
            
            # Enable features
            gh repo edit --enable-issues --enable-wiki=false --enable-projects=false
            
            Write-Host "Repository settings configured" -ForegroundColor Green
        } catch {
            Write-Host "Could not configure repository settings (may require authentication)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure GitHub secrets (see .github/SETUP.md)"
Write-Host "  2. Connect repository to Vercel"
Write-Host "  3. Set up Neon database branches"
Write-Host "  4. Configure environment variables"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Setup Guide: .github/SETUP.md"
Write-Host "  - Contributing: CONTRIBUTING.md"
Write-Host "  - README: README.md"
Write-Host ""
Write-Host "Happy coding! " -NoNewline
Write-Host "🍳" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
