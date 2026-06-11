import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { processEconomicTick } from '../engine/economicEngine';

export const useWorldEngine = (isInitialized: boolean) => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isInitialized) {
      // Economic/World tick happens every 5 seconds
      timerRef.current = setInterval(() => {
        processEconomicTick(state, dispatch);
      }, 5000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInitialized, dispatch, state]);
};
