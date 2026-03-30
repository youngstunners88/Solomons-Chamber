/**
 * ═══════════════════════════════════════════════════════════════
 * ROUTING SYSTEM - LAZY LOADER
 * ═══════════════════════════════════════════════════════════════
 */

import type { LazyRouteComponent } from './types.ts';

interface LoadableState<T> {
  readonly loading: boolean;
  readonly error: Error | null;
  readonly data: T | null;
}

class LazyLoaderImpl {
  private cache = new Map<string, React.ComponentType>();

  async load(component: LazyRouteComponent): Promise<React.ComponentType> {
    const cacheKey = component.toString();

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const module = await component();
    const Component = module.default;
    this.cache.set(cacheKey, Component);
    return Component;
  }

  preload(component: LazyRouteComponent): void {
    this.load(component).catch((err) => {
      console.error('Failed to preload component:', err);
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const lazyLoader = new LazyLoaderImpl();

export const lazy = (
  importer: () => Promise<{ default: React.ComponentType }>
): LazyRouteComponent => {
  return importer;
};
