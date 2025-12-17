import { NextRequest, NextResponse } from 'next/server';
import { UrlIngestionService } from '../../../../src/services/url-ingestion-service';
import { createSuccessResponse, createErrorResponse } from '../../../../src/utils/api-response';
import { withAuth, withJsonValidation, withErrorHandling, compose } from '../../../../src/middleware/api-middleware';

interface PreviewRequest {
  url: string;
}

/**
 * POST /api/ingest/preview - Preview recipe extraction from URL without saving
 */
async function handlePreview(request: any, body: PreviewRequest) {
  const { url } = body;

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

  const result = await urlIngestionService.previewFromUrl(url);

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
    extractedData: result.extractedData,
    validationResult: result.validationResult,
    canSave: result.validationResult?.isValid || false
  }, 'Recipe preview generated successfully');
}

// Temporarily disabled export to avoid build issues
// export const POST = compose(
//   withErrorHandling,
//   withAuth,
//   withJsonValidation
// )(handlePreview);

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Preview ingestion not yet implemented' },
    { status: 501 }
  );
}