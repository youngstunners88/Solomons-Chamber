/**
 * ═══════════════════════════════════════════════════════════════
 * EFFECT SYSTEM - TYPES
 * ═══════════════════════════════════════════════════════════════
 * 
 * A type-safe, composable effect system for managing side effects
 * with cancellation, retry, debounce, and composition support.
 */

export type EffectStatus = 'idle' | 'pending' | 'success' | 'failure';

export interface EffectError {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
  readonly timestamp: number;
}

export interface EffectResult<T> {
  readonly data?: T;
  readonly error?: EffectError;
  readonly status: EffectStatus;
  readonly executedAt?: number;
  readonly completedAt?: number;
}

export interface EffectContext {
  readonly abortSignal: AbortSignal;
  readonly attempt: number;
  readonly meta: Record<string, unknown>;
}

export type EffectExecutor<T, P = void> = (
  payload: P,
  context: EffectContext
) => Promise<T>;

export interface EffectConfig {
  readonly debounceMs?: number;
  readonly throttleMs?: number;
  readonly retries?: number;
  readonly retryDelayMs?: number | ((attempt: number) => number);
  readonly timeoutMs?: number;
  readonly dedupe?: boolean;
  readonly cacheMs?: number;
}

export interface Effect<T, P = void> {
  readonly name: string;
  readonly config: EffectConfig;
  readonly execute: EffectExecutor<T, P>;
  readonly run: (payload: P) => Promise<EffectResult<T>>;
  readonly cancel: () => void;
  readonly reset: () => void;
  readonly subscribe: (callback: (result: EffectResult<T>) => void) => () => void;
  readonly getState: () => EffectResult<T>;
}

export interface EffectComposer {
  readonly sequential: <T>(effects: Array<() => Promise<T>>) => Promise<T[]>;
  readonly parallel: <T>(effects: Array<() => Promise<T>>) => Promise<PromiseSettledResult<T>[]>;
  readonly race: <T>(effects: Array<() => Promise<T>>) => Promise<T>;
  readonly fallback: <T>(primary: () => Promise<T>, fallback: () => Promise<T>) => Promise<T>;
}
