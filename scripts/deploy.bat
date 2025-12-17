@echo off
REM Automated Deployment Script Wrapper (Windows Batch)
REM Executes the TypeScript deployment script

REM Check if npx is available
where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npx is not available
    echo Please install Node.js and npm
    exit /b 1
)

REM Run the TypeScript deployment script
npx tsx scripts\deploy.ts
