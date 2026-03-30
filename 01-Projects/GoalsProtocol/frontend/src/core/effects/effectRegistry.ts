/**
 * ═══════════════════════════════════════════════════════════════
 * EFFECT SYSTEM - REGISTRY
 * ═══════════════════════════════════════════════════════════════
 * 
 * Discovery and organization of effects by domain/feature.
 */

import type { Effect } from './types.ts';

export interface EffectModule {
  readonly name: string;
  readonly effects: ReadonlyArray<Effect<unknown, unknown>>;
  readonly dependencies?: ReadonlyArray<string>;
}

class EffectRegistryImpl {
  private modules = new Map<string, EffectModule>();
  private allEffects = new Map<string, Effect<unknown, unknown>>();

  registerModule(module: EffectModule): void {
    // Check dependencies
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (!this.modules.has(dep)) {
          throw new Error(
            `Effect module "${module.name}" depends on "${dep}" which is not registered`
          );
        }
      }
    }

    this.modules.set(module.name, module);
    for (const effect of module.effects) {
      this.allEffects.set(effect.name, effect);
    }
  }

  getModule(name: string): EffectModule | undefined {
    return this.modules.get(name);
  }

  getEffect<T, P>(name: string): Effect<T, P> | undefined {
    return this.allEffects.get(name) as Effect<T, P> | undefined;
  }

  getEffectsByModule(moduleName: string): ReadonlyArray<Effect<unknown, unknown>> {
    const module = this.modules.get(moduleName);
    return module?.effects ?? [];
  }

  getAllModules(): ReadonlyArray<EffectModule> {
    return Array.from(this.modules.values());
  }

  getAllEffectNames(): ReadonlyArray<string> {
    return Array.from(this.allEffects.keys());
  }

  unregisterModule(name: string): boolean {
    const module = this.modules.get(name);
    if (!module) return false;

    for (const effect of module.effects) {
      this.allEffects.delete(effect.name);
    }
    this.modules.delete(name);
    return true;
  }

  clear(): void {
    this.modules.clear();
    this.allEffects.clear();
  }
}

export const effectRegistry = new EffectRegistryImpl();
