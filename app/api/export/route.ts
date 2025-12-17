import { NextRequest, NextResponse } from 'next/server';
import { ExportService } from '../../../src/services/export-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as 'json' | 'pdf' || 'json';
    const includePersonalNotes = searchParams.get('includePersonalNotes') !== 'false';
    const includeMetadata = searchParams.get('includeMetadata') !== 'false';
    const recipeId = searchParams.get('recipeId');
    
    // TODO: Get userId from authentication session
    // For now, using a placeholder - this should be replaced with actual auth
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const exportService = new ExportService();
    const options = {
      format,
      includePersonalNotes,
      includeMetadata
    };

    let result;
    if (recipeId) {
      // Export single recipe
      result = await exportService.exportSingleRecipe(recipeId, userId, options);
    } else {
      // Export all recipes
      result = await exportService.exportRecipes(userId, options);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return the exported data with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', result.mimeType || 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`);

    return new NextResponse(result.data as string, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}