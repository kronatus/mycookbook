@echo off
REM GitHub Repository Setup Script for Windows
REM This script helps initialize the GitHub repository with proper configuration

setlocal enabledelayedexpansion

echo.
echo ================================
echo Personal Cookbook - GitHub Setup
echo ================================
echo.

REM Repository configuration
set REPO_NAME=mycookbook
set GITHUB_USER=kronatus
set GITHUB_EMAIL=soplace@gmail.com
set REPO_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%.git

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: git is not installed
    echo Please install git and try again
    pause
    exit /b 1
)

echo Repository Configuration:
echo   Name: %REPO_NAME%
echo   User: %GITHUB_USER%
echo   Email: %GITHUB_EMAIL%
echo   URL: %REPO_URL%
echo.

REM Configure git user
echo Configuring git user...
git config user.name "%GITHUB_USER%"
git config user.email "%GITHUB_EMAIL%"
echo Git user configured
echo.

REM Check if already initialized
if exist .git (
    echo Git repository already initialized
) else (
    echo Initializing git repository...
    git init
    echo Git repository initialized
)
echo.

REM Check if remote exists
git remote get-url origin >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Remote 'origin' already exists
) else (
    echo Adding remote repository...
    git remote add origin "%REPO_URL%"
    echo Remote added: %REPO_URL%
)
echo.

REM Check current branch and switch to main
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" (
    echo Creating main branch...
    git checkout -b main 2>nul
    if errorlevel 1 (
        echo Error creating main branch
    ) else (
        echo Main branch created
    )
) else if not "%CURRENT_BRANCH%"=="main" (
    echo Current branch: %CURRENT_BRANCH%
    set /p SWITCH="Switch to main branch? (y/n): "
    if /i "!SWITCH!"=="y" (
        REM Try to rename current branch to main
        git branch -m main 2>nul
        if errorlevel 1 (
            REM If rename fails, try to checkout existing main branch
            git checkout main 2>nul
            if errorlevel 1 (
                REM If checkout fails, create new main branch
                git checkout -b main 2>nul
            )
        )
        echo Switched to main branch
    )
)
echo.

REM Check for nested git repositories (can cause issues)
echo Checking for nested git repositories...
for /d /r %%d in (.git) do (
    if exist "%%d" (
        set "NESTED_GIT=%%d"
        if not "!NESTED_GIT!"=="%CD%\.git" (
            echo Warning: Found nested git repository at: %%d
            echo This may cause issues with git add. Consider removing it.
        )
    )
)

REM Check for uncommitted changes
git status --porcelain > temp_status.txt 2>nul
for %%A in (temp_status.txt) do set STATUS_SIZE=%%~zA
del temp_status.txt 2>nul

if %STATUS_SIZE% GTR 0 (
    echo Uncommitted changes detected
    echo.
    git status --short
    echo.
    set /p COMMIT="Create initial commit? (y/n): "
    if /i "!COMMIT!"=="y" (
        echo Staging all files...
        git add . 2>nul
        if errorlevel 1 (
            echo Error: Failed to stage files
        ) else (
            echo Creating initial commit...
            git commit -m "chore: initial commit - Personal Cookbook application" 2>nul
            if errorlevel 1 (
                echo Error: Failed to create commit
                set COMMIT_SUCCESS=0
            ) else (
                echo Initial commit created successfully
                set COMMIT_SUCCESS=1
            )
        )
    ) else (
        set COMMIT_SUCCESS=0
    )
) else (
    echo No uncommitted changes detected
    set COMMIT_SUCCESS=1
)
echo.

REM Push to GitHub
REM Check if there are commits to push
git rev-parse HEAD >nul 2>nul
if errorlevel 1 (
    echo No commits to push yet. Skipping push step.
    set PUSH_SUCCESS=0
) else (
    set /p PUSH="Push to GitHub? (y/n): "
    if /i "!PUSH!"=="y" (
        echo Pushing to GitHub...
        git push -u origin main 2>nul
        if errorlevel 1 (
            echo Error: Failed to push to GitHub
            echo Make sure the repository exists and you have access
            set PUSH_SUCCESS=0
        ) else (
            echo Successfully pushed to GitHub
            set PUSH_SUCCESS=1
        )
    ) else (
        set PUSH_SUCCESS=0
    )
)
echo.

REM Create develop branch
if "%PUSH_SUCCESS%"=="1" (
    set /p DEVELOP="Create and push develop branch? (y/n): "
    if /i "!DEVELOP!"=="y" (
        git show-ref --verify --quiet refs/heads/develop >nul 2>nul
        if !ERRORLEVEL! EQU 0 (
            echo Develop branch already exists
        ) else (
            echo Creating develop branch...
            git checkout -b develop 2>nul
            if errorlevel 1 (
                echo Error: Failed to create develop branch
            ) else (
                git push -u origin develop 2>nul
                if errorlevel 1 (
                    echo Error: Failed to push develop branch
                ) else (
                    echo Develop branch pushed successfully
                )
                git checkout main 2>nul
                echo Returned to main branch
            )
        )
    )
) else (
    echo Skipping develop branch creation (main branch not pushed)
)
echo.

echo ================================
echo Setup complete!
echo.
echo Next steps:
echo   1. Configure GitHub secrets (see .github/SETUP.md)
echo   2. Connect repository to Vercel
echo   3. Set up Neon database branches
echo   4. Configure environment variables
echo.
echo Documentation:
echo   - Setup Guide: .github/SETUP.md
echo   - Contributing: CONTRIBUTING.md
echo   - README: README.md
echo.
echo Happy coding!
echo.
pause
