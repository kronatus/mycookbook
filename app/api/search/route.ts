import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const recipeService = new RecipeService();

// GET /api/search - Enhanced search with full-text search and highlighting
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
    const query = searchParams.get('q');
    const includeHighlights = searchParams.get('highlights') === 'true';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const result = await recipeService.searchRecipes(
      session.user.id, 
      query, 
      includeHighlights
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.type === 'database' ? 500 : 400 }
      );
    }

    return NextResponse.json({
      results: result.results,
      count: result.results.length,
      query: query,
      highlights: includeHighlights
    });

  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}