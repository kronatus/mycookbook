import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../../../../src/utils/api-response';
import { withAuth, withErrorHandling, compose } from '../../../../../src/middleware/api-middleware';
import { getJob, updateJobProgress } from '../../../../../src/services/job-progress-service';



/**
 * GET /api/ingest/progress/[jobId] - Get progress of an ingestion job
 */
async function handleGetProgress(
  request: any,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const userId = request.userId;

  if (!jobId) {
    return createErrorResponse('Job ID is required', 400);
  }

  const job = getJob(jobId);

  if (!job) {
    return createErrorResponse('Job not found', 404);
  }

  // Ensure user can only access their own jobs
  if (job.userId !== userId) {
    return createErrorResponse('Unauthorized access to job', 403);
  }

  return createSuccessResponse({
    id: job.id,
    stage: job.stage,
    progress: job.progress,
    message: job.message,
    startTime: job.startTime,
    endTime: job.endTime,
    result: job.result,
    error: job.error,
    isComplete: job.stage === 'complete' || job.stage === 'error'
  });
}

/**
 * DELETE /api/ingest/progress/[jobId] - Cancel an ingestion job
 */
async function handleCancelJob(
  request: any,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const userId = request.userId;

  if (!jobId) {
    return createErrorResponse('Job ID is required', 400);
  }

  const job = getJob(jobId);

  if (!job) {
    return createErrorResponse('Job not found', 404);
  }

  // Ensure user can only cancel their own jobs
  if (job.userId !== userId) {
    return createErrorResponse('Unauthorized access to job', 403);
  }

  // Can only cancel jobs that are not complete
  if (job.stage === 'complete' || job.stage === 'error') {
    return createErrorResponse('Cannot cancel completed job', 400);
  }

  // Update job status to cancelled
  updateJobProgress(jobId, 'error', 0, 'Job cancelled by user', undefined, 'Job cancelled by user');

  return createSuccessResponse({
    message: 'Job cancelled successfully'
  });
}

// Temporarily disabled exports to avoid build issues
// export const GET = compose(
//   withErrorHandling,
//   withAuth
// )(handleGetProgress);

// export const DELETE = compose(
//   withErrorHandling,
//   withAuth
// )(handleCancelJob);

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Progress tracking not yet implemented' },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Job cancellation not yet implemented' },
    { status: 501 }
  );
}

