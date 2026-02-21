/**
 * In-memory TTL cache for analysis results.
 * Keyed by hash of (resumeText + jobDescriptionText) to avoid redundant computation.
 */

import { createHash } from "crypto";

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ENTRIES = 100;
const CLEANUP_INTERVAL = 60_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  size: number;
}

class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private lastCleanup = Date.now();
  private ttlMs: number;
  private maxEntries: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS, maxEntries: number = MAX_ENTRIES) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  get(key: string): T | undefined {
    this.cleanup();
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.cleanup();

    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
      size: JSON.stringify(value).length,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < CLEANUP_INTERVAL) return;
    this.lastCleanup = now;

    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// ── Singleton caches ──

/** Cache for free analysis results (keyed by input hash) */
export const analysisCache = new TTLCache<unknown>(10 * 60 * 1000, 50);

/** Cache for Pro generation results (keyed by input hash) */
export const proCache = new TTLCache<unknown>(15 * 60 * 1000, 20);

/** Cache for Quick Scan results (keyed by resume hash) */
export const quickScanCache = new TTLCache<unknown>(10 * 60 * 1000, 50);

/**
 * Generate a collision-resistant cache key from input strings using SHA-256.
 */
export function hashInputs(...inputs: string[]): string {
  return createHash("sha256").update(inputs.join("|")).digest("hex");
}
