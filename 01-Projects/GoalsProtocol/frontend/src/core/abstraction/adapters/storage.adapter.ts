/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - STORAGE ADAPTER
 * ═══════════════════════════════════════════════════════════════
 */

import type { StoragePort } from '../ports/storage.port.ts';

export class LocalStorageAdapter implements StoragePort {
  private prefix: string;

  constructor(prefix: string = 'goals_protocol_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(this.getKey(key), JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    return keys;
  }
}

export class MemoryStorageAdapter implements StoragePort {
  private store = new Map<string, unknown>();

  async getItem<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return value !== undefined ? (value as T) : null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}
