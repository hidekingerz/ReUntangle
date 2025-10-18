'use client';

import { useState, useEffect } from 'react';

interface FolderSelectorProps {
  onFolderSelected: (directoryHandle: FileSystemDirectoryHandle) => void;
  isLoading?: boolean;
}

export default function FolderSelector({
  onFolderSelected,
  isLoading = false,
}: FolderSelectorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if File System Access API is supported in the browser
    setIsSupported('showDirectoryPicker' in window);
  }, []);

  const handleSelectFolder = async () => {
    setError(null);

    if (!isSupported) {
      setError(
        'File System Access API is not supported in your browser. Please use Chrome, Edge, or another Chromium-based browser.'
      );
      return;
    }

    try {
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read',
      });

      if (directoryHandle) {
        onFolderSelected(directoryHandle);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled, no error needed
        return;
      }
      setError(`Failed to select folder: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Select React Project Folder
        </h2>
        <p className="text-gray-600">
          Choose a folder containing your React project to analyze component
          dependencies
        </p>
      </div>

      <button
        onClick={handleSelectFolder}
        disabled={isLoading || !isSupported}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
                   hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors duration-200"
      >
        {isLoading ? 'Analyzing...' : 'Select Folder'}
      </button>

      {error && (
        <div className="max-w-md p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!isSupported && (
        <div className="max-w-md p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">
            Browser Not Supported
          </p>
          <p className="text-yellow-700 text-sm mt-1">
            Please use a modern Chromium-based browser (Chrome, Edge, Brave, etc.)
            to use this application.
          </p>
        </div>
      )}
    </div>
  );
}
