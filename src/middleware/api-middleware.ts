import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
}

/**
 * Middleware to authenticate API requests
 */
export async function withAuth(
  handler: (request: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Add userId to request object
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.userId = session.user.id;

      return await handler(authenticatedRequest, ...args);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to validate JSON request body
 */
export function withJsonValidation(
  handler: (request: NextRequest, body: any, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        const contentType = request.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
          return NextResponse.json(
            { error: 'Content-Type must be application/json' },
            { status: 400 }
          );
        }

        try {
          const body = await request.json();
          return await handler(request, body, ...args);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          );
        }
      }

      return await handler(request, null, ...args);
    } catch (error) {
      console.error('JSON validation middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to handle errors consistently
 */
export function withErrorHandling(
  handler: (...args: any[]) => Promise<NextResponse>
) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API error:', error);
      
      // Handle specific error types
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Combine multiple middleware functions
 */
export function compose(...middlewares: Function[]) {
  return (handler: Function) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}