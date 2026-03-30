/**
 * ═══════════════════════════════════════════════════════════════
 * STATE MANAGEMENT - MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 */

import type { Action, Middleware } from './types.ts';

export const loggerMiddleware: Middleware<unknown, Action> =
  (api) => (next) => (action) => {
    console.group(`Action: ${action.type}`);
    console.log('Prev State:', api.getState());
    console.log('Action:', action);
    const result = next(action);
    console.log('Next State:', api.getState());
    console.groupEnd();
    return result;
  };

export const thunkMiddleware: Middleware<unknown, Action> =
  (api) => (next) => (action) => {
    if (typeof action === 'function') {
      return (action as (dispatch: typeof api.dispatch, getState: typeof api.getState) => unknown)(
        api.dispatch,
        api.getState
      );
    }
    return next(action);
  };

export const persistenceMiddleware = <S>(
  key: string,
  serialize: (state: S) => string = JSON.stringify,
  deserialize: (data: string) => S = JSON.parse
): Middleware<S, Action> => {
  return (api) => (next) => (action) => {
    const result = next(action);
    try {
      localStorage.setItem(key, serialize(api.getState()));
    } catch (err) {
      console.error('Persistence middleware error:', err);
    }
    return result;
  };
};

export const createDebounceMiddleware = (
  actionTypes: string[],
  delayMs: number
): Middleware<unknown, Action> => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return () => (next) => (action) => {
    if (!actionTypes.includes(action.type)) {
      return next(action);
    }

    const existingTimer = timers.get(action.type);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      timers.delete(action.type);
      next(action);
    }, delayMs);

    timers.set(action.type, timer);
    return action;
  };
};
