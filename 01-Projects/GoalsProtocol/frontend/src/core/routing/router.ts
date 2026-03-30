/**
 * ═══════════════════════════════════════════════════════════════
 * ROUTING SYSTEM - CORE ROUTER
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  RouteDefinition,
  RouteLocation,
  Router,
  RouterListener,
  NavigationOptions,
  RouteParams,
  RouteQuery,
} from './types.ts';

const parseQuery = (search: string): RouteQuery => {
  const params = new URLSearchParams(search);
  const query: RouteQuery = {};
  params.forEach((value, key) => {
    const existing = query[key];
    if (existing) {
      query[key] = Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
    } else {
      query[key] = value;
    }
  });
  return query;
};

const matchPath = (
  pattern: string,
  pathname: string
): { matched: boolean; params: RouteParams } => {
  const paramNames: string[] = [];
  const regexPattern = pattern.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });

  const regex = new RegExp(`^${regexPattern}$`);
  const match = pathname.match(regex);

  if (!match) {
    return { matched: false, params: {} };
  }

  const params: RouteParams = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });

  return { matched: true, params };
};

class RouterImpl implements Router {
  private listeners = new Set<RouterListener>();
  private routes: RouteDefinition[] = [];
  private currentLocation: RouteLocation;

  constructor(routes: RouteDefinition[] = []) {
    this.routes = routes;
    this.currentLocation = this.createLocation(window.location);

    window.addEventListener('popstate', () => {
      this.updateLocation(this.createLocation(window.location));
    });
  }

  private createLocation(location: Location): RouteLocation {
    return {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      params: {},
      query: parseQuery(location.search),
      state: (history.state as { __state?: unknown })?.__state ?? null,
    };
  }

  private updateLocation(location: RouteLocation): void {
    // Resolve params for matched route
    const matchedRoute = this.findMatchingRoute(location.pathname);
    const resolvedLocation: RouteLocation = matchedRoute
      ? { ...location, params: matchedRoute.params }
      : location;

    this.currentLocation = resolvedLocation;
    this.listeners.forEach((listener) => listener(resolvedLocation));
  }

  private findMatchingRoute(
    pathname: string
  ): { route: RouteDefinition; params: RouteParams } | null {
    for (const route of this.routes) {
      const { matched, params } = matchPath(route.path, pathname);
      if (matched) {
        return { route, params };
      }
      if (route.children) {
        for (const child of route.children) {
          const childMatch = matchPath(`${route.path}${child.path}`, pathname);
          if (childMatch.matched) {
            return { route: child, params: childMatch.params };
          }
        }
      }
    }
    return null;
  }

  get location(): RouteLocation {
    return this.currentLocation;
  }

  navigate(to: string, options?: NavigationOptions): void {
    if (options?.replace) {
      window.history.replaceState(
        { __state: options.state },
        '',
        to
      );
    } else {
      window.history.pushState(
        { __state: options.state },
        '',
        to
      );
    }
    this.updateLocation(this.createLocation(window.location));
  }

  goBack(): void {
    window.history.back();
  }

  goForward(): void {
    window.history.forward();
  }

  subscribe(listener: RouterListener): () => void {
    this.listeners.add(listener);
    listener(this.currentLocation);
    return () => {
      this.listeners.delete(listener);
    };
  }

  match(path: string): RouteDefinition | null {
    const matched = this.findMatchingRoute(path);
    return matched?.route ?? null;
  }

  setRoutes(routes: RouteDefinition[]): void {
    this.routes = routes;
    this.updateLocation(this.currentLocation);
  }
}

let routerInstance: RouterImpl | null = null;

export const createRouter = (routes: RouteDefinition[]): Router => {
  if (!routerInstance) {
    routerInstance = new RouterImpl(routes);
  } else {
    routerInstance.setRoutes(routes);
  }
  return routerInstance;
};

export const getRouter = (): Router => {
  if (!routerInstance) {
    throw new Error('Router not initialized. Call createRouter first.');
  }
  return routerInstance;
};
