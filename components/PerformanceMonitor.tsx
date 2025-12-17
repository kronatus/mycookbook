'use client';

import { useState, useEffect } from 'react';

interface PerformanceData {
  database: {
    connection: {
      database_name: string;
      current_user: string;
      version: string;
      database_size: string;
    };
    performance: {
      max_connections: string;
      active_connections: string;
      active_queries: string;
    };
  };
  tables: Array<{
    tablename: string;
    total_size: string;
    table_size: string;
    live_tuples: number;
    dead_tuples: number;
    last_analyze: string;
  }>;
  indexes: {
    exists: boolean;
    missing: string[];
  };
  cache: {
    healthy: boolean;
    type: string;
  };
}

interface QueryStats {
  performance: Array<{
    query: string;
    calls: number;
    total_time: number;
    mean_time: number;
    rows: number;
  }>;
  slow: Array<{
    query: string;
    mean_time: number;
    calls: number;
  }>;
}

export function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'indexes'>('overview');

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/performance?action=overview');
      const result = await response.json();
      
      if (result.success) {
        setPerformanceData(result.data);
      } else {
        setError(result.error || 'Failed to fetch performance data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueryStats = async () => {
    try {
      const response = await fetch('/api/admin/performance?action=queries');
      const result = await response.json();
      
      if (result.success) {
        setQueryStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch query stats:', err);
    }
  };

  const runAnalyze = async () => {
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Tables analyzed successfully!');
        fetchPerformanceData();
      } else {
        alert('Failed to analyze tables: ' + result.error);
      }
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    if (activeTab === 'queries') {
      fetchQueryStats();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchPerformanceData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
        <button
          onClick={runAnalyze}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Analyze Tables
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'queries', label: 'Query Performance' },
            { id: 'indexes', label: 'Index Usage' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Database Info</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Database</dt>
                <dd className="text-sm text-gray-900">{performanceData.database.connection.database_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Size</dt>
                <dd className="text-sm text-gray-900">{performanceData.database.connection.database_size}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Connections</dt>
                <dd className="text-sm text-gray-900">
                  {performanceData.database.performance.active_connections} / {performanceData.database.performance.max_connections}
                </dd>
              </div>
            </dl>
          </div>

          {/* Cache Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Status</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                performanceData.cache.healthy ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-900">
                {performanceData.cache.type} - {performanceData.cache.healthy ? 'Healthy' : 'Unhealthy'}
              </span>
            </div>
          </div>

          {/* Index Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Indexes</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                performanceData.indexes.exists ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-900">
                {performanceData.indexes.exists ? 'All indexes present' : `${performanceData.indexes.missing.length} missing`}
              </span>
            </div>
            {!performanceData.indexes.exists && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Missing indexes:</p>
                <ul className="text-xs text-gray-500 mt-1">
                  {performanceData.indexes.missing.map((index) => (
                    <li key={index}>• {index}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Table Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Table Statistics</h3>
            <div className="space-y-2">
              {performanceData.tables.map((table) => (
                <div key={table.tablename} className="flex justify-between text-sm">
                  <span className="text-gray-600">{table.tablename}</span>
                  <span className="text-gray-900">{table.total_size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Query Performance Tab */}
      {activeTab === 'queries' && queryStats && (
        <div className="space-y-6">
          {queryStats.performance.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Queries by Total Time</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Query
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Calls
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Time (ms)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Time (ms)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queryStats.performance.slice(0, 10).map((query, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {query.query.substring(0, 100)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{query.calls}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{query.mean_time.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{query.total_time.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {queryStats.slow.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Slow Queries</h3>
              <div className="space-y-3">
                {queryStats.slow.map((query, index) => (
                  <div key={index} className="border-l-4 border-red-400 pl-4">
                    <p className="text-sm text-gray-900 font-mono">{query.query.substring(0, 200)}...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Avg: {query.mean_time.toFixed(2)}ms | Calls: {query.calls}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queryStats.performance.length === 0 && queryStats.slow.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Query statistics not available. Enable pg_stat_statements extension for detailed query performance data.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}