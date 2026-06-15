import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { processEconomicTick } from '../engine/economicEngine';

export const useWorldEngine = (isInitialized: boolean) => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state);

  // Keep a ref to the latest state so the interval callback never reads stale values
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isInitialized) {
      timerRef.current = setInterval(() => {
        processEconomicTick(stateRef.current, dispatch);
      }, 5000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isInitialized, dispatch]); // intentionally excludes state — stateRef handles freshness
};
