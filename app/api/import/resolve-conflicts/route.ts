import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '../../../../src/services/import-service';
import { RecipeRepository } from '../../../../src/repositories/recipe-repository';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // TODO: Get userId from authentication session
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conflicts, resolutions } = body;

    if (!conflicts || !Array.isArray(conflicts) || !resolutions || !Array.isArray(resolutions)) {
      return NextResponse.json(
        { error: 'Conflicts and resolutions arrays are required' },
        { status: 400 }
      );
    }

    if (conflicts.length !== resolutions.length) {
      return NextResponse.json(
        { error: 'Conflicts and resolutions arrays must have the same length' },
        { status: 400 }
      );
    }

    const repository = new RecipeRepository();
    const results = [];

    for (let i = 0; i < conflicts.length; i++) {
      const conflict = conflicts[i];
      const resolution = resolutions[i];

      try {
        let result;

        switch (resolution.action) {
          case 'skip':
            result = {
              success: true,
              action: 'skipped',
              recipeTitle: conflict.importedRecipe.title
            };
            break;

          case 'overwrite':
            if (!conflict.existingRecipe?.id) {
              throw new Error('Cannot overwrite: existing recipe ID not found');
            }
            
            const updatedRecipe = await repository.update(
              conflict.existingRecipe.id,
              {
                ...conflict.importedRecipe,
                userId // Ensure userId is preserved
              }
            );
            
            result = {
              success: true,
              action: 'overwritten',
              recipeId: conflict.existingRecipe.id,
              recipeTitle: conflict.importedRecipe.title
            };
            break;

          case 'create_new':
            // Create with modified title to avoid conflict
            const newTitle = resolution.newTitle || `${conflict.importedRecipe.title} (Imported)`;
            
            const newRecipe = await repository.create({
              ...conflict.importedRecipe,
              title: newTitle,
              userId
            });
            
            result = {
              success: true,
              action: 'created_new',
              recipeId: newRecipe.id,
              recipeTitle: newTitle
            };
            break;

          case 'merge':
            if (!conflict.existingRecipe?.id) {
              throw new Error('Cannot merge: existing recipe ID not found');
            }

            // Merge logic: combine ingredients and instructions, prefer imported metadata
            const existingRecipe = conflict.existingRecipe;
            const importedRecipe = conflict.importedRecipe;

            // Merge ingredients (avoid duplicates)
            const mergedIngredients = [...existingRecipe.ingredients];
            for (const importedIng of importedRecipe.ingredients) {
              const exists = mergedIngredients.some(existing => 
                existing.name.toLowerCase() === importedIng.name.toLowerCase()
              );
              if (!exists) {
                mergedIngredients.push(importedIng);
              }
            }

            // Merge instructions (append imported ones)
            const mergedInstructions = [
              ...existingRecipe.instructions,
              ...importedRecipe.instructions.map((inst: any) => ({
                ...inst,
                stepNumber: inst.stepNumber + existingRecipe.instructions.length
              }))
            ];

            // Merge categories and tags
            const mergedCategories = Array.from(new Set([...existingRecipe.categories, ...importedRecipe.categories]));
            const mergedTags = Array.from(new Set([...existingRecipe.tags, ...importedRecipe.tags]));

            const mergedRecipe = await repository.update(existingRecipe.id, {
              title: existingRecipe.title, // Keep existing title
              description: importedRecipe.description || existingRecipe.description,
              ingredients: mergedIngredients,
              instructions: mergedInstructions,
              cookingTime: importedRecipe.cookingTime || existingRecipe.cookingTime,
              prepTime: importedRecipe.prepTime || existingRecipe.prepTime,
              servings: importedRecipe.servings || existingRecipe.servings,
              difficulty: importedRecipe.difficulty || existingRecipe.difficulty,
              categories: mergedCategories,
              tags: mergedTags,
              sourceUrl: importedRecipe.sourceUrl || existingRecipe.sourceUrl,
              sourceType: existingRecipe.sourceType, // Keep existing source type
              personalNotes: existingRecipe.personalNotes 
                ? `${existingRecipe.personalNotes}\n\nMerged with imported recipe: ${importedRecipe.personalNotes || 'No additional notes'}`
                : importedRecipe.personalNotes,
              userId
            });

            result = {
              success: true,
              action: 'merged',
              recipeId: existingRecipe.id,
              recipeTitle: existingRecipe.title
            };
            break;

          default:
            throw new Error(`Unknown resolution action: ${resolution.action}`);
        }

        results.push(result);

      } catch (error) {
        results.push({
          success: false,
          action: 'error',
          recipeTitle: conflict.importedRecipe?.title || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: errorCount === 0,
      totalConflicts: conflicts.length,
      resolvedCount: successCount,
      errorCount,
      results
    });

  } catch (error) {
    console.error('Conflict resolution error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}