import { NextRequest, NextResponse } from 'next/server';
import { ExportService } from '../../../../src/services/export-service';

export async function GET(request: NextRequest) {
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

    const exportService = new ExportService();
    const result = await exportService.createBackup(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return the backup data with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', result.mimeType || 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`);

    return new NextResponse(result.data as string, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { backupData, options = {} } = body;

    if (!backupData) {
      return NextResponse.json(
        { error: 'Backup data is required' },
        { status: 400 }
      );
    }

    const exportService = new ExportService();
    const result = await exportService.restoreFromBackup(userId, backupData, options);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Restore failed',
          details: result.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      errors: result.errors
    });

  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}