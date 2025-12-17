import { NextRequest, NextResponse } from 'next/server';
import { RecipeService } from '../../../../src/services/recipe-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const recipeService = new RecipeService();

// DELETE /api/search/history - Clear search history
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await recipeService.clearSearchHistory(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.type === 'database' ? 500 : 400 }
      );
    }

    return NextResponse.json({
      message: 'Search history cleared successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/search/history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}