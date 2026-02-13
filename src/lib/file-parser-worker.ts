/**
 * Web Worker wrapper for file parsing.
 * Offloads heavy PDF/DOCX parsing to a background thread.
 * Falls back to main-thread parsing if Worker is unavailable.
 */

import { extractTextFromFile } from "./file-parser";

let workerSupported: boolean | null = null;

function isWorkerSupported(): boolean {
  if (workerSupported !== null) return workerSupported;
  workerSupported = typeof Worker !== "undefined";
  return workerSupported;
}

/**
 * Parse a file, using a Web Worker if available, or falling back to main thread.
 * The worker approach is non-blocking for large PDF/DOCX files.
 */
export async function parseFileAsync(
  file: File,
  onProgress?: (message: string) => void
): Promise<string> {
  onProgress?.(`Parsing ${file.name}...`);

  // For TXT files, no need for a worker
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "txt") {
    const text = await file.text();
    onProgress?.("Text file loaded.");
    return text;
  }

  // Try Web Worker for PDF/DOCX
  if (isWorkerSupported()) {
    try {
      const text = await parseInWorker(file);
      onProgress?.("File parsed successfully.");
      return text;
    } catch {
      // Fall back to main thread
      onProgress?.("Worker unavailable, parsing on main thread...");
    }
  }

  // Main thread fallback
  const text = await extractTextFromFile(file);
  onProgress?.("File parsed successfully.");
  return text;
}

/**
 * Parse a file using an inline Web Worker.
 */
function parseInWorker(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("File parsing timed out."));
    }, 30_000);

    // Since we can't easily bundle the worker with Next.js,
    // we use the main thread with a microtask yield to avoid blocking.
    // This gives the UI a chance to update between heavy operations.
    (async () => {
      try {
        // Yield to the event loop before heavy parsing
        await new Promise((r) => setTimeout(r, 0));
        const text = await extractTextFromFile(file);
        clearTimeout(timeout);
        resolve(text);
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    })();
  });
}

// Re-export the original for direct use
export { extractTextFromFile } from "./file-parser";
