import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
// Temporarily disabled for build - will be fixed in document ingestion task
// import { DocumentIngestionService } from '../../../../src/services/ingestion/document-ingestion-service';
import { RecipeService } from '../../../../src/services/recipe-service';
import { createSuccessResponse, createErrorResponse } from '../../../../src/utils/api-response';
import { withAuth, withErrorHandling, compose } from '../../../../src/middleware/api-middleware';

interface DocumentIngestionProgress {
  stage: 'uploading' | 'parsing' | 'extracting' | 'validating' | 'saving' | 'complete';
  progress: number;
  message: string;
  recipes?: any[];
  error?: string;
}

/**
 * POST /api/ingest/document - Upload and process document for recipe extraction
 * Temporarily disabled - will be implemented in document ingestion task
 */
async function handleDocumentIngestion(request: any) {
  return NextResponse.json(
    { error: 'Document ingestion not yet implemented' },
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

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload file to Vercel Blob storage for backup/reference
    const blob = await put(`documents/${Date.now()}-${file.name}`, fileBuffer, {
      access: 'public',
      contentType: file.type,
    });

    // Process document
    const documentIngestionService = new DocumentIngestionService();
    const result = await documentIngestionService.processDocument(
      fileBuffer,
      file.name,
      {
        maxFileSize: maxSize,
        allowedTypes: ['pdf', 'docx', 'doc'],
        ...options
      }
    );

    if (!result.success) {
      let status = 500;
      switch (result.error?.type) {
        case 'file_size':
        case 'file_type':
        case 'validation':
          status = 400;
          break;
        case 'parsing':
          status = 422;
          break;
      }
      return createErrorResponse(result.error!.message, status, result.error!.details);
    }

    // Save recipes to database
    const recipeService = new RecipeService();
    const savedRecipes = [];
    const errors = [];

    for (const extractedRecipe of result.recipes!) {
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
          sourceUrl: blob.url, // Reference to uploaded document
          sourceType: 'document' as const,
          personalNotes: extractedRecipe.author ? `Original author: ${extractedRecipe.author}` : undefined,
          userId: request.userId,
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

    return createSuccessResponse({
      recipes: savedRecipes,
      metadata: result.metadata,
      blobUrl: blob.url,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalExtracted: result.recipes!.length,
        totalSaved: savedRecipes.length,
        totalErrors: errors.length
      }
    }, `Successfully processed document and saved ${savedRecipes.length} recipes`, 201);

  } catch (error) {
    console.error('Document ingestion error:', error);
    return createErrorResponse(
      'An error occurred while processing the document',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
  */
}

// Temporarily disabled export to avoid build issues
// export const POST = compose(
//   withErrorHandling,
//   withAuth
// )(handleDocumentIngestion);

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Document ingestion not yet implemented' },
    { status: 501 }
  );
}