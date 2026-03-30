/**
 * ═══════════════════════════════════════════════════════════════
 * EFFECT SYSTEM - FACTORY
 * ═══════════════════════════════════════════════════════════════
 * 
 * Creates type-safe, observable effects with full lifecycle control.
 */

import type {
  Effect,
  EffectConfig,
  EffectContext,
  EffectError,
  EffectExecutor,
  EffectResult,
} from './types.ts';

const createEffectError = (error: unknown, attempt: number): EffectError => {
  if (error instanceof Error) {
    return {
      code: error.name || 'EFFECT_ERROR',
      message: error.message,
      cause: error,
      timestamp: Date.now(),
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    cause: error,
    timestamp: Date.now(),
  };
};

const createInitialResult = <T>(): EffectResult<T> => ({
  status: 'idle',
});

export const createEffect = <T, P = void>(
  name: string,
  executor: EffectExecutor<T, P>,
  config: EffectConfig = {}
): Effect<T, P> => {
  const subscribers = new Set<(result: EffectResult<T>) => void>();
  let currentResult = createInitialResult<T>();
  let currentAbortController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastExecutionTime = 0;
  let pendingPromise: Promise<EffectResult<T>> | null = null;
  const cache = new Map<string, { result: T; expiresAt: number }>();

  const notify = (result: EffectResult<T>): void => {
    currentResult = result;
    subscribers.forEach((cb) => {
      try {
        cb(result);
      } catch (err) {
        console.error(`[Effect:${name}] Subscriber error:`, err);
      }
    });
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getRetryDelay = (attempt: number): number => {
    if (typeof config.retryDelayMs === 'function') {
      return config.retryDelayMs(attempt);
    }
    // Exponential backoff: 1000ms, 2000ms, 4000ms...
    return (config.retryDelayMs || 1000) * Math.pow(2, attempt - 1);
  };

  const executeWithRetry = async (
    payload: P,
    context: EffectContext
  ): Promise<T> => {
    let lastError: unknown;
    const maxRetries = config.retries ?? 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const ctx: EffectContext = {
          ...context,
          attempt: attempt + 1,
        };
        return await executor(payload, ctx);
      } catch (error) {
        lastError = error;
        if (context.abortSignal.aborted) {
          throw error;
        }
        if (attempt < maxRetries) {
          await sleep(getRetryDelay(attempt + 1));
        }
      }
    }

    throw lastError;
  };

  const runInternal = async (payload: P): Promise<EffectResult<T>> => {
    // Cancel any existing execution
    if (currentAbortController) {
      currentAbortController.abort();
    }

    // Handle debounce
    if (config.debounceMs && config.debounceMs > 0) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      return new Promise((resolve) => {
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          resolve(executeNow(payload));
        }, config.debounceMs);
      });
    }

    // Handle throttle
    if (config.throttleMs && config.throttleMs > 0) {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecutionTime;
      if (timeSinceLastExecution < config.throttleMs) {
        return currentResult;
      }
    }

    // Handle deduplication
    if (config.dedupe && pendingPromise) {
      return pendingPromise;
    }

    return executeNow(payload);
  };

  const executeNow = async (payload: P): Promise<EffectResult<T>> => {
    // Check cache
    if (config.cacheMs && config.cacheMs > 0) {
      const cacheKey = JSON.stringify(payload);
      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          data: cached.result,
          status: 'success',
          executedAt: Date.now(),
          completedAt: Date.now(),
        };
      }
    }

    currentAbortController = new AbortController();
    const executedAt = Date.now();
    lastExecutionTime = executedAt;

    notify({
      status: 'pending',
      executedAt,
    });

    const context: EffectContext = {
      abortSignal: currentAbortController.signal,
      attempt: 1,
      meta: {},
    };

    try {
      // Handle timeout
      let resultPromise = executeWithRetry(payload, context);
      if (config.timeoutMs && config.timeoutMs > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Effect "${name}" timed out after ${config.timeoutMs}ms`));
          }, config.timeoutMs);
          context.abortSignal.addEventListener('abort', () => {
            clearTimeout(timer);
          });
        });
        resultPromise = Promise.race([resultPromise, timeoutPromise]);
      }

      const data = await resultPromise;
      const completedAt = Date.now();

      // Store in cache
      if (config.cacheMs && config.cacheMs > 0) {
        const cacheKey = JSON.stringify(payload);
        cache.set(cacheKey, {
          result: data,
          expiresAt: Date.now() + config.cacheMs,
        });
      }

      const successResult: EffectResult<T> = {
        data,
        status: 'success',
        executedAt,
        completedAt,
      };

      notify(successResult);
      return successResult;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return currentResult;
      }

      const completedAt = Date.now();
      const errorResult: EffectResult<T> = {
        error: createEffectError(error, context.attempt),
        status: 'failure',
        executedAt,
        completedAt,
      };

      notify(errorResult);
      return errorResult;
    } finally {
      currentAbortController = null;
      pendingPromise = null;
    }
  };

  const run = (payload: P): Promise<EffectResult<T>> => {
    pendingPromise = runInternal(payload);
    return pendingPromise;
  };

  const cancel = (): void => {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const reset = (): void => {
    cancel();
    currentResult = createInitialResult<T>();
    cache.clear();
    notify(currentResult);
  };

  const subscribe = (callback: (result: EffectResult<T>) => void): (() => void) => {
    subscribers.add(callback);
    // Immediately emit current state
    callback(currentResult);
    return () => {
      subscribers.delete(callback);
    };
  };

  const getState = (): EffectResult<T> => currentResult;

  return {
    name,
    config,
    execute: executor,
    run,
    cancel,
    reset,
    subscribe,
    getState,
  };
};
