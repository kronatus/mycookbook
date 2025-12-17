import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const recipeService = new RecipeService();

// GET /api/recipes/categories/[category] - Get recipes by category
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Decode the category parameter in case it contains special characters
    const category = decodeURIComponent(params.category);

    const result = await recipeService.getRecipesByCategory(session.user.id, category);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.type === 'database' ? 500 : 400 }
      );
    }

    return NextResponse.json({
      recipes: result.recipes,
      category: category,
      count: result.recipes.length
    });

  } catch (error) {
    console.error('Error in GET /api/recipes/categories/[category]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}