/**
 * ═══════════════════════════════════════════════════════════════
 * PRESENTATION - STORE HOOK
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import type { Store, Action, Selector } from '../../core/state/types.ts';

export const useStore = <S, A extends Action = Action>(store: Store<S, A>) => {
  const [state, setState] = useState<S>(store.getState());

  useEffect(() => {
    return store.subscribe((newState) => {
      setState(newState);
    });
  }, [store]);

  const dispatch = useCallback(
    (action: A) => {
      store.dispatch(action);
    },
    [store]
  );

  return { state, dispatch };
};

export const useSelector = <S, R>(store: Store<S>, selector: Selector<S, R>): R => {
  const [value, setValue] = useState<R>(() => selector(store.getState()));

  useEffect(() => {
    return store.subscribe((newState, prevState) => {
      const newValue = selector(newState);
      const oldValue = selector(prevState);
      if (newValue !== oldValue) {
        setValue(newValue);
      }
    });
  }, [store, selector]);

  return value;
};
