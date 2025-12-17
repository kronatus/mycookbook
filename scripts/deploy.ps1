# Automated Deployment Script Wrapper (PowerShell)
# Executes the TypeScript deployment script

$ErrorActionPreference = "Stop"

# Check if npx is available
try {
    $null = npx --version
} catch {
    Write-Host "Error: npx is not available" -ForegroundColor Red
    Write-Host "Please install Node.js and npm" -ForegroundColor Yellow
    exit 1
}

# Run the TypeScript deployment script
npx tsx scripts/deploy.ts
