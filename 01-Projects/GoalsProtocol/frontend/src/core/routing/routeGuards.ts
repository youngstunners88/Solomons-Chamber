/**
 * ═══════════════════════════════════════════════════════════════
 * ROUTING SYSTEM - GUARDS
 * ═══════════════════════════════════════════════════════════════
 */

import type { RouteGuard, RouteGuardResult, RouteLocation, RouteDefinition } from './types.ts';

export const allow = (): RouteGuardResult => ({ type: 'allow' });

export const deny = (reason: string, redirectTo?: string): RouteGuardResult => ({
  type: 'deny',
  reason,
  redirectTo,
});

export const redirect = (to: string): RouteGuardResult => ({
  type: 'redirect',
  to,
});

export const composeGuards = (
  ...guards: RouteGuard[]
): RouteGuard => {
  return async (location: RouteLocation, route: RouteDefinition) => {
    for (const guard of guards) {
      const result = await guard(location, route);
      if (result.type !== 'allow') {
        return result;
      }
    }
    return allow();
  };
};

export const createAuthGuard = (
  isAuthenticated: () => boolean | Promise<boolean>,
  loginRoute: string = '/login'
): RouteGuard => {
  return async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return redirect(loginRoute);
    }
    return allow();
  };
};

export const createRoleGuard = (
  getRoles: () => string[] | Promise<string[]>,
  allowedRoles: string[],
  fallbackRoute: string = '/unauthorized'
): RouteGuard => {
  return async () => {
    const roles = await getRoles();
    const hasRole = roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return deny('Insufficient permissions', fallbackRoute);
    }
    return allow();
  };
};

export const createWalletGuard = (
  isConnected: () => boolean | Promise<boolean>,
  connectRoute: string = '/connect'
): RouteGuard => {
  return async () => {
    const connected = await isConnected();
    if (!connected) {
      return redirect(connectRoute);
    }
    return allow();
  };
};
