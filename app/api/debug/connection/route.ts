import { NextRequest, NextResponse } from 'next/server';
import { checkConnection } from '../../../../src/db/connection';

export async function GET(request: NextRequest) {
  try {
    const connectionResult = await checkConnection();
    
    return NextResponse.json({
      ...connectionResult,
      environment: process.env.NODE_ENV,
      databaseUrls: {
        production: process.env.NEON_DATABASE_URL ? 'Set' : 'Not set',
        development: process.env.NEON_DEV_DATABASE_URL ? 'Set' : 'Not set'
      },
      activeUrl: process.env.NODE_ENV === 'production' 
        ? process.env.NEON_DATABASE_URL 
        : (process.env.NEON_DEV_DATABASE_URL || process.env.NEON_DATABASE_URL)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}