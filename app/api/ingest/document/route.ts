import { NextRequest, NextResponse } from 'next/server';
import { DocumentIngestionService } from '../../../../src/services/ingestion/document-ingestion-service';
import { RecipeService } from '../../../../src/services/recipe-service';

export async function POST(request: NextRequest) {
  try {
    console.log('Document ingestion API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('File received:', file ? file.name : 'No file');
    
    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Unsupported file type. Only PDF and Word documents are supported.',
        supportedTypes: ['pdf', 'docx', 'doc']
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
        actualSize: file.size,
        maxSize
      }, { status: 400 });
    }

    // Convert file to buffer
    console.log('Converting file to buffer...');
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Process document
    console.log('Processing document...');
    const documentIngestionService = new DocumentIngestionService();
    const result = await documentIngestionService.processDocument(
      fileBuffer,
      file.name,
      {
        maxFileSize: maxSize,
        allowedTypes: ['pdf', 'docx', 'doc']
      }
    );

    console.log('Document processing result:', result.success ? 'Success' : 'Failed');

    if (!result.success) {
      console.log('Document processing failed:', result.error);
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
      return NextResponse.json({
        error: result.error!.message,
        details: result.error!.details
      }, { status });
    }

    console.log(`Extracted ${result.recipes?.length || 0} recipes from document`);

    // Save recipes to database
    const recipeService = new RecipeService();
    const savedRecipes = [];
    const errors = [];

    for (const extractedRecipe of result.recipes!) {
      try {
        console.log(`Saving recipe: ${extractedRecipe.title}`);
        
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
          sourceUrl: `document://${file.name}`,
          sourceType: 'document' as const,
          personalNotes: extractedRecipe.author ? `Original author: ${extractedRecipe.author}` : undefined,
          userId: 'anonymous'
        };

        const saveResult = await recipeService.createRecipe(createRequest);
        if (saveResult.success) {
          savedRecipes.push(saveResult.recipe);
          console.log(`Successfully saved recipe: ${extractedRecipe.title}`);
        } else {
          console.log(`Failed to save recipe: ${extractedRecipe.title}`, saveResult.error);
          errors.push({
            recipe: extractedRecipe.title,
            error: saveResult.error.message
          });
        }
      } catch (error) {
        console.log(`Error saving recipe: ${extractedRecipe.title}`, error);
        errors.push({
          recipe: extractedRecipe.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Saved ${savedRecipes.length} recipes, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: `Successfully processed document and saved ${savedRecipes.length} recipes`,
      data: {
        recipes: savedRecipes,
        metadata: result.metadata,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          totalExtracted: result.recipes!.length,
          totalSaved: savedRecipes.length,
          totalErrors: errors.length
        }
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Document ingestion error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}