#!/bin/bash

# Intelligent Commit and Push Script
# Analyzes changes and generates meaningful commit messages

set -e

echo ""
echo "================================"
echo "Smart Commit & Push"
echo "================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "Error: Not a git repository"
    echo "Run setup-github.sh first to initialize the repository"
    exit 1
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit"
    exit 0
fi

echo "Analyzing changes..."
echo ""

# Get detailed status
ADDED=$(git status --porcelain | grep -c "^A\|^??" || true)
MODIFIED=$(git status --porcelain | grep -c "^ M\|^M" || true)
DELETED=$(git status --porcelain | grep -c "^ D\|^D" || true)

# Display changes summary
echo "Changes detected:"
[ $ADDED -gt 0 ] && echo "  Added: $ADDED file(s)"
[ $MODIFIED -gt 0 ] && echo "  Modified: $MODIFIED file(s)"
[ $DELETED -gt 0 ] && echo "  Deleted: $DELETED file(s)"
echo ""

# Determine commit type and description
COMMIT_TYPE="chore"
DESCRIPTION="update files"

# Get list of changed files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)

# Check for specific patterns
if echo "$CHANGED_FILES" | grep -qi "test\|spec"; then
    COMMIT_TYPE="test"
    DESCRIPTION="update tests"
fi

if echo "$CHANGED_FILES" | grep -qi "\.md$\|docs/"; then
    COMMIT_TYPE="docs"
    DESCRIPTION="update documentation"
fi

if echo "$CHANGED_FILES" | grep -qi "components/"; then
    COMMIT_TYPE="feat"
    DESCRIPTION="update UI components"
fi

if echo "$CHANGED_FILES" | grep -qi "app/api/"; then
    COMMIT_TYPE="feat"
    DESCRIPTION="update API endpoints"
fi

if echo "$CHANGED_FILES" | grep -qi "src/services/"; then
    COMMIT_TYPE="feat"
    DESCRIPTION="update services"
fi

if echo "$CHANGED_FILES" | grep -qi "src/db/\|drizzle"; then
    COMMIT_TYPE="feat"
    DESCRIPTION="update database schema"
fi

if echo "$CHANGED_FILES" | grep -qi "\.github/"; then
    COMMIT_TYPE="ci"
    DESCRIPTION="update CI/CD configuration"
fi

if echo "$CHANGED_FILES" | grep -qi "scripts/"; then
    COMMIT_TYPE="chore"
    DESCRIPTION="update build scripts"
fi

# Build commit message
COMMIT_MSG="${COMMIT_TYPE}: ${DESCRIPTION}"

# Show proposed commit message
echo "Proposed commit message:"
echo "  $COMMIT_MSG"
echo ""

# Ask for confirmation or custom message
read -p "Use this message? (y/n/custom): " CHOICE

if [ "$CHOICE" = "custom" ] || [ "$CHOICE" = "c" ]; then
    echo ""
    read -p "Enter custom commit message: " COMMIT_MSG
elif [ "$CHOICE" != "y" ] && [ "$CHOICE" != "Y" ]; then
    echo "Commit cancelled"
    exit 0
fi

# Stage all changes
echo ""
echo "Staging changes..."
git add .

if [ $? -ne 0 ]; then
    echo "Error: Failed to stage changes"
    exit 1
fi

# Commit
echo "Creating commit..."
git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
    echo "Error: Failed to create commit"
    exit 1
fi

echo "Commit created successfully!"
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Ask to push
read -p "Push to origin/$CURRENT_BRANCH? (y/n): " PUSH

if [ "$PUSH" = "y" ] || [ "$PUSH" = "Y" ]; then
    echo ""
    echo "Pushing to GitHub..."
    
    # Check if upstream is set
    if git rev-parse --abbrev-ref --symbolic-full-name @{u} &> /dev/null; then
        git push
    else
        git push -u origin "$CURRENT_BRANCH"
    fi
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to push to GitHub"
        echo "You may need to pull first or check your permissions"
        exit 1
    fi
    
    echo ""
    echo "Successfully pushed to GitHub!"
else
    echo ""
    echo "Commit created but not pushed"
    echo "Run 'git push' when ready"
fi

echo ""
echo "================================"
echo "Done!"
echo "================================"
echo ""
