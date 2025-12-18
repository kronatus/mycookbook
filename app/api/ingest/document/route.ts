import { NextRequest, NextResponse } from 'next/server';
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
        error: 'Unsupported file type. Currently only PDF documents are fully supported. Word document support is temporarily disabled.',
        supportedTypes: ['pdf'],
        note: 'Word document support will be restored in a future update'
      }, { status: 400 });
    }

    // Special handling for Word documents
    if (file.type.includes('word') || file.type.includes('document')) {
      console.log('Word document detected - using placeholder approach');
      
      // Create a placeholder recipe for Word documents
      const placeholderRecipe = {
        title: `Recipe from ${file.name}`,
        description: `Word document "${file.name}" was uploaded successfully. Automatic text extraction from Word documents is temporarily unavailable due to server compatibility issues. Please edit this recipe to add your content manually, or try converting your document to PDF format.`,
        ingredients: [
          { name: 'Please add ingredients manually', quantity: undefined, unit: undefined, notes: 'Edit this recipe to add your ingredients' }
        ],
        instructions: [
          { stepNumber: 1, description: 'Please add cooking instructions manually', duration: undefined }
        ],
        cookingTime: undefined,
        prepTime: undefined,
        servings: undefined,
        difficulty: undefined,
        categories: [],
        tags: ['imported', 'word-document', 'needs-editing'],
        sourceUrl: `document://${file.name}`,
        sourceType: 'document' as const,
        author: undefined,
        publishedDate: undefined
      };

      // Save the placeholder recipe
      const recipeService = new RecipeService();
      const createRequest = {
        title: placeholderRecipe.title,
        description: placeholderRecipe.description,
        ingredients: placeholderRecipe.ingredients,
        instructions: placeholderRecipe.instructions,
        cookingTime: placeholderRecipe.cookingTime,
        prepTime: placeholderRecipe.prepTime,
        servings: placeholderRecipe.servings,
        difficulty: placeholderRecipe.difficulty,
        categories: placeholderRecipe.categories,
        tags: placeholderRecipe.tags,
        sourceUrl: placeholderRecipe.sourceUrl,
        sourceType: placeholderRecipe.sourceType,
        personalNotes: 'This recipe was created from a Word document upload. Please edit to add your actual recipe content.',
        userId: 'anonymous'
      };

      const saveResult = await recipeService.createRecipe(createRequest);
      
      if (saveResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Word document uploaded successfully. Please edit the created recipe to add your content.',
          data: {
            recipes: [saveResult.recipe],
            summary: {
              totalExtracted: 1,
              totalSaved: 1,
              totalErrors: 0
            },
            note: 'Word document parsing is temporarily disabled. A placeholder recipe was created for you to edit.'
          }
        }, { status: 201 });
      } else {
        return NextResponse.json({
          error: 'Failed to create placeholder recipe',
          details: saveResult.error.message
        }, { status: 500 });
      }
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

    // Process document based on type
    console.log('Processing document...');
    
    let result;
    
    if (file.type === 'application/pdf') {
      // Handle PDF processing (this would need pdf-parse import)
      console.log('PDF processing is not yet implemented');
      result = {
        success: false,
        error: {
          type: 'parsing',
          message: 'PDF processing is temporarily disabled'
        }
      };
    } else {
      // Handle Word documents and other formats
      console.log('Creating placeholder for non-PDF document');
      result = {
        success: true,
        recipes: [{
          title: `Recipe from ${file.name}`,
          description: 'Document uploaded successfully. Automatic text extraction is currently unavailable. Please edit this recipe manually.',
          ingredients: [
            { name: 'Add ingredients manually', quantity: undefined, unit: undefined, notes: undefined }
          ],
          instructions: [
            { stepNumber: 1, description: 'Add cooking instructions manually', duration: undefined }
          ],
          cookingTime: undefined,
          prepTime: undefined,
          servings: undefined,
          difficulty: undefined,
          categories: [],
          tags: ['imported', 'needs-editing'],
          sourceUrl: `document://${file.name}`,
          sourceType: 'document' as const,
          author: undefined,
          publishedDate: undefined
        }],
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      };
    }

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
        error: result.error!.message
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