import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '../../../../src/services/import-service';

// Store for tracking import progress (in production, use Redis or database)
const importJobs = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // TODO: Get userId from authentication session
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      data, 
      format = 'generic-json',
      options = {},
      jobId 
    } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Import data is required' },
        { status: 400 }
      );
    }

    const importJobId = jobId || `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize job tracking
    importJobs.set(importJobId, {
      status: 'processing',
      progress: {
        totalItems: 0,
        processedItems: 0,
        importedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        errors: []
      },
      startTime: new Date(),
      userId
    });

    // Start import process asynchronously
    processImportJob(importJobId, userId, data, format, options);

    return NextResponse.json({
      success: true,
      jobId: importJobId,
      message: 'Import job started. Use the job ID to track progress.'
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const job = importJobs.get(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to job' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      jobId,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      endTime: job.endTime,
      result: job.result,
      duplicateConflicts: job.duplicateConflicts
    });

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processImportJob(
  jobId: string, 
  userId: string, 
  data: string, 
  format: string, 
  options: any
) {
  try {
    const importService = new ImportService();
    const job = importJobs.get(jobId);
    
    if (!job) return;

    // Set up progress callback
    const progressCallback = (progress: any) => {
      job.progress = progress;
      job.status = 'processing';
    };

    const importOptions = {
      ...options,
      progressCallback,
      batchSize: options.batchSize || 5 // Smaller batches for better progress tracking
    };

    let result;

    if (format === 'csv') {
      result = await importService.importFromCSV(userId, data, importOptions);
    } else if (['recipe-keeper', 'paprika', 'yummly', 'allrecipes', 'generic-json'].includes(format)) {
      result = await importService.importFromExternalFormat(userId, data, format as any, importOptions);
    } else {
      result = await importService.importFromJSON(userId, data, importOptions);
    }

    // Update job with final result
    job.status = result.success ? 'completed' : 'failed';
    job.progress = result.progress;
    job.result = result;
    job.duplicateConflicts = result.duplicateConflicts;
    job.endTime = new Date();

    // Clean up job after 1 hour
    setTimeout(() => {
      importJobs.delete(jobId);
    }, 60 * 60 * 1000);

  } catch (error) {
    const job = importJobs.get(jobId);
    if (job) {
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();
    }
  }
}