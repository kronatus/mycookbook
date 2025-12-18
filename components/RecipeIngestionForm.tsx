'use client';

import { useState } from 'react';
import Link from 'next/link';

type IngestionMethod = 'url' | 'document' | 'manual';

interface IngestionResult {
  success: boolean;
  recipe?: any;
  error?: string;
}

export function RecipeIngestionForm() {
  const [method, setMethod] = useState<IngestionMethod>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestionResult | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, recipe: data.data?.recipe });
        setUrl('');
      } else {
        setResult({ success: false, error: data.error || 'Failed to ingest recipe' });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ingest/document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, recipe: data.data?.recipes?.[0] });
        setFile(null);
      } else {
        setResult({ success: false, error: data.error || 'Failed to process document' });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setMethod('url')}
          className={`px-4 py-2 font-medium transition-colors ${
            method === 'url'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          From URL
        </button>
        <button
          onClick={() => setMethod('document')}
          className={`px-4 py-2 font-medium transition-colors ${
            method === 'document'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          From Document
        </button>
        <button
          onClick={() => setMethod('manual')}
          className={`px-4 py-2 font-medium transition-colors ${
            method === 'manual'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {/* URL Ingestion Form */}
      {method === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipe URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              required
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Supports recipe websites, YouTube, TikTok, and Instagram
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !url}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Import Recipe'}
          </button>
        </form>
      )}

      {/* Document Ingestion Form */}
      {method === 'document' && (
        <form onSubmit={handleDocumentSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Document
            </label>
            <input
              type="file"
              id="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
              required
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Supports PDF and Word documents (max 10MB)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Upload & Extract'}
          </button>
        </form>
      )}

      {/* Manual Entry */}
      {method === 'manual' && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manual recipe entry coming soon
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            For now, use URL or document import
          </p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {result.success ? (
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✓ Recipe imported successfully!
              </h3>
              {result.recipe && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  {result.recipe.title}
                </p>
              )}
              <Link
                href="/recipes"
                className="inline-block mt-3 text-sm text-green-700 dark:text-green-300 underline hover:text-green-900 dark:hover:text-green-100"
              >
                View all recipes →
              </Link>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                ✗ Import failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {result.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
