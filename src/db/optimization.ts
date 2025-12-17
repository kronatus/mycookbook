import { sql } from './connection';

export interface QueryPerformanceStats {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  rows: number;
}

export interface IndexUsageStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexSize: string;
  indexScans: number;
  tupleReads: number;
  tuplesFetched: number;
}

export class DatabaseOptimizer {
  /**
   * Get query performance statistics from pg_stat_statements
   * Note: Requires pg_stat_statements extension to be enabled
   */
  async getQueryPerformanceStats(): Promise<QueryPerformanceStats[]> {
    try {
      const result = await sql`
        SELECT 
          query,
          calls,
          total_exec_time as total_time,
          mean_exec_time as mean_time,
          rows
        FROM pg_stat_statements 
        WHERE query LIKE '%recipes%' OR query LIKE '%wishlist%'
        ORDER BY total_exec_time DESC 
        LIMIT 20
      `;
      return result as QueryPerformanceStats[];
    } catch (error) {
      console.warn('pg_stat_statements not available:', error);
      return [];
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats(): Promise<IndexUsageStats[]> {
    try {
      const result = await sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          idx_scan as index_scans,
          idx_tup_read as tuple_reads,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
      `;
      return result as IndexUsageStats[];
    } catch (error) {
      console.error('Error getting index usage stats:', error);
      return [];
    }
  }

  /**
   * Get unused indexes that might be candidates for removal
   */
  async getUnusedIndexes(): Promise<string[]> {
    try {
      const result = await sql`
        SELECT 
          schemaname || '.' || tablename || '.' || indexname as full_index_name
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
          AND idx_scan = 0
          AND indexname NOT LIKE '%_pkey'
        ORDER BY pg_relation_size(indexrelid) DESC
      `;
      return result.map((row: any) => row.full_index_name);
    } catch (error) {
      console.error('Error getting unused indexes:', error);
      return [];
    }
  }

  /**
   * Get table sizes and statistics
   */
  async getTableStats() {
    try {
      const result = await sql`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;
      return result;
    } catch (error) {
      console.error('Error getting table stats:', error);
      return [];
    }
  }

  /**
   * Analyze tables to update statistics for better query planning
   */
  async analyzeTables(): Promise<boolean> {
    try {
      await sql`ANALYZE recipes`;
      await sql`ANALYZE wishlist_items`;
      await sql`ANALYZE search_history`;
      await sql`ANALYZE users`;
      return true;
    } catch (error) {
      console.error('Error analyzing tables:', error);
      return false;
    }
  }

  /**
   * Get slow queries (requires log_min_duration_statement to be set)
   */
  async getSlowQueries(): Promise<any[]> {
    try {
      // This would typically come from log analysis
      // For now, we'll return queries that take longer than average
      const result = await sql`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          stddev_exec_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_exec_time > (
          SELECT AVG(mean_exec_time) * 2 
          FROM pg_stat_statements
        )
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `;
      return result;
    } catch (error) {
      console.warn('pg_stat_statements not available for slow query analysis:', error);
      return [];
    }
  }

  /**
   * Check if performance indexes exist
   */
  async checkPerformanceIndexes(): Promise<{ exists: boolean; missing: string[] }> {
    try {
      const expectedIndexes = [
        'recipes_user_updated_idx',
        'recipes_categories_gin_idx',
        'recipes_tags_gin_idx',
        'recipes_search_vector_idx',
        'wishlist_user_category_idx',
        'search_history_user_term_count_idx'
      ];

      const existingIndexes = await sql`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND indexname = ANY(${expectedIndexes})
      `;

      const existing = existingIndexes.map((row: any) => row.indexname);
      const missing = expectedIndexes.filter(index => !existing.includes(index));

      return {
        exists: missing.length === 0,
        missing
      };
    } catch (error) {
      console.error('Error checking performance indexes:', error);
      return { exists: false, missing: [] };
    }
  }

  /**
   * Get database connection and performance info
   */
  async getDatabaseInfo() {
    try {
      const [connectionInfo, performanceInfo] = await Promise.all([
        sql`
          SELECT 
            current_database() as database_name,
            current_user as current_user,
            version() as version,
            pg_size_pretty(pg_database_size(current_database())) as database_size
        `,
        sql`
          SELECT 
            setting as max_connections,
            (SELECT count(*) FROM pg_stat_activity) as active_connections,
            (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries
          FROM pg_settings 
          WHERE name = 'max_connections'
        `
      ]);

      return {
        connection: connectionInfo[0],
        performance: performanceInfo[0]
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return null;
    }
  }
}

// Singleton instance
let optimizer: DatabaseOptimizer | null = null;

export function getDatabaseOptimizer(): DatabaseOptimizer {
  if (!optimizer) {
    optimizer = new DatabaseOptimizer();
  }
  return optimizer;
}