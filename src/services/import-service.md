# Import Service Documentation

The ImportService provides comprehensive functionality for importing recipes from various external formats into the personal cookbook system.

## Features

### Supported Import Formats

1. **JSON** - Generic JSON format and structured recipe data
2. **CSV** - Comma-separated values with configurable column mapping
3. **Recipe Keeper** - Native Recipe Keeper export format
4. **Paprika** - Paprika recipe manager export format
5. **Yummly** - Yummly API format
6. **AllRecipes** - AllRecipes JSON-LD format

### Key Capabilities

- **Bulk Import Processing** - Handle large datasets with progress tracking
- **Conflict Detection** - Identify duplicate recipes by title, URL, or content similarity
- **Data Validation** - Strict validation mode for ensuring data quality
- **Format Normalization** - Convert various external formats to internal schema
- **Progress Tracking** - Real-time progress updates with callback support
- **Error Handling** - Comprehensive error reporting with severity levels

## API Endpoints

### Basic Import
```
POST /api/import?userId={userId}
Content-Type: application/json

{
  "data": "...", // JSON string or CSV data
  "format": "generic-json", // Format type
  "options": {
    "skipDuplicates": true,
    "overwriteExisting": false,
    "validateStrict": true
  }
}
```

### Bulk Import with Progress Tracking
```
POST /api/import/bulk?userId={userId}
Content-Type: application/json

{
  "data": "...",
  "format": "recipe-keeper",
  "options": {
    "batchSize": 10,
    "skipDuplicates": true
  },
  "jobId": "optional-job-id"
}
```

### Check Import Progress
```
GET /api/import/bulk?jobId={jobId}&userId={userId}
```

### Resolve Conflicts
```
POST /api/import/resolve-conflicts?userId={userId}
Content-Type: application/json

{
  "conflicts": [...], // Array of conflict objects
  "resolutions": [...] // Array of resolution actions
}
```

## Usage Examples

### Import from JSON
```typescript
import { ImportService } from './import-service';

const importService = new ImportService();

const result = await importService.importFromJSON(
  'user-123',
  JSON.stringify(recipeData),
  {
    skipDuplicates: true,
    validateStrict: true,
    progressCallback: (progress) => {
      console.log(`Progress: ${progress.processedItems}/${progress.totalItems}`);
    }
  }
);

if (result.success) {
  console.log(`Imported ${result.progress.importedCount} recipes`);
} else {
  console.error('Import failed:', result.progress.errors);
}
```

### Import from CSV
```typescript
const csvData = `title,ingredients,instructions,servings
"Pasta Recipe","Pasta, Tomato Sauce","Boil pasta, Add sauce",4
"Salad Recipe","Lettuce, Tomato","Chop vegetables, Mix",2`;

const result = await importService.importFromCSV(
  'user-123',
  csvData,
  { skipDuplicates: true }
);
```

### Import from External Format
```typescript
const result = await importService.importFromExternalFormat(
  'user-123',
  recipeKeeperData,
  'recipe-keeper',
  { 
    batchSize: 5,
    overwriteExisting: false 
  }
);
```

## Data Format Normalization

The service automatically normalizes various input formats:

### Ingredient Formats
- String arrays: `["2 cups flour", "1 tsp salt"]`
- Object arrays: `[{name: "flour", quantity: 2, unit: "cups"}]`
- Mixed formats with automatic parsing

### Time Formats
- ISO 8601: `"PT30M"` (30 minutes)
- Text format: `"30 minutes"`, `"1 hour"`
- Numeric values in minutes

### Instruction Formats
- String arrays: `["Mix ingredients", "Bake for 30 minutes"]`
- Object arrays: `[{stepNumber: 1, description: "Mix ingredients"}]`

## Conflict Resolution

The service detects conflicts using multiple strategies:

1. **Title Match** - Exact title comparison (case-insensitive)
2. **URL Match** - Source URL comparison
3. **Content Similarity** - Ingredient and instruction similarity analysis

### Resolution Options
- `skip` - Skip the conflicting recipe
- `overwrite` - Replace the existing recipe
- `create_new` - Create with modified title
- `merge` - Combine ingredients and instructions

## Error Handling

Errors are categorized by severity:
- **Error** - Critical issues that prevent import
- **Warning** - Non-critical issues that allow partial import

Common error scenarios:
- Invalid JSON format
- Missing required fields
- Validation failures
- Database connection issues
- Duplicate detection conflicts

## Performance Considerations

- **Batch Processing** - Large imports are processed in configurable batches
- **Memory Management** - Streaming approach for large datasets
- **Progress Tracking** - Real-time updates without blocking
- **Connection Pooling** - Efficient database operations

## Configuration Options

```typescript
interface ImportOptions {
  skipDuplicates?: boolean;      // Skip recipes that already exist
  overwriteExisting?: boolean;   // Overwrite existing recipes
  validateStrict?: boolean;      // Enable strict validation
  batchSize?: number;           // Number of recipes per batch
  progressCallback?: (progress: ImportProgress) => void;
}
```

## Best Practices

1. **Use Batch Processing** for large imports (>100 recipes)
2. **Enable Progress Tracking** for user feedback
3. **Validate Data** before importing with `validateStrict: true`
4. **Handle Conflicts** proactively with appropriate resolution strategy
5. **Monitor Errors** and provide user-friendly feedback
6. **Test Formats** with small samples before bulk import

## Supported External Recipe Fields

The service recognizes and normalizes these common recipe fields:

- **Title**: `title`, `name`, `recipeName`
- **Ingredients**: `ingredients`, `recipeIngredient`, `ingredient_list`
- **Instructions**: `instructions`, `recipeInstructions`, `directions`, `method`
- **Times**: `cookTime`, `prepTime`, `totalTime` (various formats)
- **Servings**: `servings`, `yield`, `recipeYield`, `serves`
- **Metadata**: `category`, `tags`, `difficulty`, `cuisine`
- **Source**: `url`, `source`, `sourceUrl`