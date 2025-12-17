# Personal Cookbook Design Document

## Overview

The Personal Cookbook is a web-based application that serves as a centralized repository for curated recipes with intelligent ingestion capabilities. The system combines a modern, responsive frontend with a robust backend that can extract recipe data from various online and offline sources. The architecture emphasizes user experience, data integrity, and extensibility to support future enhancements.

## Architecture

The system follows a modern serverless architecture optimized for Vercel deployment with Neon PostgreSQL:

```mermaid
graph TB
    A[Next.js App - Vercel] --> B[API Routes - Vercel Functions]
    B --> C[Recipe Service]
    B --> D[Ingestion Service]
    B --> E[Wishlist Service]
    C --> F[Neon PostgreSQL]
    D --> G[External APIs]
    D --> H[Document Parser]
    E --> F
    I[Vercel Blob Storage] --> D
    J[PostgreSQL Full-Text Search] --> C
    
    subgraph "Environment Strategy"
        K[Production: Neon Main Branch]
        L[Development: Neon Dev Branch]
        M[Local: Neon Dev Branch + Connection Pooling]
    end
```

**Frontend Layer:**
- Next.js 14+ with App Router for server-side rendering and static generation
- Deployed on Vercel with automatic deployments from Git
- Tailwind CSS for responsive design
- Progressive Web App (PWA) capabilities for mobile experience

**Backend Services:**
- Next.js API Routes deployed as Vercel Edge Functions
- Serverless architecture with automatic scaling
- NextAuth.js for authentication and session management
- Middleware for request validation and rate limiting

**Data Layer:**
- **Neon PostgreSQL** with branching for environment isolation
- **Production Environment**: Neon main branch with connection pooling
- **Development Environment**: Neon development branch for safe testing
- **Local Development**: Connection to Neon dev branch with local caching
- Built-in PostgreSQL full-text search (no separate search engine needed)
- Vercel Blob Storage for uploaded documents and images

**Database Strategy:**
- **Neon Branching**: Separate database branches for production and development
- **Connection Pooling**: @neondatabase/serverless for optimal serverless performance
- **Migrations**: Drizzle ORM or Prisma for schema management across environments
- **Environment Variables**: Separate connection strings for prod/dev branches

## Database Configuration

### Neon PostgreSQL Setup

**Branch Strategy:**
- **Main Branch (Production)**: Connected to Vercel production deployments
- **Development Branch**: Used for staging and local development
- **Feature Branches**: Created as needed for major schema changes

**Connection Configuration:**
```typescript
// Environment-specific database URLs
const DATABASE_URLS = {
  production: process.env.NEON_DATABASE_URL, // Main branch
  development: process.env.NEON_DEV_DATABASE_URL, // Dev branch
  local: process.env.NEON_DEV_DATABASE_URL // Same as dev for local work
}

// Serverless-optimized connection
import { neon } from '@neondatabase/serverless';
const sql = neon(DATABASE_URLS[process.env.NODE_ENV]);
```

**Schema Management:**
- Drizzle ORM for type-safe database operations and migrations
- Automated migrations on deployment via Vercel build hooks
- Schema versioning synchronized across branches

**Performance Optimizations:**
- Connection pooling via Neon's serverless driver
- Query optimization using PostgreSQL indexes
- Built-in full-text search using PostgreSQL's tsvector
- Edge caching for frequently accessed recipes

**Environment Variables:**
```bash
# Production (Vercel)
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/main

# Development (Vercel Preview + Local)
NEON_DEV_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dev

# Additional config
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

## Components and Interfaces

### Recipe Management Component
- **RecipeService**: Core business logic for recipe CRUD operations
- **RecipeRepository**: Data access layer for recipe persistence
- **RecipeValidator**: Ensures recipe data integrity and format consistency

### Ingestion Engine Component
- **URLIngestionService**: Handles recipe extraction from web URLs
- **DocumentIngestionService**: Processes PDF and Word documents
- **ContentParser**: Normalizes extracted content into standard recipe format
- **SourceAdapters**: Specialized parsers for different platforms (YouTube, TikTok, Instagram)

### User Interface Component
- **CategoryBrowser**: Displays and manages recipe categories
- **SearchInterface**: Provides search and filtering capabilities
- **RecipeEditor**: Allows recipe viewing and editing
- **WishlistManager**: Manages kitchen equipment wishlist

### External Integration Component
- **WebScrapingService**: Extracts recipe data from websites
- **VideoTranscriptionService**: Processes video content for recipe information
- **DocumentOCRService**: Handles text extraction from scanned documents

## Data Models

### Recipe Model
```typescript
interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cookingTime?: number;
  prepTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  categories: string[];
  tags: string[];
  sourceUrl?: string;
  sourceType: 'web' | 'video' | 'document' | 'manual';
  personalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface Ingredient {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
}

interface Instruction {
  stepNumber: number;
  description: string;
  duration?: number;
}
```

### Wishlist Model
```typescript
interface WishlistItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimatedPrice?: number;
  priority: 'low' | 'medium' | 'high';
  isPurchased: boolean;
  purchaseDate?: Date;
  notes?: string;
  userId: string;
  createdAt: Date;
}
```

### User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPreferences {
  defaultServings: number;
  preferredUnits: 'metric' | 'imperial';
  dietaryRestrictions: string[];
  favoriteCategories: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: URL ingestion produces valid recipes**
*For any* valid recipe website URL, the ingestion process should extract content and produce a recipe object with required fields (title, ingredients, instructions)
**Validates: Requirements 1.1**

**Property 2: Video URL processing extracts recipe data**
*For any* valid YouTube video URL containing recipe content, the system should extract recipe information and store it in normalized format
**Validates: Requirements 1.2**

**Property 3: Social media URL parsing succeeds**
*For any* valid TikTok or Instagram URL with recipe content, the parsing process should extract available recipe data successfully
**Validates: Requirements 1.3**

**Property 4: Recipe normalization consistency**
*For any* successfully extracted recipe from any source, the normalized output should contain consistent structure with ingredients, instructions, and metadata
**Validates: Requirements 1.4**

**Property 5: Document parsing extracts structured content**
*For any* PDF or Word document containing recipe text, the parsing process should extract text content and identify recipe structures
**Validates: Requirements 2.1, 2.2**

**Property 6: Multiple recipe separation**
*For any* document containing multiple recipes, the system should correctly separate them into individual recipe entries
**Validates: Requirements 2.4**

**Property 7: Category filtering accuracy**
*For any* recipe category selection, the returned results should contain only recipes belonging to that category
**Validates: Requirements 3.2**

**Property 8: Category assignment persistence**
*For any* recipe category assignment, the change should be immediately saved and reflected in category browsing
**Validates: Requirements 3.4**

**Property 9: Wishlist item creation completeness**
*For any* kitchen equipment added to the wishlist, the stored item should contain name, description, and optional price fields
**Validates: Requirements 4.2**

**Property 10: Purchase status transition**
*For any* wishlist item marked as purchased, it should move to the purchased section and maintain its data integrity
**Validates: Requirements 4.3**

**Property 11: Search result accuracy**
*For any* search term, returned recipes should match the term in ingredients, titles, or instructions
**Validates: Requirements 5.1**

**Property 12: Filter application correctness**
*For any* applied filter criteria, the results should contain only recipes matching all selected criteria
**Validates: Requirements 5.2**

**Property 13: Recipe scaling proportionality**
*For any* recipe and scaling factor, all ingredient quantities should be adjusted proportionally while maintaining the original ratios
**Validates: Requirements 6.4**

**Property 14: Source information preservation**
*For any* recipe modification, the original source information should remain unchanged and accessible
**Validates: Requirements 6.5**

**Property 15: Data persistence reliability**
*For any* recipe addition or modification, the changes should be successfully saved to persistent storage and retrievable
**Validates: Requirements 8.1**

**Property 16: Authentication protection**
*For any* attempt to access user recipes without proper authentication, the system should deny access and protect personal data
**Validates: Requirements 8.3**

**Property 17: Export format validity**
*For any* data export request, the output should be in a valid standard format containing complete recipe information
**Validates: Requirements 8.5**

## Error Handling

The system implements comprehensive error handling across all components:

**Ingestion Errors:**
- Invalid URLs return structured error responses with suggested corrections
- Failed document parsing provides fallback manual entry options
- Network timeouts include retry mechanisms with exponential backoff
- Unsupported file formats display clear error messages with supported format list

**Data Validation Errors:**
- Recipe validation failures highlight specific missing or invalid fields
- User input validation provides real-time feedback with correction suggestions
- Database constraint violations return user-friendly error messages
- File upload size limits display progress and size requirements

**Authentication and Authorization Errors:**
- Invalid credentials return secure error messages without revealing system details
- Session expiration triggers automatic re-authentication flows
- Unauthorized access attempts are logged and blocked gracefully
- Rate limiting provides clear feedback about request limits

**System Errors:**
- Database connection failures trigger fallback read-only mode when possible
- External API failures provide cached results or manual entry alternatives
- Search service outages fall back to basic database queries
- File storage errors offer retry mechanisms and alternative storage options

## Testing Strategy

The testing approach combines unit testing and property-based testing to ensure comprehensive coverage:

**Unit Testing Framework:**
- Jest + React Testing Library for frontend component testing
- Vitest for faster unit test execution with Vite compatibility
- Test coverage target of 80% for critical business logic
- Mock external dependencies (APIs, Vercel Blob, Neon connections) for isolated testing

**Property-Based Testing Framework:**
- fast-check for JavaScript/TypeScript property-based testing
- Each property test configured to run minimum 100 iterations
- Custom generators for recipe data, URLs, and document content
- Integration with Neon dev branch for database property testing

**Testing Categories:**

*Unit Tests:*
- Component rendering and user interaction flows
- API endpoint request/response validation
- Database query correctness and edge cases
- File upload and processing workflows
- Authentication and authorization logic

*Property-Based Tests:*
- Recipe ingestion from various URL formats maintains data integrity
- Document parsing preserves recipe structure across different formats
- Search and filtering operations return consistent, accurate results
- Recipe scaling calculations maintain proportional relationships
- Data export/import operations preserve complete information (round-trip testing)

**Integration Testing:**
- End-to-end user workflows from recipe ingestion to viewing
- Database transaction integrity across multiple operations
- External API integration reliability and error handling
- File storage and retrieval operations
- Authentication flows and session management

**Performance Testing:**
- Recipe ingestion performance with various document sizes
- Search response times with large recipe collections
- Concurrent user access and data consistency
- File upload handling for large documents
- Database query optimization validation

Each property-based test must include a comment explicitly referencing the correctness property from this design document using the format: **Feature: personal-cookbook, Property {number}: {property_text}**

## Deployment Strategy

### Vercel + Neon Integration

**Development Workflow:**
1. Local development connects to Neon development branch
2. Feature branches deploy to Vercel preview environments using dev database
3. Main branch deploys to production using Neon main branch
4. Database migrations run automatically on deployment

**Environment Configuration:**
- **Local Development**: Uses Neon dev branch with local .env.local
- **Vercel Preview**: Automatic deployments use dev branch for safe testing
- **Vercel Production**: Main deployments use production database branch

**Source Code Management:**
- All source code SHALL be stored in GitHub repository with proper version control
- Automated commit and push workflows with intelligent commit message generation
- Branch protection rules for main branch requiring pull request reviews
- Semantic versioning and release tagging for production deployments

**Continuous Integration:**
```yaml
# Example GitHub Actions workflow
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run Tests
        env:
          NEON_DEV_DATABASE_URL: ${{ secrets.NEON_DEV_DATABASE_URL }}
        run: npm test
      - name: Run Property Tests
        run: npm run test:property
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
      - name: Verify Deployment
        run: |
          curl -f ${{ steps.deploy.outputs.preview-url }}/api/health || exit 1
```

**Database Migration Strategy:**
- Migrations stored in `/migrations` directory
- Automated execution via Vercel build hooks
- Rollback capability using Neon's point-in-time recovery
- Schema changes tested on dev branch before production deployment

**Automated Development Workflow:**
- Intelligent commit message generation based on code changes
- Automated git operations with change detection and staging
- Deployment verification scripts to ensure successful Vercel deployments
- Rollback capabilities for failed deployments

**Monitoring and Observability:**
- Vercel Analytics for performance monitoring
- Neon's built-in query performance insights
- Error tracking via Vercel's error reporting
- Custom logging for recipe ingestion success/failure rates
- GitHub Actions status monitoring and notification system