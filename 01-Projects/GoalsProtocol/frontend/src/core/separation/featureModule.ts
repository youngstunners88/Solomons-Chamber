/**
 * ═══════════════════════════════════════════════════════════════
 * SEPARATION OF CONCERNS - FEATURE MODULE SYSTEM
 * ═══════════════════════════════════════════════════════════════
 * 
 * Organizes code by feature rather than by technical layer,
 * while preserving Clean Architecture boundaries within each feature.
 */

import type { Effect } from '../effects/types.ts';
import type { RouteDefinition } from '../routing/types.ts';
import type { Slice } from '../state/types.ts';

export interface FeatureModuleConfig {
  readonly name: string;
  readonly routes?: ReadonlyArray<RouteDefinition>;
  readonly slices?: ReadonlyArray<Slice<unknown, string, Record<string, unknown>>>;
  readonly effects?: ReadonlyArray<Effect<unknown, unknown>>;
  readonly initialize?: () => void | Promise<void>;
  readonly dispose?: () => void | Promise<void>;
}

export interface FeatureModule extends FeatureModuleConfig {
  readonly isInitialized: boolean;
  readonly initialize: () => Promise<void>;
  readonly dispose: () => Promise<void>;
}

class FeatureRegistryImpl {
  private modules = new Map<string, FeatureModule>();

  register(config: FeatureModuleConfig): FeatureModule {
    let initialized = false;

    const module: FeatureModule = {
      ...config,
      get isInitialized() {
        return initialized;
      },
      initialize: async () => {
        if (initialized) return;
        if (config.initialize) {
          await config.initialize();
        }
        initialized = true;
      },
      dispose: async () => {
        if (!initialized) return;
        if (config.dispose) {
          await config.dispose();
        }
        initialized = false;
      },
    };

    this.modules.set(config.name, module);
    return module;
  }

  get(name: string): FeatureModule | undefined {
    return this.modules.get(name);
  }

  getAll(): ReadonlyArray<FeatureModule> {
    return Array.from(this.modules.values());
  }

  async initializeAll(): Promise<void> {
    for (const module of this.modules.values()) {
      await module.initialize();
    }
  }

  async disposeAll(): Promise<void> {
    for (const module of this.modules.values()) {
      await module.dispose();
    }
  }

  unregister(name: string): boolean {
    const module = this.modules.get(name);
    if (module) {
      module.dispose().catch(console.error);
      return this.modules.delete(name);
    }
    return false;
  }
}

export const featureRegistry = new FeatureRegistryImpl();

export const defineFeature = (config: FeatureModuleConfig): FeatureModule => {
  return featureRegistry.register(config);
};
