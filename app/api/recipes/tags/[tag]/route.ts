import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const recipeService = new RecipeService();

// GET /api/recipes/tags/[tag] - Get recipes by tag
export async function GET(
  request: NextRequest,
  { params }: { params: { tag: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Decode the tag parameter in case it contains special characters
    const tag = decodeURIComponent(params.tag);

    const result = await recipeService.getRecipesByTag(session.user.id, tag);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.type === 'database' ? 500 : 400 }
      );
    }

    return NextResponse.json({
      recipes: result.recipes,
      tag: tag,
      count: result.recipes.length
    });

  } catch (error) {
    console.error('Error in GET /api/recipes/tags/[tag]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}