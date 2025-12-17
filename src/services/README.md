# Recipe CRUD Operations

This module provides comprehensive recipe management functionality with proper validation and error handling.

## Components

### RecipeService
The main service class that provides high-level recipe operations:

- **createRecipe()** - Creates a new recipe with validation
- **getRecipeById()** - Retrieves a recipe by ID with ownership checks
- **getUserRecipes()** - Gets all recipes for a user with optional filtering
- **updateRecipe()** - Updates an existing recipe with validation
- **deleteRecipe()** - Deletes a recipe with ownership checks
- **searchRecipes()** - Searches recipes by text in title, description, ingredients, and instructions
- **scaleRecipe()** - Scales recipe ingredients based on new serving size
- **getRecipesByCategory()** - Filters recipes by category
- **getRecipesByTag()** - Filters recipes by tag
- **getRecipeCount()** - Gets total recipe count for a user

### RecipeRepository
Data access layer that handles database operations:

- CRUD operations for recipes
- Advanced filtering and search capabilities
- JSONB queries for categories and tags
- Full-text search across recipe content

### RecipeValidator
Validation utilities for recipe data:

- **validate()** - Validates complete recipe data for creation
- **validateForUpdate()** - Validates partial recipe data for updates
- **sanitizeRecipeData()** - Cleans and normalizes recipe data

## Usage Example

```typescript
import { RecipeService } from './services/recipe-service';

const recipeService = new RecipeService();

// Create a new recipe
const result = await recipeService.createRecipe({
  title: 'Chocolate Chip Cookies',
  ingredients: [
    { name: 'Flour', quantity: 2, unit: 'cups' },
    { name: 'Sugar', quantity: 1, unit: 'cup' }
  ],
  instructions: [
    { stepNumber: 1, description: 'Mix ingredients' },
    { stepNumber: 2, description: 'Bake for 30 minutes' }
  ],
  cookingTime: 30,
  servings: 24,
  userId: 'user-123'
});

if (result.success) {
  console.log('Recipe created:', result.recipe);
} else {
  console.error('Error:', result.error);
}

// Scale a recipe
const scaleResult = await recipeService.scaleRecipe({
  recipeId: 'recipe-123',
  newServings: 48,
  userId: 'user-123'
});
```

## Validation Rules

### Required Fields
- `title` - Must be non-empty and under 200 characters
- `userId` - Must be provided
- `ingredients` - Must be an array with at least one ingredient
- `instructions` - Must be an array with at least one instruction

### Ingredient Validation
- `name` - Required for each ingredient
- `quantity` - Must be non-negative if provided

### Instruction Validation
- `description` - Required for each instruction
- `stepNumber` - Must match array index + 1
- `duration` - Must be non-negative if provided

### Optional Field Validation
- `cookingTime`, `prepTime` - Must be non-negative
- `servings` - Must be positive
- `difficulty` - Must be 'easy', 'medium', or 'hard'
- `sourceType` - Must be 'web', 'video', 'document', or 'manual'
- `sourceUrl` - Must be a valid URL if provided

## Error Handling

The service returns structured error responses with types:
- `validation` - Data validation failures
- `not_found` - Recipe not found
- `unauthorized` - User doesn't own the recipe
- `database` - Database operation failures

## Testing

Comprehensive test coverage includes:
- Unit tests for all service methods
- Validation tests for all rules
- Integration tests for complete workflows
- Property-based testing for data integrity

Run tests with:
```bash
npm test
```