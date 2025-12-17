import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '../../../src/services/import-service';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // TODO: Get userId from authentication session
    // For now, using a placeholder - this should be replaced with actual auth
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const importService = new ImportService();
    
    let result;

    if (contentType.includes('application/json')) {
      // Handle JSON import
      const body = await request.json();
      const { 
        data, 
        format = 'generic-json',
        options = {} 
      } = body;

      if (!data) {
        return NextResponse.json(
          { error: 'Import data is required' },
          { status: 400 }
        );
      }

      if (format === 'csv') {
        result = await importService.importFromCSV(userId, data, options);
      } else if (['recipe-keeper', 'paprika', 'yummly', 'allrecipes', 'generic-json'].includes(format)) {
        result = await importService.importFromExternalFormat(userId, data, format as any, options);
      } else {
        result = await importService.importFromJSON(userId, data, options);
      }
    } else if (contentType.includes('text/csv')) {
      // Handle CSV upload
      const csvData = await request.text();
      const options = {
        skipDuplicates: searchParams.get('skipDuplicates') === 'true',
        overwriteExisting: searchParams.get('overwriteExisting') === 'true',
        validateStrict: searchParams.get('validateStrict') === 'true'
      };
      
      result = await importService.importFromCSV(userId, csvData, options);
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type. Use application/json or text/csv' },
        { status: 400 }
      );
    }

    if (!result.success && result.progress.errorCount === result.progress.totalItems) {
      return NextResponse.json(
        { 
          error: 'Import failed completely',
          progress: result.progress,
          duplicateConflicts: result.duplicateConflicts
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: result.success,
      progress: result.progress,
      duplicateConflicts: result.duplicateConflicts
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}