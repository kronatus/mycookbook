# Contributing to Personal Cookbook

Thank you for your interest in contributing to Personal Cookbook! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive environment

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mycookbook.git
   cd mycookbook
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/kronatus/mycookbook.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment variables** (see README.md)
6. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Emergency fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

### Development Process

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git checkout develop
   git merge upstream/develop
   ```

2. **Create your feature branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make your changes**:
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed

4. **Test your changes**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/my-new-feature
   ```

7. **Create a Pull Request** on GitHub

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

### File Organization

- One component per file
- Group related files in directories
- Use index files for clean imports
- Keep file names descriptive and consistent

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Use trailing commas in objects and arrays
- Run `npm run lint` before committing

### Example Code Style

```typescript
// Good
interface RecipeProps {
  id: string;
  title: string;
  ingredients: Ingredient[];
}

export function RecipeCard({ id, title, ingredients }: RecipeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="recipe-card">
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  );
}
```

## Testing Requirements

### Unit Tests

- Write unit tests for all new functions and components
- Test edge cases and error conditions
- Aim for 80%+ code coverage on critical paths
- Use descriptive test names

### Property-Based Tests

- Write property tests for universal behaviors
- Use fast-check for property-based testing
- Run at least 100 iterations per property
- Tag tests with the property they validate

### Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { scaleRecipe } from './recipe-service';

describe('Recipe Scaling', () => {
  it('should scale ingredient quantities proportionally', () => {
    const recipe = {
      servings: 4,
      ingredients: [
        { name: 'flour', quantity: 2, unit: 'cups' }
      ]
    };
    
    const scaled = scaleRecipe(recipe, 8);
    
    expect(scaled.ingredients[0].quantity).toBe(4);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(recipes): add recipe scaling functionality

Implement automatic ingredient quantity adjustment when users change serving sizes.

Validates: Requirements 6.4
```

```bash
fix(search): correct full-text search highlighting

Fixed issue where search terms were not properly highlighted in results.

Fixes #123
```

```bash
test(ingestion): add property tests for URL parsing

Added property-based tests to verify URL ingestion produces valid recipes across various input formats.

Property 1: URL ingestion produces valid recipes
Validates: Requirements 1.1
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass locally
2. ✅ Code follows style guidelines
3. ✅ Documentation is updated
4. ✅ Commit messages follow conventions
5. ✅ Branch is up to date with develop

### PR Checklist

- [ ] Descriptive title and description
- [ ] References related issues/requirements
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] CI/CD pipeline passes

### Review Process

1. **Automated checks** run via GitHub Actions
2. **Code review** by maintainer
3. **Feedback** addressed by contributor
4. **Approval** and merge by maintainer

### After Merge

- Delete your feature branch
- Sync your fork with upstream
- Celebrate your contribution! 🎉

## Questions?

If you have questions or need help:

1. Check existing documentation
2. Search existing issues
3. Create a new issue with the `question` label
4. Reach out to maintainers

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project documentation

Thank you for contributing to Personal Cookbook! 🍳
