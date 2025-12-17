import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseOptimizer } from '../../../../src/db/optimization';
import { getCacheService } from '../../../../src/services/cache-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    const optimizer = getDatabaseOptimizer();
    const cacheService = getCacheService();

    switch (action) {
      case 'overview':
        const [
          dbInfo,
          tableStats,
          indexCheck,
          cacheHealth
        ] = await Promise.all([
          optimizer.getDatabaseInfo(),
          optimizer.getTableStats(),
          optimizer.checkPerformanceIndexes(),
          cacheService.isHealthy()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            database: dbInfo,
            tables: tableStats,
            indexes: indexCheck,
            cache: {
              healthy: cacheHealth,
              type: 'Redis'
            },
            timestamp: new Date().toISOString()
          }
        });

      case 'queries':
        const [queryStats, slowQueries] = await Promise.all([
          optimizer.getQueryPerformanceStats(),
          optimizer.getSlowQueries()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            performance: queryStats,
            slow: slowQueries,
            timestamp: new Date().toISOString()
          }
        });

      case 'indexes':
        const [indexUsage, unusedIndexes] = await Promise.all([
          optimizer.getIndexUsageStats(),
          optimizer.getUnusedIndexes()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            usage: indexUsage,
            unused: unusedIndexes,
            timestamp: new Date().toISOString()
          }
        });

      case 'analyze':
        const analyzed = await optimizer.analyzeTables();
        
        return NextResponse.json({
          success: analyzed,
          message: analyzed ? 'Tables analyzed successfully' : 'Failed to analyze tables',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const optimizer = getDatabaseOptimizer();

    switch (action) {
      case 'analyze':
        const analyzed = await optimizer.analyzeTables();
        return NextResponse.json({
          success: analyzed,
          message: analyzed ? 'Tables analyzed successfully' : 'Failed to analyze tables'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Performance API POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}