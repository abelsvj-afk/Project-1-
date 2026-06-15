import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { processCombatTick } from '../engine/combatEngine';

export const useCombat = (isActive: boolean) => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state);

  // Keep a ref to the latest state so the interval callback never reads stale values
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        processCombatTick(stateRef.current, dispatch);
      }, 100);
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
  }, [isActive, dispatch]); // intentionally excludes state — stateRef handles freshness
};
