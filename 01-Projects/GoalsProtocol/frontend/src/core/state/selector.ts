/**
 * ═══════════════════════════════════════════════════════════════
 * STATE MANAGEMENT - SELECTORS
 * ═══════════════════════════════════════════════════════════════
 */

import type { Selector } from './types.ts';

interface MemoizedSelector<S, R> extends Selector<S, R> {
  readonly clearCache: () => void;
  readonly dependencies: ReadonlyArray<Selector<S, unknown>>;
}

export const createSelector = <S, D extends unknown[], R>(
  ...args: [...selectors: { [K in keyof D]: Selector<S, D[K]> }, combiner: (...args: D) => R]
): MemoizedSelector<S, R> => {
  const selectors = args.slice(0, -1) as { [K in keyof D]: Selector<S, D[K]> };
  const combiner = args[args.length - 1] as (...args: D) => R;

  let lastArgs: D | undefined;
  let lastResult: R;

  const memoizedSelector = (state: S): R => {
    const params = selectors.map((selector) => selector(state)) as D;

    if (
      lastArgs &&
      params.length === lastArgs.length &&
      params.every((arg, index) => arg === lastArgs![index])
    ) {
      return lastResult;
    }

    lastArgs = params;
    lastResult = combiner(...params);
    return lastResult;
  };

  return Object.assign(memoizedSelector, {
    clearCache: () => {
      lastArgs = undefined;
    },
    dependencies: selectors as unknown as ReadonlyArray<Selector<S, unknown>>,
  });
};

export const createPathSelector = <S extends object, R>(
  path: string
): Selector<S, R | undefined> => {
  const keys = path.split('.');
  return (state: S): R | undefined => {
    let current: unknown = state;
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current as R | undefined;
  };
};
