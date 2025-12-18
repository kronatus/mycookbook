import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const recipeService = new RecipeService();

// GET /api/recipes - Get all recipes (anonymous access allowed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters for filtering
    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | undefined;
    const maxCookingTime = searchParams.get('maxCookingTime') ? parseInt(searchParams.get('maxCookingTime')!) : undefined;
    const maxPrepTime = searchParams.get('maxPrepTime') ? parseInt(searchParams.get('maxPrepTime')!) : undefined;
    const search = searchParams.get('search');

    let result;

    if (search) {
      // Search all recipes (not user-specific)
      const searchResult = await recipeService.searchRecipes('anonymous', search, false);
      if (!searchResult.success) {
        return NextResponse.json(
          { error: searchResult.error?.message || 'Search failed' },
          { status: searchResult.error?.type === 'database' ? 500 : 400 }
        );
      }
      
      result = {
        success: true,
        recipes: searchResult.results.map(r => r.recipe)
      };
    } else {
      // Get all recipes with optional filters (not user-specific)
      const filters = {
        ...(categories && { categories }),
        ...(tags && { tags }),
        ...(difficulty && { difficulty }),
        ...(maxCookingTime && { maxCookingTime }),
        ...(maxPrepTime && { maxPrepTime }),
      };

      result = await recipeService.getAllRecipes(Object.keys(filters).length > 0 ? filters : undefined);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch recipes' },
        { status: result.error?.type === 'database' ? 500 : 400 }
      );
    }

    return NextResponse.json({
      recipes: result.recipes,
      count: result.recipes.length
    });

  } catch (error) {
    console.error('Error in GET /api/recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create a new recipe (anonymous access allowed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.ingredients || !body.instructions) {
      return NextResponse.json(
        { error: 'Missing required fields: title, ingredients, instructions' },
        { status: 400 }
      );
    }

    const createRequest = {
      ...body,
      userId: 'anonymous' // Allow anonymous recipe creation
    };

    const result = await recipeService.createRecipe(createRequest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, details: result.error.details },
        { status: result.error.type === 'validation' ? 400 : 500 }
      );
    }

    return NextResponse.json(
      { recipe: result.recipe },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}