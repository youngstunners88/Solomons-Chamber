/**
 * ═══════════════════════════════════════════════════════════════
 * ROUTING SYSTEM - TYPES
 * ═══════════════════════════════════════════════════════════════
 */

export type RouteParams = Record<string, string>;
export type RouteQuery = Record<string, string | string[]>;

export interface RouteLocation {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly params: RouteParams;
  readonly query: RouteQuery;
  readonly state: unknown;
}

export type RouteGuardResult =
  | { type: 'allow' }
  | { type: 'deny'; reason: string; redirectTo?: string }
  | { type: 'redirect'; to: string };

export type RouteGuard = (
  location: RouteLocation,
  route: RouteDefinition
) => RouteGuardResult | Promise<RouteGuardResult>;

export type LazyRouteComponent = () => Promise<{ default: React.ComponentType }>;

export interface RouteDefinition {
  readonly path: string;
  readonly name?: string;
  readonly component?: React.ComponentType | LazyRouteComponent;
  readonly exact?: boolean;
  readonly guards?: ReadonlyArray<RouteGuard>;
  readonly meta?: Record<string, unknown>;
  readonly children?: ReadonlyArray<RouteDefinition>;
  readonly redirect?: string;
  readonly layout?: React.ComponentType<{ children: React.ReactNode }>;
  readonly fallback?: React.ComponentType;
}

export interface NavigationOptions {
  readonly replace?: boolean;
  readonly state?: unknown;
}

export type RouterListener = (location: RouteLocation) => void;

export interface Router {
  readonly location: RouteLocation;
  readonly navigate: (to: string, options?: NavigationOptions) => void;
  readonly goBack: () => void;
  readonly goForward: () => void;
  readonly subscribe: (listener: RouterListener) => () => void;
  readonly match: (path: string) => RouteDefinition | null;
}
