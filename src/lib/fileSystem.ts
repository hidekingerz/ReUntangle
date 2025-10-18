import type { FileInfo } from '@/types';

/**
 * Supported React file extensions
 */
const REACT_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];

/**
 * Directories to skip during scanning
 */
const SKIP_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  'out',
  '.cache',
];

/**
 * Check if the browser supports File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Open a directory picker and return the selected directory handle
 */
export async function selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const directoryHandle = await window.showDirectoryPicker({
      mode: 'read',
    });
    return directoryHandle;
  } catch (error) {
    // User cancelled the picker
    if ((error as Error).name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if a directory should be skipped
 */
function shouldSkipDirectory(name: string): boolean {
  return SKIP_DIRECTORIES.includes(name) || name.startsWith('.');
}

/**
 * Check if a file is a React component file
 */
function isReactFile(name: string): boolean {
  return REACT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * Recursively scan a directory and collect React files
 */
export async function scanDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  basePath: string = ''
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];

  try {
    for await (const entry of directoryHandle.values()) {
      const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        // Skip certain directories
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }

        // Recursively scan subdirectories
        const subFiles = await scanDirectory(
          entry as FileSystemDirectoryHandle,
          currentPath
        );
        files.push(...subFiles);
      } else if (entry.kind === 'file') {
        // Only process React files
        if (isReactFile(entry.name)) {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const content = await file.text();

          const extension = entry.name.substring(entry.name.lastIndexOf('.'));

          files.push({
            path: currentPath,
            name: entry.name,
            extension,
            content,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory: ${basePath}`, error);
    throw error;
  }

  return files;
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(0, lastDot) : filename;
}
