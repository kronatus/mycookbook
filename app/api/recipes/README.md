# Recipe API Endpoints

This document describes the recipe API endpoints created for the Personal Cookbook application.

## Authentication

All endpoints require authentication via NextAuth.js. Requests must include a valid session.

## Endpoints

### GET /api/recipes

Get all recipes for the authenticated user with optional filtering and search.

**Query Parameters:**
- `search` (string): Search term to find recipes by title, description, ingredients, or instructions
- `categories` (string): Comma-separated list of categories to filter by
- `tags` (string): Comma-separated list of tags to filter by
- `difficulty` (string): Filter by difficulty level (`easy`, `medium`, `hard`)
- `maxCookingTime` (number): Maximum cooking time in minutes
- `maxPrepTime` (number): Maximum prep time in minutes

**Response:**
```json
{
  "recipes": [...],
  "count": 10
}
```

### POST /api/recipes

Create a new recipe.

**Request Body:**
```json
{
  "title": "Recipe Title",
  "description": "Optional description",
  "ingredients": [
    {
      "name": "Flour",
      "quantity": 2,
      "unit": "cups",
      "notes": "All-purpose"
    }
  ],
  "instructions": [
    {
      "stepNumber": 1,
      "description": "Mix ingredients",
      "duration": 5
    }
  ],
  "cookingTime": 30,
  "prepTime": 15,
  "servings": 4,
  "difficulty": "easy",
  "categories": ["dinner"],
  "tags": ["quick", "easy"],
  "sourceUrl": "https://example.com/recipe",
  "sourceType": "web",
  "personalNotes": "Family favorite"
}
```

**Response:**
```json
{
  "recipe": { ... }
}
```

### GET /api/recipes/[id]

Get a specific recipe by ID.

**Response:**
```json
{
  "recipe": { ... }
}
```

### PUT /api/recipes/[id]

Update a specific recipe.

**Request Body:** Same as POST, but all fields are optional.

**Response:**
```json
{
  "recipe": { ... }
}
```

### DELETE /api/recipes/[id]

Delete a specific recipe.

**Response:**
```json
{
  "message": "Recipe deleted successfully"
}
```

### POST /api/recipes/[id]/scale

Scale a recipe to a different serving size.

**Request Body:**
```json
{
  "newServings": 6
}
```

**Response:**
```json
{
  "recipe": { ... }
}
```

### GET /api/recipes/categories/[category]

Get all recipes in a specific category.

**Response:**
```json
{
  "recipes": [...],
  "category": "dinner",
  "count": 5
}
```

### GET /api/recipes/tags/[tag]

Get all recipes with a specific tag.

**Response:**
```json
{
  "recipes": [...],
  "tag": "quick",
  "count": 8
}
```

### GET /api/recipes/count

Get the total count of recipes for the authenticated user.

**Response:**
```json
{
  "count": 25
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": { ... }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized to access resource)
- `404` - Not Found
- `500` - Internal Server Error

## Request Validation

- All POST/PUT requests must include `Content-Type: application/json`
- Required fields are validated before processing
- Recipe data is sanitized and validated using the RecipeValidator
- User ownership is verified for all recipe operations

## Features

- **Authentication**: All endpoints are protected and require valid user sessions
- **Authorization**: Users can only access their own recipes
- **Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Consistent error responses with appropriate HTTP status codes
- **Search**: Full-text search across recipe titles, descriptions, ingredients, and instructions
- **Filtering**: Multiple filter options for finding specific recipes
- **Scaling**: Automatic ingredient quantity adjustment for different serving sizes
- **CRUD Operations**: Complete Create, Read, Update, Delete functionality