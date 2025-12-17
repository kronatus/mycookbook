@echo off
REM Intelligent Commit and Push Script
REM Analyzes changes and generates meaningful commit messages

setlocal enabledelayedexpansion

echo.
echo ================================
echo Smart Commit ^& Push
echo ================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: git is not installed
    exit /b 1
)

REM Check if we're in a git repository
if not exist .git (
    echo Error: Not a git repository
    echo Run setup-github.bat first to initialize the repository
    exit /b 1
)

REM Check for uncommitted changes
git status --porcelain > temp_status.txt 2>nul
for %%A in (temp_status.txt) do set STATUS_SIZE=%%~zA

if %STATUS_SIZE% EQU 0 (
    del temp_status.txt 2>nul
    echo No changes to commit
    exit /b 0
)

echo Analyzing changes...
echo.

REM Count changes
set ADDED=0
set MODIFIED=0
set DELETED=0

for /f "tokens=1,*" %%a in (temp_status.txt) do (
    if "%%a"=="A" set /a ADDED+=1
    if "%%a"=="M" set /a MODIFIED+=1
    if "%%a"=="D" set /a DELETED+=1
    if "%%a"=="??" set /a ADDED+=1
)

del temp_status.txt 2>nul

REM Display changes summary
echo Changes detected:
if %ADDED% GTR 0 echo   Added: %ADDED% file(s)
if %MODIFIED% GTR 0 echo   Modified: %MODIFIED% file(s)
if %DELETED% GTR 0 echo   Deleted: %DELETED% file(s)
echo.

REM Determine commit type
set COMMIT_TYPE=chore
set DESCRIPTION=update files

REM Check what types of files changed
git diff --cached --name-only --diff-filter=AM > changed_files.txt 2>nul
git ls-files --others --exclude-standard >> changed_files.txt 2>nul

findstr /i "test spec" changed_files.txt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMMIT_TYPE=test
    set DESCRIPTION=update tests
)

findstr /i "\.md$ docs/" changed_files.txt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMMIT_TYPE=docs
    set DESCRIPTION=update documentation
)

findstr /i "components/" changed_files.txt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMMIT_TYPE=feat
    set DESCRIPTION=update UI components
)

findstr /i "app/api/" changed_files.txt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMMIT_TYPE=feat
    set DESCRIPTION=update API endpoints
)

findstr /i "src/services/" changed_files.txt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMMIT_TYPE=feat
    set DESCRIPTION=update services
)

findstr /i "src/db/ drizzle" changed_files.txt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMMIT_TYPE=feat
    set DESCRIPTION=update database schema
)

findstr /i "\.github/" changed_files.txt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMMIT_TYPE=ci
    set DESCRIPTION=update CI/CD configuration
)

findstr /i "scripts/" changed_files.txt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMMIT_TYPE=chore
    set DESCRIPTION=update build scripts
)

del changed_files.txt 2>nul

REM Build commit message
set COMMIT_MSG=%COMMIT_TYPE%: %DESCRIPTION%

REM Show proposed commit message
echo Proposed commit message:
echo   %COMMIT_MSG%
echo.

set /p CHOICE="Use this message? (y/n/custom): "

if /i "%CHOICE%"=="custom" (
    echo.
    set /p COMMIT_MSG="Enter custom commit message: "
) else if /i not "%CHOICE%"=="y" (
    echo Commit cancelled
    exit /b 0
)

REM Stage all changes
echo.
echo Staging changes...
git add . 2>nul

if errorlevel 1 (
    echo Error: Failed to stage changes
    exit /b 1
)

REM Commit
echo Creating commit...
git commit -m "%COMMIT_MSG%" 2>nul

if errorlevel 1 (
    echo Error: Failed to create commit
    exit /b 1
)

echo Commit created successfully!
echo.

REM Get current branch
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i

REM Ask to push
set /p PUSH="Push to origin/%CURRENT_BRANCH%? (y/n): "

if /i "%PUSH%"=="y" (
    echo.
    echo Pushing to GitHub...
    
    REM Try to push
    git push 2>nul
    if errorlevel 1 (
        REM If push fails, try with upstream
        git push -u origin %CURRENT_BRANCH% 2>nul
        if errorlevel 1 (
            echo Error: Failed to push to GitHub
            echo You may need to pull first or check your permissions
            exit /b 1
        )
    )
    
    echo.
    echo Successfully pushed to GitHub!
) else (
    echo.
    echo Commit created but not pushed
    echo Run 'git push' when ready
)

echo.
echo ================================
echo Done!
echo ================================
echo.
pause
