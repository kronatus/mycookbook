# Windows Setup Guide

Quick reference for Windows users setting up the Personal Cookbook repository.

## Prerequisites

1. **Git for Windows**: Download from [git-scm.com](https://git-scm.com/download/win)
2. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
3. **GitHub Account**: Sign up at [github.com](https://github.com/)

## Quick Start

### 1. Run Setup Script

Open PowerShell in the project directory and run:

```powershell
.\scripts\setup-github.ps1
```

Or if you prefer Command Prompt:

```cmd
scripts\setup-github.bat
```

The script will:
- ✅ Initialize git repository
- ✅ Configure git user settings
- ✅ Add remote repository
- ✅ Create initial commit
- ✅ Push to GitHub
- ✅ Set up develop branch

### 2. Install Dependencies

```powershell
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` with your configuration:
- Neon database connection string
- NextAuth secret
- Vercel Blob token (if needed)

### 4. Run Development Server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Common Windows Commands

### PowerShell Commands

```powershell
# Navigate to project
cd C:\path\to\mycookbook

# Check git status
git status

# Run tests
npm test

# Build project
npm run build

# View git log
git log --oneline

# Create new branch
git checkout -b feature/my-feature

# Stage all changes
git add .

# Commit changes
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/my-feature
```

### Command Prompt Commands

```cmd
# Navigate to project
cd C:\path\to\mycookbook

# Check git status
git status

# Run tests
npm test

# Build project
npm run build

# View git log
git log --oneline

# Create new branch
git checkout -b feature/my-feature

# Stage all changes
git add .

# Commit changes
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/my-feature
```

## PowerShell vs Command Prompt vs Bash

### PowerShell (Recommended for Windows)

PowerShell is the modern Windows shell with powerful scripting capabilities.

**Pros:**
- Native to Windows 10/11
- Better error handling
- More powerful scripting
- Colored output

**To open:**
- Press `Win + X` → Select "Windows PowerShell" or "Terminal"
- Or search for "PowerShell" in Start menu

### Command Prompt (CMD)

Traditional Windows command line.

**Pros:**
- Simple and familiar
- Works on all Windows versions
- Lightweight

**To open:**
- Press `Win + R` → Type `cmd` → Press Enter
- Or search for "Command Prompt" in Start menu

### Git Bash

Unix-like shell that comes with Git for Windows.

**Pros:**
- Unix commands work (ls, grep, etc.)
- Better for cross-platform scripts
- Familiar to Linux/Mac users

**To open:**
- Right-click in folder → "Git Bash Here"
- Or search for "Git Bash" in Start menu

## Troubleshooting

### "git is not recognized"

**Solution:** Add Git to your PATH:
1. Search for "Environment Variables" in Start menu
2. Click "Environment Variables"
3. Under "System variables", find "Path"
4. Click "Edit" → "New"
5. Add: `C:\Program Files\Git\cmd`
6. Click OK and restart your terminal

### "npm is not recognized"

**Solution:** Reinstall Node.js and ensure "Add to PATH" is checked during installation.

### "Execution of scripts is disabled"

**Solution:** Enable PowerShell script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Line Ending Issues

Git may convert line endings between Windows (CRLF) and Unix (LF).

**Solution:** Configure Git to handle line endings:
```powershell
git config --global core.autocrlf true
```

### Permission Denied Errors

**Solution:** Run PowerShell or Command Prompt as Administrator:
- Right-click on PowerShell/CMD
- Select "Run as administrator"

## Git Configuration for Windows

### Set Up User Information

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Configure Line Endings

```powershell
git config --global core.autocrlf true
```

### Set Default Editor

```powershell
# Use VS Code
git config --global core.editor "code --wait"

# Use Notepad
git config --global core.editor "notepad"
```

### Enable Colored Output

```powershell
git config --global color.ui auto
```

## IDE Setup

### Visual Studio Code (Recommended)

1. **Install VS Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/)

2. **Install Extensions:**
   - ESLint
   - Prettier
   - GitLens
   - TypeScript and JavaScript Language Features

3. **Open Project:**
   ```powershell
   code .
   ```

4. **Integrated Terminal:**
   - Press `` Ctrl + ` `` to open terminal
   - Select PowerShell or Git Bash from dropdown

### Configure VS Code Terminal

Add to `.vscode/settings.json`:

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell"
    },
    "Command Prompt": {
      "path": "cmd.exe",
      "icon": "terminal-cmd"
    },
    "Git Bash": {
      "path": "C:\\Program Files\\Git\\bin\\bash.exe",
      "icon": "terminal-bash"
    }
  }
}
```

## GitHub Desktop (Alternative)

If you prefer a GUI for Git operations:

1. **Download**: [desktop.github.com](https://desktop.github.com/)
2. **Clone Repository**: File → Clone Repository
3. **Make Changes**: Edit files in your preferred editor
4. **Commit**: Write commit message and click "Commit to main"
5. **Push**: Click "Push origin"

## Useful Windows Shortcuts

- `Win + X` → Open Power User menu
- `Win + R` → Run dialog
- `Ctrl + C` → Cancel current command
- `Ctrl + L` → Clear screen (PowerShell)
- `Tab` → Auto-complete file/folder names
- `↑` / `↓` → Navigate command history
- `Ctrl + R` → Search command history (PowerShell)

## Next Steps

1. ✅ Complete GitHub setup
2. ✅ Configure environment variables
3. ✅ Run development server
4. 📖 Read [CONTRIBUTING.md](../CONTRIBUTING.md)
5. 📖 Review [GIT_WORKFLOW.md](GIT_WORKFLOW.md)
6. 🚀 Start developing!

## Getting Help

- **Git Documentation**: [git-scm.com/doc](https://git-scm.com/doc)
- **PowerShell Help**: Type `Get-Help <command>` in PowerShell
- **Project Issues**: Create an issue on GitHub
- **Stack Overflow**: Search for Windows-specific solutions

## Additional Resources

- [Git for Windows Documentation](https://gitforwindows.org/)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Windows Terminal](https://aka.ms/terminal) - Modern terminal app
- [WSL2](https://docs.microsoft.com/en-us/windows/wsl/) - Windows Subsystem for Linux
