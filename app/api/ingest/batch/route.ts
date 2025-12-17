import { NextRequest, NextResponse } from 'next/server';
import { UrlIngestionService } from '../../../../src/services/url-ingestion-service';
import { createSuccessResponse, createErrorResponse } from '../../../../src/utils/api-response';
import { withAuth, withJsonValidation, withErrorHandling, compose } from '../../../../src/middleware/api-middleware';
import { createJob, updateJobProgress } from '../../../../src/services/job-progress-service';

interface BatchIngestionRequest {
  urls: string[];
  options?: {
    timeout?: number;
    maxRetries?: number;
    skipValidation?: boolean;
    maxConcurrent?: number;
  };
}

/**
 * POST /api/ingest/batch - Ingest multiple recipes from URLs
 * Temporarily disabled - will be implemented in batch ingestion task
 */
async function handleBatchIngestion(request: any, body: BatchIngestionRequest) {
  return NextResponse.json(
    { error: 'Batch ingestion not yet implemented' },
    { status: 501 }
  );
  /*
  const { urls, options } = body;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return createErrorResponse('URLs array is required and must not be empty', 400);
  }

  if (urls.length > 50) {
    return createErrorResponse('Maximum 50 URLs allowed per batch', 400);
  }

  // Validate all URLs
  const invalidUrls = [];
  for (const url of urls) {
    try {
      new URL(url);
    } catch {
      invalidUrls.push(url);
    }
  }

  if (invalidUrls.length > 0) {
    return createErrorResponse('Invalid URL format detected', 400, { invalidUrls });
  }

  const urlIngestionService = new UrlIngestionService();

  // Check supported URLs
  const unsupportedUrls = urls.filter(url => !urlIngestionService.canHandleUrl(url));
  if (unsupportedUrls.length > 0) {
    return createErrorResponse(
      'Some URLs are not supported by available adapters',
      400,
      { 
        unsupportedUrls,
        supportedDomains: urlIngestionService.getSupportedDomains()
      }
    );
  }

  // Create job for progress tracking
  const jobId = createJob(request.userId, 'url');

  // Start async batch processing
  processBatchAsync(jobId, urls, request.userId, options || {});

  return createSuccessResponse({
    jobId,
    totalUrls: urls.length,
    message: 'Batch ingestion started. Use the job ID to track progress.'
  }, 'Batch processing started', 202);
}

async function processBatchAsync(
  jobId: string,
  urls: string[],
  userId: string,
  options: BatchIngestionRequest['options']
) {
  const urlIngestionService = new UrlIngestionService();
  const results: Array<{
    url: string;
    recipe: any;
    extractedData: any;
  }> = [];
  const errors: Array<{
    url: string;
    error: string;
    type: string;
  }> = [];
  const maxConcurrent = options?.maxConcurrent || 3;

  try {
    updateJobProgress(jobId, 'extracting', 0, `Starting batch processing of ${urls.length} URLs...`);

    // Process URLs in batches to avoid overwhelming servers
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (url, batchIndex) => {
        const overallIndex = i + batchIndex;
        const progress = Math.round((overallIndex / urls.length) * 90); // Reserve 10% for completion
        
        updateJobProgress(
          jobId,
          'extracting',
          progress,
          `Processing URL ${overallIndex + 1} of ${urls.length}: ${url}`
        );

        try {
          const result = await urlIngestionService.ingestFromUrl({
            url,
            userId,
            options: {
              timeout: options?.timeout,
              maxRetries: options?.maxRetries,
              skipValidation: options?.skipValidation
            }
          });

          if (result.success) {
            results.push({
              url,
              recipe: result.recipe,
              extractedData: result.extractedData
            });
          } else {
            errors.push({
              url,
              error: result.error!.message,
              type: result.error!.type
            });
          }
        } catch (error) {
          errors.push({
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
            type: 'processing'
          });
        }
      });

      await Promise.all(batchPromises);
    }

    // Complete processing
    const finalResult = {
      successful: results,
      failed: errors,
      summary: {
        totalUrls: urls.length,
        successful: results.length,
        failed: errors.length,
        successRate: Math.round((results.length / urls.length) * 100)
      }
    };

    updateJobProgress(
      jobId,
      'complete',
      100,
      `Batch processing complete. Successfully processed ${results.length} of ${urls.length} URLs.`,
      finalResult
    );

  } catch (error) {
    console.error('Batch processing error:', error);
    updateJobProgress(
      jobId,
      'error',
      0,
      'An unexpected error occurred during batch processing',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
  */
}

// Temporarily disabled export to avoid build issues
// export const POST = compose(
//   withErrorHandling,
//   withAuth,
//   withJsonValidation
// )(handleBatchIngestion);

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Batch ingestion not yet implemented' },
    { status: 501 }
  );
}