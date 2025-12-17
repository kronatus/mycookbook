import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const recipeService = new RecipeService();

// GET /api/recipes/count - Get the total count of recipes for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await recipeService.getRecipeCount(session.user.id);

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