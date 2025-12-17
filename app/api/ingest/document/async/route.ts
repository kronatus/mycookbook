import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
// Temporarily disabled for build - will be fixed in document ingestion task
// import { DocumentIngestionService } from '../../../../../src/services/ingestion/document-ingestion-service';
import { RecipeService } from '../../../../../src/services/recipe-service';
import { createSuccessResponse, createErrorResponse } from '../../../../../src/utils/api-response';
import { withAuth, withErrorHandling, compose } from '../../../../../src/middleware/api-middleware';
import { createJob, updateJobProgress } from '../../../../../src/services/job-progress-service';

/**
 * POST /api/ingest/document/async - Upload and process document asynchronously with progress tracking
 * Temporarily disabled - will be implemented in document ingestion task
 */
async function handleAsyncDocumentIngestion(request: any) {
  return NextResponse.json(
    { error: 'Async document ingestion not yet implemented' },
    { status: 501 }
  );
  /*
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const options = formData.get('options') ? JSON.parse(formData.get('options') as string) : {};

    if (!file) {
      return createErrorResponse('No file provided', 400);
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse(
        'Unsupported file type. Only PDF and Word documents are supported.',
        400,
        { supportedTypes: ['pdf', 'docx', 'doc'] }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return createErrorResponse(
        `File size exceeds maximum allowed size of ${maxSize} bytes`,
        400,
        { actualSize: file.size, maxSize }
      );
    }

    // Create job for progress tracking
    const jobId = createJob(request.userId, 'document');

    // Start async processing
    processDocumentAsync(jobId, file, request.userId, options);

    return createSuccessResponse({
      jobId,
      message: 'Document upload started. Use the job ID to track progress.'
    }, 'Document processing started', 202);

  } catch (error) {
    console.error('Async document ingestion error:', error);
    return createErrorResponse(
      'An error occurred while starting document processing',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function processDocumentAsync(
  jobId: string,
  file: File,
  userId: string,
  options: any
) {
  try {
    // Stage 1: Upload file
    updateJobProgress(jobId, 'uploading', 10, 'Uploading file to storage...');
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(`documents/${Date.now()}-${file.name}`, fileBuffer, {
      access: 'public',
      contentType: file.type,
    });

    // Stage 2: Parse document
    updateJobProgress(jobId, 'parsing', 30, 'Parsing document content...');
    
    const documentIngestionService = new DocumentIngestionService();
    const result = await documentIngestionService.processDocument(
      fileBuffer,
      file.name,
      {
        maxFileSize: 10 * 1024 * 1024,
        allowedTypes: ['pdf', 'docx', 'doc'],
        ...options
      }
    );

    if (!result.success) {
      updateJobProgress(jobId, 'error', 0, 'Document parsing failed', undefined, result.error!.message);
      return;
    }

    // Stage 3: Extract recipes
    updateJobProgress(jobId, 'extracting', 50, `Extracted ${result.recipes!.length} recipes from document`);

    // Stage 4: Validate and save recipes
    updateJobProgress(jobId, 'saving', 70, 'Saving recipes to database...');
    
    const recipeService = new RecipeService();
    const savedRecipes = [];
    const errors = [];

    for (let i = 0; i < result.recipes!.length; i++) {
      const extractedRecipe = result.recipes![i];
      const progress = 70 + (i / result.recipes!.length) * 25;
      
      updateJobProgress(jobId, 'saving', progress, `Saving recipe ${i + 1} of ${result.recipes!.length}: ${extractedRecipe.title}`);

      try {
        const createRequest = {
          title: extractedRecipe.title,
          description: extractedRecipe.description,
          ingredients: extractedRecipe.ingredients,
          instructions: extractedRecipe.instructions,
          cookingTime: extractedRecipe.cookingTime,
          prepTime: extractedRecipe.prepTime,
          servings: extractedRecipe.servings,
          difficulty: extractedRecipe.difficulty,
          categories: extractedRecipe.categories || [],
          tags: extractedRecipe.tags || [],
          sourceUrl: blob.url,
          sourceType: 'document' as const,
          personalNotes: extractedRecipe.author ? `Original author: ${extractedRecipe.author}` : undefined,
          userId,
        };

        const saveResult = await recipeService.createRecipe(createRequest);
        if (saveResult.success) {
          savedRecipes.push(saveResult.recipe);
        } else {
          errors.push({
            recipe: extractedRecipe.title,
            error: saveResult.error.message
          });
        }
      } catch (error) {
        errors.push({
          recipe: extractedRecipe.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Stage 5: Complete
    const finalResult = {
      recipes: savedRecipes,
      metadata: result.metadata,
      blobUrl: blob.url,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalExtracted: result.recipes!.length,
        totalSaved: savedRecipes.length,
        totalErrors: errors.length
      }
    };

    updateJobProgress(
      jobId,
      'complete',
      100,
      `Processing complete. Saved ${savedRecipes.length} of ${result.recipes!.length} recipes.`,
      finalResult
    );

  } catch (error) {
    console.error('Async document processing error:', error);
    updateJobProgress(
      jobId,
      'error',
      0,
      'An unexpected error occurred during processing',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
  */
}

// Temporarily disabled export to avoid build issues
// export const POST = compose(
//   withErrorHandling,
//   withAuth
// )(handleAsyncDocumentIngestion);

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Async document ingestion not yet implemented' },
    { status: 501 }
  );
}