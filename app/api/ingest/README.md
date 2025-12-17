# Recipe Ingestion API

This directory contains API endpoints for ingesting recipes from various sources including URLs, documents, and batch operations.

## Endpoints

### GET /api/ingest
Get information about the ingestion service capabilities.

**Response:**
```json
{
  "data": {
    "supportedDomains": ["allrecipes.com", "youtube.com", "tiktok.com", "instagram.com"],
    "adapters": [
      {
        "name": "AllRecipes",
        "domains": ["allrecipes.com"]
      }
    ],
    "capabilities": {
      "urlIngestion": true,
      "documentIngestion": true,
      "videoIngestion": true,
      "previewMode": true
    }
  }
}
```

### POST /api/ingest
Ingest a recipe from a URL and save it to the database.

**Request Body:**
```json
{
  "url": "https://example.com/recipe",
  "options": {
    "timeout": 30000,
    "maxRetries": 2,
    "skipValidation": false
  }
}
```

**Response:**
```json
{
  "data": {
    "recipe": { /* Recipe object */ },
    "extractedData": { /* Raw extracted data */ },
    "validationResult": {
      "isValid": true,
      "errors": [],
      "warnings": []
    }
  },
  "message": "Recipe successfully ingested from URL"
}
```

### POST /api/ingest/preview
Preview recipe extraction from a URL without saving to database.

**Request Body:**
```json
{
  "url": "https://example.com/recipe"
}
```

**Response:**
```json
{
  "data": {
    "extractedData": { /* Raw extracted data */ },
    "validationResult": {
      "isValid": true,
      "errors": [],
      "warnings": []
    },
    "canSave": true
  },
  "message": "Recipe preview generated successfully"
}
```

### POST /api/ingest/document
Upload and process a document (PDF or Word) for recipe extraction.

**Request:**
- Content-Type: `multipart/form-data`
- Form fields:
  - `file`: The document file (PDF, DOC, DOCX)
  - `options`: JSON string with processing options (optional)

**Response:**
```json
{
  "data": {
    "recipes": [/* Array of saved recipe objects */],
    "metadata": {
      "fileName": "recipes.pdf",
      "fileSize": 1024000,
      "fileType": "pdf",
      "pageCount": 5
    },
    "blobUrl": "https://blob.vercel-storage.com/...",
    "summary": {
      "totalExtracted": 3,
      "totalSaved": 3,
      "totalErrors": 0
    }
  },
  "message": "Successfully processed document and saved 3 recipes"
}
```

### POST /api/ingest/document/async
Upload and process a document asynchronously with progress tracking.

**Request:**
- Same as `/api/ingest/document`

**Response:**
```json
{
  "data": {
    "jobId": "document_1234567890_abc123",
    "message": "Document upload started. Use the job ID to track progress."
  },
  "message": "Document processing started"
}
```

### POST /api/ingest/batch
Ingest multiple recipes from URLs in batch.

**Request Body:**
```json
{
  "urls": [
    "https://example1.com/recipe",
    "https://example2.com/recipe"
  ],
  "options": {
    "timeout": 30000,
    "maxRetries": 2,
    "skipValidation": false,
    "maxConcurrent": 3
  }
}
```

**Response:**
```json
{
  "data": {
    "jobId": "url_1234567890_xyz789",
    "totalUrls": 2,
    "message": "Batch ingestion started. Use the job ID to track progress."
  },
  "message": "Batch processing started"
}
```

### GET /api/ingest/progress/[jobId]
Get the progress of an ingestion job.

**Response:**
```json
{
  "data": {
    "id": "document_1234567890_abc123",
    "stage": "extracting",
    "progress": 45,
    "message": "Extracting recipes from document...",
    "startTime": "2023-12-01T10:00:00Z",
    "endTime": null,
    "result": null,
    "error": null,
    "isComplete": false
  }
}
```

### DELETE /api/ingest/progress/[jobId]
Cancel an ingestion job.

**Response:**
```json
{
  "data": {
    "message": "Job cancelled successfully"
  }
}
```

## Job Stages

Jobs progress through the following stages:

1. **uploading** - File is being uploaded or URL is being fetched
2. **parsing** - Document/content is being parsed
3. **extracting** - Recipes are being extracted from content
4. **validating** - Extracted recipes are being validated
5. **saving** - Recipes are being saved to database
6. **complete** - Job finished successfully
7. **error** - Job failed with an error

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": {
    /* Additional error details */
  }
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (for successful ingestion)
- `202` - Accepted (for async operations)
- `400` - Bad Request (validation errors, unsupported URLs)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied)
- `404` - Not Found (job not found)
- `422` - Unprocessable Entity (parsing errors)
- `500` - Internal Server Error
- `502` - Bad Gateway (network errors)

## File Upload Limits

- Maximum file size: 10MB
- Supported formats: PDF, DOC, DOCX
- Files are stored in Vercel Blob storage for reference

## Rate Limiting

- Batch operations limited to 50 URLs per request
- Concurrent processing limited to 3 URLs at a time (configurable)
- Job progress data is cleaned up after 24 hours

## Authentication

All endpoints require authentication. Include a valid session token in your requests.