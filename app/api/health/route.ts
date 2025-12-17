import { NextResponse } from 'next/server';
import { checkConnection } from '@/db/connection';

/**
 * Health check endpoint for deployment verification
 * Returns system status and database connectivity
 */
export async function GET() {
  try {
    // Check database connection
    const dbCheck = await checkConnection();
    
    const health = {
      status: dbCheck.success ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbCheck.success ? 'connected' : 'disconnected',
      message: dbCheck.message,
      version: process.env.npm_package_version || '0.1.0',
    };

    return NextResponse.json(health, {
      status: dbCheck.success ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
