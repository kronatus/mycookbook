# Export Service Documentation

The Export Service provides comprehensive data export, backup, and import capabilities for the Personal Cookbook application.

## Features

### Export Functionality
- **JSON Export**: Export recipes in structured JSON format
- **PDF Export**: Export recipes in PDF format (basic text-based implementation)
- **Single Recipe Export**: Export individual recipes
- **Bulk Export**: Export all user recipes at once

### Backup & Restore
- **Complete Backup**: Create full backups with metadata and version information
- **Restore from Backup**: Restore recipes from backup files with duplicate handling
- **Version Compatibility**: Automatic version checking for backup compatibility

### Import Capabilities
- **JSON Import**: Import recipes from external JSON files
- **Duplicate Handling**: Skip or overwrite duplicate recipes based on title
- **Data Validation**: Validate imported recipe data structure
- **Error Reporting**: Detailed error reporting for failed imports

## API Endpoints

### Export Endpoints

#### GET /api/export
Export user recipes in specified format.

**Query Parameters:**
- `userId` (required): User identifier
- `format`: Export format (`json` | `pdf`, default: `json`)
- `includePersonalNotes`: Include personal notes (`true` | `false`, default: `true`)
- `includeMetadata`: Include metadata like dates (`true` | `false`, default: `true`)
- `recipeId`: Export single recipe (optional)

**Response:**
- File download with appropriate Content-Type and filename

#### GET /api/export/backup
Create a complete backup of user's recipes.

**Query Parameters:**
- `userId` (required): User identifier

**Response:**
- JSON backup file with version information and complete recipe data

#### POST /api/export/backup
Restore recipes from a backup file.

**Request Body:**
```json
{
  "backupData": "string", // JSON backup content
  "options": {
    "skipDuplicates": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "importedCount": 5,
  "skippedCount": 2,
  "errors": ["Optional error messages"]
}
```

### Import Endpoints

#### POST /api/import
Import recipes from JSON data.

**Request Body:**
```json
{
  "jsonData": "string", // JSON recipe data
  "options": {
    "skipDuplicates": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "importedCount": 3,
  "skippedCount": 1,
  "errors": ["Optional error messages"]
}
```

## Usage Examples

### Export All Recipes as JSON
```typescript
const exportService = new ExportService();
const result = await exportService.exportRecipes('user-123', {
  format: 'json',
  includePersonalNotes: true,
  includeMetadata: true
});

if (result.success) {
  // Download or save result.data
  console.log(`Exported to: ${result.filename}`);
}
```

### Create Backup
```typescript
const exportService = new ExportService();
const backup = await exportService.createBackup('user-123');

if (backup.success) {
  // Save backup.data to file
  console.log(`Backup created: ${backup.filename}`);
}
```

### Import Recipes
```typescript
const exportService = new ExportService();
const jsonData = '...'; // JSON string with recipe data

const result = await exportService.importFromJSON('user-123', jsonData, {
  skipDuplicates: true
});

console.log(`Imported: ${result.importedCount}, Skipped: ${result.skippedCount}`);
```

## Data Formats

### Recipe Export Format
```json
{
  "id": "uuid",
  "title": "Recipe Title",
  "description": "Recipe description",
  "ingredients": [
    {
      "name": "flour",
      "quantity": 2,
      "unit": "cups",
      "notes": "all-purpose"
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
  "categories": ["baking"],
  "tags": ["dessert"],
  "sourceUrl": "https://example.com",
  "sourceType": "web",
  "personalNotes": "My notes",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-02T00:00:00.000Z",
  "userId": "user-123"
}
```

### Backup Format
```json
{
  "version": "1.0.0",
  "exportDate": "2023-12-17T00:00:00.000Z",
  "recipeCount": 5,
  "recipes": [
    // Array of recipe objects
  ]
}
```

## Error Handling

The service provides comprehensive error handling with specific error types:

- **Validation Errors**: Invalid recipe data structure
- **Not Found Errors**: Recipe or user not found
- **Unauthorized Errors**: Access to recipes not owned by user
- **Database Errors**: Database operation failures
- **Format Errors**: Invalid backup or import data format

## Security Considerations

- All operations require user authentication
- Users can only export/import their own recipes
- Backup files include version information for compatibility checking
- Input validation prevents malicious data injection

## Future Enhancements

- **PDF Generation**: Implement proper PDF generation using libraries like pdfkit
- **Excel Export**: Add Excel/CSV export capabilities
- **Recipe Sharing**: Export recipes for sharing with other users
- **Batch Operations**: Bulk import from multiple files
- **Format Migration**: Automatic data format migration between versions