import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const recipeService = new RecipeService();

// GET /api/recipes/[id] - Get a specific recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await recipeService.getRecipeById(id, session.user.id);

    if (!result.success) {
      const status = result.error.type === 'not_found' ? 404 : 
                   result.error.type === 'unauthorized' ? 403 : 500;
      
      return NextResponse.json(
        { error: result.error.message },
        { status }
      );
    }

    return NextResponse.json({ recipe: result.recipe });

  } catch (error) {
    console.error('Error in GET /api/recipes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/recipes/[id] - Update a specific recipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;

    const result = await recipeService.updateRecipe(id, session.user.id, body);

    if (!result.success) {
      const status = result.error.type === 'not_found' ? 404 : 
                   result.error.type === 'unauthorized' ? 403 :
                   result.error.type === 'validation' ? 400 : 500;
      
      return NextResponse.json(
        { error: result.error.message, details: result.error.details },
        { status }
      );
    }

    return NextResponse.json({ recipe: result.recipe });

  } catch (error) {
    console.error('Error in PUT /api/recipes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id] - Delete a specific recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await recipeService.deleteRecipe(id, session.user.id);

    if (!result.success) {
      const status = result.error.type === 'not_found' ? 404 : 
                   result.error.type === 'unauthorized' ? 403 : 500;
      
      return NextResponse.json(
        { error: result.error.message },
        { status }
      );
    }

    return NextResponse.json(
      { message: 'Recipe deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in DELETE /api/recipes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}