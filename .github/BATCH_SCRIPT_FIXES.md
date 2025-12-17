# Batch Script Fixes Documentation

This document explains the fixes applied to `scripts/setup-github.bat` to resolve Windows CMD syntax errors.

## Issues Fixed

### 1. Bash-style OR Operator (`||`)

**Problem:**
```batch
git checkout -b main 2>nul || git checkout main
```

**Error:**
```
The token '||' is not a valid statement separator in this version.
```

**Explanation:**
The `||` operator is bash syntax and doesn't work in Windows CMD. CMD uses `if errorlevel` for conditional execution.

**Solution:**
```batch
git checkout -b main 2>nul
if errorlevel 1 (
    git checkout main
)
```

### 2. Empty String Detection

**Problem:**
```batch
git status --porcelain > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if not "%STATUS%"=="" (
    REM Do something
)
```

**Issue:**
- `set /p` doesn't work reliably with empty files
- Can cause "The syntax of the command is incorrect" errors
- Variable may not be set if file is empty

**Solution:**
```batch
git status --porcelain > temp_status.txt 2>nul
for %%A in (temp_status.txt) do set STATUS_SIZE=%%~zA
del temp_status.txt 2>nul

if %STATUS_SIZE% GTR 0 (
    REM Do something
)
```

**Explanation:**
- Check file size instead of trying to read content
- `%%~zA` gets the file size in bytes
- More reliable for detecting empty vs non-empty output

### 3. Branch Switching Logic

**Problem:**
The original logic didn't handle all scenarios:
- Renaming current branch (e.g., master → main)
- Checking out existing main branch
- Creating new main branch

**Solution:**
```batch
if not "%CURRENT_BRANCH%"=="main" (
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
```

**Explanation:**
1. First try to rename current branch to "main" (`git branch -m main`)
2. If that fails (main already exists), try to checkout main
3. If that fails (main doesn't exist), create new main branch
4. This handles all scenarios gracefully

### 4. Error Redirection

**Problem:**
```batch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
```

**Issue:**
If git command fails, it can cause errors in the for loop.

**Solution:**
```batch
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i
```

**Explanation:**
- Redirect stderr to nul to suppress error messages
- Use `^>` to escape the `>` character in the for loop
- Prevents error messages from breaking the script

## Testing

The script was tested with the following scenarios:

1. ✅ Fresh repository initialization
2. ✅ Existing repository with master branch
3. ✅ Existing repository with main branch
4. ✅ Repository with uncommitted changes
5. ✅ Repository with no changes
6. ✅ User declining all prompts
7. ✅ User accepting all prompts

## Windows CMD vs PowerShell vs Bash

### Comparison Table

| Feature | CMD (Batch) | PowerShell | Bash |
|---------|-------------|------------|------|
| OR operator | `if errorlevel 1` | `\|\|` or `-or` | `\|\|` |
| AND operator | `&` | `&&` or `-and` | `&&` |
| Error redirection | `2>nul` | `2>$null` | `2>/dev/null` |
| Variable expansion | `%VAR%` or `!VAR!` | `$VAR` | `$VAR` |
| String comparison | `==` | `-eq` or `==` | `==` or `=` |
| File size | `%%~zA` | `(Get-Item).Length` | `stat -f%z` |

### Recommendations

1. **For Windows users:**
   - Use PowerShell script (`setup-github.ps1`) - Most robust
   - Use Batch script (`setup-github.bat`) - Works on all Windows versions
   - Use Git Bash with shell script (`setup-github.sh`) - Unix-like experience

2. **For cross-platform:**
   - Use PowerShell Core (works on Windows, Mac, Linux)
   - Use Node.js scripts
   - Use Python scripts

## Common Batch Script Pitfalls

### 1. Delayed Expansion

**Problem:**
```batch
set VAR=old
if condition (
    set VAR=new
    echo %VAR%  REM Prints "old" not "new"
)
```

**Solution:**
```batch
setlocal enabledelayedexpansion
set VAR=old
if condition (
    set VAR=new
    echo !VAR!  REM Prints "new"
)
```

### 2. Special Characters

Characters that need escaping in batch files:
- `&` - Command separator
- `|` - Pipe
- `<` `>` - Redirection
- `^` - Escape character
- `%` - Variable expansion

**Example:**
```batch
REM Wrong
echo Hello & Goodbye

REM Right
echo Hello ^& Goodbye
```

### 3. Quotes in Variables

**Problem:**
```batch
set PATH="C:\Program Files\Git"
REM PATH now contains the quotes!
```

**Solution:**
```batch
set "PATH=C:\Program Files\Git"
REM PATH doesn't contain quotes
```

## Additional Resources

- [Windows CMD Documentation](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands)
- [Batch File Programming](https://www.tutorialspoint.com/batch_script/index.htm)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Git for Windows](https://gitforwindows.org/)

## Version History

- **v1.0** - Initial batch script with bash syntax
- **v1.1** - Fixed `||` operator issue
- **v1.2** - Fixed empty string detection
- **v1.3** - Improved branch switching logic
- **v1.4** - Added error redirection (current version)

## Support

If you encounter issues with the batch script:

1. Try the PowerShell script instead: `.\scripts\setup-github.ps1`
2. Check that Git is installed and in your PATH
3. Run CMD as Administrator if you get permission errors
4. Review error messages carefully
5. Create an issue on GitHub with the error details
