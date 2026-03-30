/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - STORAGE PORT
 * ═══════════════════════════════════════════════════════════════
 */

export interface StoragePort {
  readonly getItem: <T>(key: string) => Promise<T | null>;
  readonly setItem: <T>(key: string, value: T) => Promise<void>;
  readonly removeItem: (key: string) => Promise<void>;
  readonly clear: () => Promise<void>;
  readonly keys: () => Promise<string[]>;
}
