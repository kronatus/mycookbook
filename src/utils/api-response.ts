import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    data,
    ...(message && { message })
  };

  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any
): NextResponse {
  const response: ApiResponse = {
    error,
    ...(details && { details })
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): NextResponse {
  const response: PaginatedResponse<T[]> = {
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    },
    ...(message && { message })
  };

  return NextResponse.json(response);
}

/**
 * Handle service response and convert to API response
 */
export function handleServiceResponse<T>(
  result: { success: true; data?: T } | { success: false; error: { type: string; message: string; details?: any } },
  successStatus: number = 200
): NextResponse {
  if (result.success) {
    return createSuccessResponse(result.data, undefined, successStatus);
  }

  const { error } = result;
  let status: number;

  switch (error.type) {
    case 'validation':
      status = 400;
      break;
    case 'not_found':
      status = 404;
      break;
    case 'unauthorized':
      status = 403;
      break;
    case 'database':
      status = 500;
      break;
    default:
      status = 500;
  }

  return createErrorResponse(error.message, status, error.details);
}