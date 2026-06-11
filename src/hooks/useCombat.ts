import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { processCombatTick } from '../engine/combatEngine';

export const useCombat = (isActive: boolean) => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        processCombatTick(state, dispatch);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, dispatch, state]);
};
