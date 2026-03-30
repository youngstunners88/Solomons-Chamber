/**
 * ═══════════════════════════════════════════════════════════════
 * SEPARATION OF CONCERNS - PUBLIC API
 * ═══════════════════════════════════════════════════════════════
 */

export {
  layerGuard,
  LayerViolationError,
  type ArchitectureLayer,
} from './layerGuard.ts';
export {
  featureRegistry,
  defineFeature,
  type FeatureModule,
  type FeatureModuleConfig,
} from './featureModule.ts';
export {
  boundaryEnforcer,
  type BoundaryRule,
  type BoundaryConfig,
} from './boundary.ts';
