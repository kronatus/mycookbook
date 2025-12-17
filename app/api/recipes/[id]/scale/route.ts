import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const recipeService = new RecipeService();

// POST /api/recipes/[id]/scale - Scale a recipe to a different serving size
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!body.newServings || typeof body.newServings !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid newServings parameter' },
        { status: 400 }
      );
    }

    const scaleRequest = {
      recipeId: params.id,
      newServings: body.newServings,
      userId: session.user.id
    };

    const result = await recipeService.scaleRecipe(scaleRequest);

    if (!result.success) {
      const status = result.error.type === 'not_found' ? 404 : 
                   result.error.type === 'unauthorized' ? 403 :
                   result.error.type === 'validation' ? 400 : 500;
      
      return NextResponse.json(
        { error: result.error.message },
        { status }
      );
    }

    return NextResponse.json({ recipe: result.recipe });

  } catch (error) {
    console.error('Error in POST /api/recipes/[id]/scale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}