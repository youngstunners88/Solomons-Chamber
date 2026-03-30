/**
 * ═══════════════════════════════════════════════════════════════
 * STATE MANAGEMENT - TYPES
 * ═══════════════════════════════════════════════════════════════
 */

export type ActionType = string;

export interface Action<T = unknown> {
  readonly type: ActionType;
  readonly payload?: T;
  readonly meta?: Record<string, unknown>;
  readonly error?: boolean;
}

export type Reducer<S, A extends Action = Action> = (state: S, action: A) => S;

export type Selector<S, R> = (state: S) => R;

export type Listener<S> = (state: S, prevState: S) => void;

export type Unsubscribe = () => void;

export interface MiddlewareAPI<S, A extends Action> {
  readonly getState: () => S;
  readonly dispatch: (action: A) => A;
}

export type Middleware<S, A extends Action> = (
  api: MiddlewareAPI<S, A>
) => (next: (action: A) => A) => (action: A) => A;

export interface Store<S, A extends Action = Action> {
  readonly getState: () => S;
  readonly dispatch: (action: A) => A;
  readonly subscribe: (listener: Listener<S>) => Unsubscribe;
  readonly replaceReducer: (reducer: Reducer<S, A>) => void;
}

export interface SliceConfig<
  S,
  N extends string,
  R extends Record<string, Reducer<S, Action>>
> {
  readonly name: N;
  readonly initialState: S;
  readonly reducers: R;
}

export type SliceActions<R extends Record<string, Reducer<unknown, Action>>> = {
  [K in keyof R]: (payload?: unknown) => Action;
};

export interface Slice<
  S,
  N extends string,
  R extends Record<string, Reducer<S, Action>>
> {
  readonly name: N;
  readonly reducer: Reducer<S, Action>;
  readonly actions: SliceActions<R>;
  readonly getInitialState: () => S;
}
