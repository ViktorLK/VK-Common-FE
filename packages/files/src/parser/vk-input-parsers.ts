// [ARCH-03] [CS.01] Input parsers for Directory Drops, webkitdirectory, and Clipboard Pastes
import { VKResult, VKError } from '@vk-blocks/core';
import type { VKParsedFileEntry } from '../types/file.js';

interface WebkitFileSystemEntry {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly name: string;
  readonly fullPath: string;
}

interface WebkitFileSystemFileEntry extends WebkitFileSystemEntry {
  file(successCallback: (file: File) => void, errorCallback?: (error: DOMException) => void): void;
}

interface WebkitFileSystemDirectoryReader {
  readEntries(
    successCallback: (entries: WebkitFileSystemEntry[]) => void,
    errorCallback?: (error: DOMException) => void
  ): void;
}

interface WebkitFileSystemDirectoryEntry extends WebkitFileSystemEntry {
  createReader(): WebkitFileSystemDirectoryReader;
}

/**
 * Recursively scans a WebKit Directory Entry to extract all files with their nested paths.
 */
async function scanDirectoryEntry(
  entry: WebkitFileSystemDirectoryEntry,
  basePath: string
): Promise<VKParsedFileEntry[]> {
  const reader = entry.createReader();
  const results: VKParsedFileEntry[] = [];

  const readBatch = (): Promise<WebkitFileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  };

  while (true) {
    const entries = await readBatch();
    if (entries.length === 0) break;

    for (const child of entries) {
      const childPath = `${basePath}/${child.name}`;
      if (child.isFile) {
        const fileEntry = child as WebkitFileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        const relativePath = childPath.replace(/^\//, '');
        results.push({
          file,
          relativePath,
          pathSegments: relativePath.split('/'),
        });
      } else if (child.isDirectory) {
        const subFiles = await scanDirectoryEntry(child as WebkitFileSystemDirectoryEntry, childPath);
        results.push(...subFiles);
      }
    }
  }

  return results;
}

/**
 * Recursively parses dropped folder items or FileList into a flattened list of VKParsedFileEntry.
 */
export async function parseDirectoryEntries(
  input: DataTransferItemList | FileList | File[]
): Promise<VKResult<VKParsedFileEntry[]>> {
  try {
    const parsed: VKParsedFileEntry[] = [];

    // Case 1: DataTransferItemList with WebKit entries (folder drop)
    if (typeof DataTransferItemList !== 'undefined' && input instanceof DataTransferItemList) {
      for (let i = 0; i < input.length; i++) {
        const item = input[i];
        if (item.kind !== 'file') continue;

        const entry = item.webkitGetAsEntry?.() as WebkitFileSystemEntry | null;
        if (!entry) {
          const file = item.getAsFile();
          if (file) {
            parsed.push({ file, relativePath: file.name, pathSegments: [file.name] });
          }
          continue;
        }

        if (entry.isFile) {
          const file = item.getAsFile();
          if (file) {
            parsed.push({ file, relativePath: file.name, pathSegments: [file.name] });
          }
        } else if (entry.isDirectory) {
          const folderFiles = await scanDirectoryEntry(entry as WebkitFileSystemDirectoryEntry, entry.name);
          parsed.push(...folderFiles);
        }
      }
      return VKResult.success(parsed);
    }

    // Case 2: FileList with webkitRelativePath
    const filesArray = Array.from(input as FileList | File[]);
    for (const file of filesArray) {
      const relativePath = (file as { webkitRelativePath?: string }).webkitRelativePath || file.name;
      parsed.push({
        file,
        relativePath,
        pathSegments: relativePath.split('/'),
      });
    }

    return VKResult.success(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to parse directory entries.';
    return VKResult.failure(VKError.failure('File.ParseError', msg));
  }
}

/**
 * Extracts File objects from a Clipboard DataTransfer instance.
 */
export function parseClipboardFiles(clipboardData: DataTransfer): VKResult<File[]> {
  try {
    if (!clipboardData || !clipboardData.files) {
      return VKResult.success([]);
    }

    const files: File[] = [];
    for (let i = 0; i < clipboardData.files.length; i++) {
      const f = clipboardData.files[i];
      if (f) files.push(f);
    }

    // Also inspect items for images pasted directly
    if (files.length === 0 && clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
    }

    return VKResult.success(files);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to read clipboard files.';
    return VKResult.failure(VKError.failure('File.ClipboardError', msg));
  }
}
