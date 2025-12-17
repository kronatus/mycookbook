# Intelligent Commit and Push Script
# Analyzes changes and generates meaningful commit messages

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Smart Commit & Push" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    $null = git --version
} catch {
    Write-Host "Error: git is not installed" -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "Error: Not a git repository" -ForegroundColor Red
    Write-Host "Run setup-github.ps1 first to initialize the repository" -ForegroundColor Yellow
    exit 1
}

# Check for uncommitted changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    exit 0
}

Write-Host "Analyzing changes..." -ForegroundColor Yellow
Write-Host ""

# Get detailed status
$added = @()
$modified = @()
$deleted = @()
$renamed = @()

foreach ($line in $status) {
    $statusCode = $line.Substring(0, 2).Trim()
    $file = $line.Substring(3)
    
    switch ($statusCode) {
        "A" { $added += $file }
        "M" { $modified += $file }
        "D" { $deleted += $file }
        "R" { $renamed += $file }
        "??" { $added += $file }
    }
}

# Display changes summary
Write-Host "Changes detected:" -ForegroundColor Green
if ($added.Count -gt 0) {
    Write-Host "  Added: $($added.Count) file(s)" -ForegroundColor Green
}
if ($modified.Count -gt 0) {
    Write-Host "  Modified: $($modified.Count) file(s)" -ForegroundColor Yellow
}
if ($deleted.Count -gt 0) {
    Write-Host "  Deleted: $($deleted.Count) file(s)" -ForegroundColor Red
}
if ($renamed.Count -gt 0) {
    Write-Host "  Renamed: $($renamed.Count) file(s)" -ForegroundColor Cyan
}
Write-Host ""

# Analyze changes to determine commit type and scope
$commitType = "chore"
$scope = ""
$description = ""

# Determine commit type based on file patterns
$allFiles = $added + $modified + $deleted + $renamed

# Check for specific patterns
$hasTests = $allFiles | Where-Object { $_ -match "test|spec" }
$hasDocs = $allFiles | Where-Object { $_ -match "\.md$|docs/" }
$hasScripts = $allFiles | Where-Object { $_ -match "scripts/" }
$hasComponents = $allFiles | Where-Object { $_ -match "components/" }
$hasAPI = $allFiles | Where-Object { $_ -match "app/api/" }
$hasServices = $allFiles | Where-Object { $_ -match "src/services/" }
$hasDB = $allFiles | Where-Object { $_ -match "src/db/|drizzle" }
$hasConfig = $allFiles | Where-Object { $_ -match "\.config\.|\.json$|\.yml$" }
$hasGitHub = $allFiles | Where-Object { $_ -match "\.github/" }

# Determine commit type
if ($hasTests) {
    $commitType = "test"
    $description = "update tests"
}
if ($hasDocs) {
    $commitType = "docs"
    $description = "update documentation"
}
if ($hasScripts) {
    $commitType = "chore"
    $scope = "scripts"
    $description = "update build scripts"
}
if ($hasComponents) {
    $commitType = "feat"
    $scope = "ui"
    $description = "update UI components"
}
if ($hasAPI) {
    $commitType = "feat"
    $scope = "api"
    $description = "update API endpoints"
}
if ($hasServices) {
    $commitType = "feat"
    $scope = "services"
    $description = "update services"
}
if ($hasDB) {
    $commitType = "feat"
    $scope = "db"
    $description = "update database schema"
}
if ($hasConfig) {
    $commitType = "chore"
    $scope = "config"
    $description = "update configuration"
}
if ($hasGitHub) {
    $commitType = "ci"
    $description = "update CI/CD configuration"
}

# If mostly additions, it's likely a new feature
if ($added.Count -gt $modified.Count -and $added.Count -gt $deleted.Count) {
    if ($commitType -eq "chore") {
        $commitType = "feat"
    }
    if (-not $description) {
        $description = "add new files"
    }
}

# If mostly deletions, it's cleanup
if ($deleted.Count -gt $added.Count -and $deleted.Count -gt $modified.Count) {
    $commitType = "chore"
    if (-not $description) {
        $description = "remove unused files"
    }
}

# Build commit message
$commitMessage = $commitType
if ($scope) {
    $commitMessage += "($scope)"
}
$commitMessage += ": "

# Generate description based on specific files
if ($modified.Count -eq 1 -and $added.Count -eq 0 -and $deleted.Count -eq 0) {
    $fileName = Split-Path -Leaf $modified[0]
    $commitMessage += "update $fileName"
} elseif ($added.Count -eq 1 -and $modified.Count -eq 0 -and $deleted.Count -eq 0) {
    $fileName = Split-Path -Leaf $added[0]
    $commitMessage += "add $fileName"
} elseif ($deleted.Count -eq 1 -and $added.Count -eq 0 -and $modified.Count -eq 0) {
    $fileName = Split-Path -Leaf $deleted[0]
    $commitMessage += "remove $fileName"
} else {
    $commitMessage += $description
}

# Show proposed commit message
Write-Host "Proposed commit message:" -ForegroundColor Cyan
Write-Host "  $commitMessage" -ForegroundColor White
Write-Host ""

# Ask for confirmation or custom message
$choice = Read-Host "Use this message? (y/n/custom)"

if ($choice -eq "custom" -or $choice -eq "c") {
    Write-Host ""
    $commitMessage = Read-Host "Enter custom commit message"
} elseif ($choice -ne "y" -and $choice -ne "Y") {
    Write-Host "Commit cancelled" -ForegroundColor Yellow
    exit 0
}

# Stage all changes
Write-Host ""
Write-Host "Staging changes..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to stage changes" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host "Creating commit..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create commit" -ForegroundColor Red
    exit 1
}

Write-Host "Commit created successfully!" -ForegroundColor Green
Write-Host ""

# Get current branch
$currentBranch = git branch --show-current

# Ask to push
$push = Read-Host "Push to origin/$currentBranch? (y/n)"

if ($push -eq "y" -or $push -eq "Y") {
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    
    # Check if upstream is set
    $upstream = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
    
    if ($upstream) {
        git push
    } else {
        git push -u origin $currentBranch
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to push to GitHub" -ForegroundColor Red
        Write-Host "You may need to pull first or check your permissions" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Commit created but not pushed" -ForegroundColor Yellow
    Write-Host "Run 'git push' when ready" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
