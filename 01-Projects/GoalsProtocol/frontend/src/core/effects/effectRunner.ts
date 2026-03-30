/**
 * ═══════════════════════════════════════════════════════════════
 * EFFECT SYSTEM - RUNNER
 * ═══════════════════════════════════════════════════════════════
 * 
 * Central orchestrator for executing, composing, and managing effects.
 */

import type { Effect, EffectComposer, EffectResult } from './types.ts';

interface RunningEffect {
  readonly id: string;
  readonly effectName: string;
  readonly startedAt: number;
  readonly cancel: () => void;
}

class EffectRunnerImpl {
  private runningEffects = new Map<string, RunningEffect>();
  private effectRegistry = new Map<string, Effect<unknown, unknown>>();
  private idCounter = 0;

  register<T, P>(effect: Effect<T, P>): void {
    this.effectRegistry.set(effect.name, effect as Effect<unknown, unknown>);
  }

  unregister(name: string): boolean {
    const effect = this.effectRegistry.get(name);
    if (effect) {
      effect.cancel();
      this.effectRegistry.delete(name);
      return true;
    }
    return false;
  }

  async run<T, P>(
    effect: Effect<T, P>,
    payload: P,
    options?: { tag?: string }
  ): Promise<EffectResult<T>> {
    const id = `${effect.name}_${options?.tag || ++this.idCounter}`;

    // Cancel previous running effect with same tag
    if (options?.tag) {
      const existing = Array.from(this.runningEffects.values()).find(
        (e) => e.effectName === effect.name && e.id === id
      );
      if (existing) {
        existing.cancel();
        this.runningEffects.delete(existing.id);
      }
    }

    const runningEffect: RunningEffect = {
      id,
      effectName: effect.name,
      startedAt: Date.now(),
      cancel: () => effect.cancel(),
    };

    this.runningEffects.set(id, runningEffect);

    try {
      const result = await effect.run(payload);
      return result;
    } finally {
      this.runningEffects.delete(id);
    }
  }

  cancelAll(effectName?: string): void {
    this.runningEffects.forEach((effect) => {
      if (!effectName || effect.effectName === effectName) {
        effect.cancel();
      }
    });
    if (effectName) {
      this.runningEffects.forEach((effect, id) => {
        if (effect.effectName === effectName) {
          this.runningEffects.delete(id);
        }
      });
    } else {
      this.runningEffects.clear();
    }
  }

  getRunningEffects(): ReadonlyArray<RunningEffect> {
    return Array.from(this.runningEffects.values());
  }

  get composer(): EffectComposer {
    return {
      sequential: async <T>(effects: Array<() => Promise<T>>): Promise<T[]> => {
        const results: T[] = [];
        for (const effect of effects) {
          results.push(await effect());
        }
        return results;
      },

      parallel: async <T>(
        effects: Array<() => Promise<T>>
      ): Promise<PromiseSettledResult<T>[]> => {
        return Promise.allSettled(effects.map((e) => e()));
      },

      race: async <T>(effects: Array<() => Promise<T>>): Promise<T> => {
        return Promise.race(effects.map((e) => e()));
      },

      fallback: async <T>(
        primary: () => Promise<T>,
        fallbackFn: () => Promise<T>
      ): Promise<T> => {
        try {
          return await primary();
        } catch {
          return fallbackFn();
        }
      },
    };
  }
}

export const effectRunner = new EffectRunnerImpl();
