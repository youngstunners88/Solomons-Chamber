/**
 * ═══════════════════════════════════════════════════════════════
 * ROUTING SYSTEM - PUBLIC API
 * ═══════════════════════════════════════════════════════════════
 */

export * from './types.ts';
export { createRouter, getRouter } from './router.ts';
export { routeRegistry } from './routeRegistry.ts';
export {
  allow,
  deny,
  redirect,
  composeGuards,
  createAuthGuard,
  createRoleGuard,
  createWalletGuard,
} from './routeGuards.ts';
export { lazyLoader, lazy } from './lazyLoader.ts';
