/**
 * ═══════════════════════════════════════════════════════════════
 * STATE MANAGEMENT - STORE
 * ═══════════════════════════════════════════════════════════════
 */

import { produce } from 'immer';
import type { Action, Reducer, Listener, Middleware, Store } from './types.ts';

export const createStore = <S, A extends Action = Action>(
  reducer: Reducer<S, A>,
  preloadedState?: S,
  middlewares: Middleware<S, A>[] = []
): Store<S, A> => {
  let currentState = preloadedState as S;
  let currentReducer = reducer;
  const listeners = new Set<Listener<S>>();
  let isDispatching = false;

  const getState = (): S => currentState;

  const dispatch = (action: A): A => {
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      const prevState = currentState;
      currentState = produce(currentState, (draft) => {
        currentReducer(draft as S, action);
      }) as S;

      if (currentState !== prevState) {
        listeners.forEach((listener) => {
          try {
            listener(currentState, prevState);
          } catch (err) {
            console.error('Store listener error:', err);
          }
        });
      }
    } finally {
      isDispatching = false;
    }

    return action;
  };

  const subscribe = (listener: Listener<S>): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const replaceReducer = (newReducer: Reducer<S, A>): void => {
    currentReducer = newReducer;
  };

  // Initialize state
  currentState = currentReducer(undefined as S, {
    type: '@@store/INIT',
  } as A);

  // Apply middlewares
  const api = { getState, dispatch };
  const enhancedDispatch = middlewares
    .slice()
    .reverse()
    .reduce(
      (acc, middleware) => middleware(api)(acc),
      dispatch as (action: A) => A
    );

  return {
    getState,
    dispatch: enhancedDispatch,
    subscribe,
    replaceReducer,
  };
};

export const combineReducers = <S extends Record<string, unknown>>(
  reducers: { [K in keyof S]: Reducer<S[K], Action> }
): Reducer<S, Action> => {
  return (state: S | undefined, action: Action): S => {
    const nextState = {} as S;
    let hasChanged = false;

    for (const key of Object.keys(reducers) as Array<keyof S>) {
      const reducer = reducers[key];
      const previousStateForKey = state?.[key];
      const nextStateForKey = reducer(previousStateForKey as S[keyof S], action);
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : (state as S);
  };
};
