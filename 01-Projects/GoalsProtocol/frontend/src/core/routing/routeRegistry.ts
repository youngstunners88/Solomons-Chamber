/**
 * ═══════════════════════════════════════════════════════════════
 * ROUTING SYSTEM - REGISTRY
 * ═══════════════════════════════════════════════════════════════
 */

import type { RouteDefinition } from './types.ts';

export interface RouteModule {
  readonly name: string;
  readonly prefix: string;
  readonly routes: ReadonlyArray<RouteDefinition>;
  readonly layout?: React.ComponentType<{ children: React.ReactNode }>;
}

class RouteRegistryImpl {
  private modules = new Map<string, RouteModule>();
  private flatRoutes: RouteDefinition[] = [];

  registerModule(module: RouteModule): void {
    // Prefix all routes in the module
    const prefixedRoutes = module.routes.map((route) => ({
      ...route,
      path: `${module.prefix}${route.path}`,
      layout: route.layout ?? module.layout,
    }));

    this.modules.set(module.name, module);
    this.rebuildFlatRoutes();
  }

  unregisterModule(name: string): boolean {
    const removed = this.modules.delete(name);
    if (removed) {
      this.rebuildFlatRoutes();
    }
    return removed;
  }

  private rebuildFlatRoutes(): void {
    this.flatRoutes = [];
    for (const module of this.modules.values()) {
      for (const route of module.routes) {
        this.flatRoutes.push({
          ...route,
          path: `${module.prefix}${route.path}`,
          layout: route.layout ?? module.layout,
        });
      }
    }
  }

  getAllRoutes(): ReadonlyArray<RouteDefinition> {
    return this.flatRoutes;
  }

  getModule(name: string): RouteModule | undefined {
    return this.modules.get(name);
  }

  getModules(): ReadonlyArray<RouteModule> {
    return Array.from(this.modules.values());
  }

  findRouteByName(name: string): RouteDefinition | undefined {
    return this.flatRoutes.find((r) => r.name === name);
  }
}

export const routeRegistry = new RouteRegistryImpl();
