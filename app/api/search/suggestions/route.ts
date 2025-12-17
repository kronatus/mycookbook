import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const recipeService = new RecipeService();

// GET /api/search/suggestions - Get search suggestions based on history and content
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const partialTerm = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await recipeService.getSearchSuggestions(
      session.user.id, 
      partialTerm
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.type === 'database' ? 500 : 400 }
      );
    }

    return NextResponse.json({
      suggestions: result.suggestions.slice(0, limit),
      count: result.suggestions.length
    });

  } catch (error) {
    console.error('Error in GET /api/search/suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}