/**
 * ═══════════════════════════════════════════════════════════════
 * STATE MANAGEMENT - SLICE
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  Action,
  Reducer,
  Slice,
  SliceConfig,
  SliceActions,
} from './types.ts';

export const createSlice = <
  S,
  N extends string,
  R extends Record<string, Reducer<S, Action>>
>(
  config: SliceConfig<S, N, R>
): Slice<S, N, R> => {
  const { name, initialState, reducers } = config;

  const actions = {} as SliceActions<R>;

  const reducer: Reducer<S, Action> = (state = initialState, action) => {
    const caseReducer = reducers[action.type];
    if (caseReducer) {
      return caseReducer(state, action);
    }
    return state;
  };

  for (const [key, caseReducer] of Object.entries(reducers)) {
    const actionType = `${name}/${key}`;
    (actions as Record<string, (payload?: unknown) => Action>)[key] = (
      payload?: unknown
    ) => ({
      type: actionType,
      payload,
    });

    // Override reducer to use prefixed action type
    (reducers as Record<string, Reducer<S, Action>>)[actionType] = caseReducer;
  }

  // Wrap reducer to handle prefixed action types
  const wrappedReducer: Reducer<S, Action> = (state = initialState, action) => {
    const caseReducer = reducers[action.type];
    if (caseReducer) {
      return caseReducer(state, action);
    }
    return state;
  };

  return {
    name,
    reducer: wrappedReducer,
    actions,
    getInitialState: () => initialState,
  };
};
