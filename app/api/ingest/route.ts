import { NextRequest, NextResponse } from 'next/server';
import { UrlIngestionService } from '../../../src/services/url-ingestion-service';
import { createSuccessResponse, createErrorResponse } from '../../../src/utils/api-response';
import { withAuth, withJsonValidation, withErrorHandling, compose } from '../../../src/middleware/api-middleware';

interface UrlIngestionRequest {
  url: string;
  options?: {
    timeout?: number;
    maxRetries?: number;
    skipValidation?: boolean;
  };
}

/**
 * POST /api/ingest - Ingest recipe from URL
 */
async function handleUrlIngestion(request: any, body: UrlIngestionRequest) {
  const { url, options } = body;

  if (!url) {
    return createErrorResponse('URL is required', 400);
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return createErrorResponse('Invalid URL format', 400);
  }

  const urlIngestionService = new UrlIngestionService();

  // Check if URL is supported
  if (!urlIngestionService.canHandleUrl(url)) {
    const supportedDomains = urlIngestionService.getSupportedDomains();
    return createErrorResponse(
      'URL not supported by any available adapter',
      400,
      { supportedDomains }
    );
  }

  const result = await urlIngestionService.ingestFromUrl({
    url,
    userId: 'anonymous', // TODO: Add proper auth
    options
  });

  if (!result.success) {
    let status = 500;
    switch (result.error?.type) {
      case 'network':
        status = 502;
        break;
      case 'parsing':
        status = 422;
        break;
      case 'validation':
        status = 400;
        break;
      case 'unsupported':
        status = 400;
        break;
      case 'not_found':
        status = 404;
        break;
      case 'unauthorized':
        status = 403;
        break;
    }
    return createErrorResponse(result.error!.message, status, result.error!.details);
  }

  return createSuccessResponse({
    recipe: result.recipe,
    extractedData: result.extractedData,
    validationResult: result.validationResult
  }, 'Recipe successfully ingested from URL', 201);
}

/**
 * GET /api/ingest - Get ingestion service information
 */
async function handleGetInfo(request: any) {
  const urlIngestionService = new UrlIngestionService();
  
  return createSuccessResponse({
    supportedDomains: urlIngestionService.getSupportedDomains(),
    adapters: urlIngestionService.getAdapterInfo(),
    capabilities: {
      urlIngestion: true,
      documentIngestion: true,
      videoIngestion: true,
      previewMode: true
    }
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(
    withJsonValidation(handleUrlIngestion)
  )(request);
}

export async function GET(request: NextRequest) {
  return withErrorHandling(handleGetInfo)(request);
}