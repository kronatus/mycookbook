import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const recipeService = new RecipeService();

// GET /api/recipes/count - Get the total count of all recipes (anonymous access allowed)
export async function GET(request: NextRequest) {
  try {
    const result = await recipeService.getTotalRecipeCount();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.type === 'database' ? 500 : 400 }
      );
    }

    return NextResponse.json({
      count: result.count
    });

  } catch (error) {
    console.error('Error in GET /api/recipes/count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}