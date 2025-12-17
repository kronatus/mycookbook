'use client';

import { useState } from 'react';

interface ExportOptions {
  format: 'json' | 'pdf';
  includePersonalNotes: boolean;
  includeMetadata: boolean;
}

interface ImportOptions {
  skipDuplicates: boolean;
}

export default function DataExport({ userId }: { userId: string }) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includePersonalNotes: true,
    includeMetadata: true
  });

  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        userId,
        format: exportOptions.format,
        includePersonalNotes: exportOptions.includePersonalNotes.toString(),
        includeMetadata: exportOptions.includeMetadata.toString()
      });

      const response = await fetch(`/api/export?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'recipes-export.json';

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Recipes exported successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Export failed' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackup = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({ userId });
      const response = await fetch(`/api/export/backup?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Backup failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'cookbook-backup.json';

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Backup created successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Backup failed' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import' });
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const fileContent = await importFile.text();
      
      const response = await fetch(`/api/import?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonData: fileContent,
          options: importOptions
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      let successMessage = `Import completed! ${result.importedCount} recipes imported`;
      if (result.skippedCount > 0) {
        successMessage += `, ${result.skippedCount} skipped`;
      }
      if (result.errors && result.errors.length > 0) {
        successMessage += `. Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`;
      }

      setMessage({ type: 'success', text: successMessage });
      setImportFile(null);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Import failed' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRestore = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a backup file to restore' });
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const fileContent = await importFile.text();
      
      const response = await fetch(`/api/export/backup?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backupData: fileContent,
          options: { skipDuplicates: importOptions.skipDuplicates }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Restore failed');
      }

      let successMessage = `Restore completed! ${result.importedCount} recipes restored`;
      if (result.skippedCount > 0) {
        successMessage += `, ${result.skippedCount} skipped`;
      }
      if (result.errors && result.errors.length > 0) {
        successMessage += `. Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`;
      }

      setMessage({ type: 'success', text: successMessage });
      setImportFile(null);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Restore failed' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Recipes</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={exportOptions.format}
              onChange={(e) => setExportOptions(prev => ({ 
                ...prev, 
                format: e.target.value as 'json' | 'pdf' 
              }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includePersonalNotes}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  includePersonalNotes: e.target.checked 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include personal notes</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  includeMetadata: e.target.checked 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include metadata (dates, etc.)</span>
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export Recipes'}
            </button>

            <button
              onClick={handleBackup}
              disabled={isExporting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Creating Backup...' : 'Create Full Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Recipes</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={importOptions.skipDuplicates}
                onChange={(e) => setImportOptions(prev => ({ 
                  ...prev, 
                  skipDuplicates: e.target.checked 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Skip duplicate recipes (by title)</span>
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleImport}
              disabled={isImporting || !importFile}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Import Recipes'}
            </button>

            <button
              onClick={handleRestore}
              disabled={isImporting || !importFile}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Restoring...' : 'Restore from Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Information</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Export:</strong> Download your recipes in JSON or PDF format. JSON files can be imported back later.</p>
          <p><strong>Backup:</strong> Create a complete backup of all your recipes with metadata for full restoration.</p>
          <p><strong>Import:</strong> Import recipes from JSON files exported from this or other recipe applications.</p>
          <p><strong>Restore:</strong> Restore recipes from a backup file created by this application.</p>
        </div>
      </div>
    </div>
  );
}