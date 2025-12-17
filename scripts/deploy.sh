#!/bin/bash

# Automated Deployment Script Wrapper
# Executes the TypeScript deployment script

# Check if tsx is available
if ! command -v npx &> /dev/null; then
    echo "Error: npx is not available"
    echo "Please install Node.js and npm"
    exit 1
fi

# Run the TypeScript deployment script
npx tsx scripts/deploy.ts
