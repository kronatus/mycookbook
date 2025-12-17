# Personal Cookbook 🍳

A modern web application for aggregating, organizing, and managing your favorite recipes from various online and offline sources.

## Features

- 🌐 **Multi-Source Recipe Ingestion**: Extract recipes from websites, YouTube videos, TikTok, Instagram, PDFs, and Word documents
- 📚 **Organized Recipe Library**: Browse recipes by categories (cooking, baking, cuisine types)
- 🔍 **Powerful Search**: Full-text search across ingredients, titles, and instructions
- 📝 **Recipe Editing**: Customize recipes with personal notes and modifications
- 📏 **Smart Scaling**: Automatically adjust ingredient quantities for different serving sizes
- 🛒 **Kitchen Wishlist**: Track cooking equipment you want to purchase
- 📱 **Progressive Web App**: Install on mobile devices for offline access
- 🌙 **Dark Mode**: Easy on the eyes while cooking at night
- 🔐 **Secure & Private**: Your recipes are protected with authentication

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Neon PostgreSQL with branching
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js
- **Storage**: Vercel Blob Storage
- **Deployment**: Vercel
- **Testing**: Vitest, fast-check (Property-Based Testing)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Neon PostgreSQL account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kronatus/mycookbook.git
   cd mycookbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the following variables:
   ```env
   # Neon Database (Development Branch)
   NEON_DEV_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dev
   
   # NextAuth Configuration
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   
   # Vercel Blob Storage (optional for local dev)
   BLOB_READ_WRITE_TOKEN=your-token-here
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Development

### Available Scripts

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

**Testing:**
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

**Database:**
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:optimize` - Optimize database performance

**Git Automation:**
- `.\scripts\commit-and-push.ps1` (PowerShell) - Smart commit with auto-generated messages
- `scripts\commit-and-push.bat` (CMD) - Smart commit with auto-generated messages
- `bash scripts/commit-and-push.sh` (Bash) - Smart commit with auto-generated messages

### Project Structure

```
personal-cookbook/
├── .github/              # GitHub Actions workflows and templates
├── .kiro/                # Kiro specs and documentation
│   └── specs/
│       └── personal-cookbook/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── recipes/         # Recipe pages
│   └── search/          # Search pages
├── components/          # React components
├── src/
│   ├── db/             # Database schema and migrations
│   ├── repositories/   # Data access layer
│   ├── services/       # Business logic
│   └── validators/     # Input validation
├── public/             # Static assets
└── scripts/            # Utility scripts
```

### Database Management

This project uses Neon PostgreSQL with branching for environment isolation:

- **Production**: Main branch
- **Development**: Development branch
- **Local**: Connects to development branch

To create a new migration:
```bash
npm run db:generate
```

To apply migrations:
```bash
npm run db:migrate
```

### Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

The project uses:
- **Vitest** for unit testing
- **fast-check** for property-based testing

## Deployment

### GitHub Setup

See [.github/SETUP.md](.github/SETUP.md) for detailed instructions on:
- Setting up the GitHub repository
- Configuring branch protection rules
- Setting up GitHub Actions secrets
- Connecting Vercel for automatic deployments

**Quick Setup Scripts:**
- Windows (PowerShell): `.\scripts\setup-github.ps1`
- Windows (CMD): `scripts\setup-github.bat`
- Unix/Mac: `bash scripts/setup-github.sh`

### Quick Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Import your GitHub repository in Vercel
   - Configure environment variables
   - Deploy automatically on push to main

### Environment Variables for Production

Configure these in Vercel:

- `NEON_DATABASE_URL` - Production database connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Production URL
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request to `develop`

See our [Pull Request Template](.github/pull_request_template.md) for details.

## Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency production fixes

## Quick Commands

**Commit and Push Changes:**
```powershell
# PowerShell (Recommended)
.\scripts\commit-and-push.ps1

# Command Prompt
scripts\commit-and-push.bat

# Bash
bash scripts/commit-and-push.sh
```

The script will:
- ✅ Analyze your changes
- ✅ Generate a meaningful commit message
- ✅ Let you approve or customize it
- ✅ Commit and push to GitHub

See [Commit Guide](.github/COMMIT_GUIDE.md) for details.

## Documentation

- [Requirements](.kiro/specs/personal-cookbook/requirements.md)
- [Design Document](.kiro/specs/personal-cookbook/design.md)
- [Implementation Tasks](.kiro/specs/personal-cookbook/tasks.md)
- [GitHub Setup Guide](.github/SETUP.md)
- [Windows Setup Guide](.github/WINDOWS_SETUP.md) - For Windows users
- [Git Workflow Reference](.github/GIT_WORKFLOW.md)
- [Smart Commit Guide](.github/COMMIT_GUIDE.md) - Automated commits
- [Database Documentation](src/db/README.md)
- [API Documentation](app/api/recipes/README.md)

## License

Private project - All rights reserved

## Contact

- **Repository**: https://github.com/kronatus/mycookbook
- **Email**: soplace@gmail.com

## Acknowledgments

Built with modern web technologies and best practices for a delightful cooking experience.
