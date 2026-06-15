import type { Middleware } from '@reduxjs/toolkit';
import * as Sentry from "@sentry/react";

const isDev = import.meta.env.DEV;

export const loggerMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  if (isDev) {
    const nextState = store.getState();
    console.groupCollapsed(`ACTION: ${action.type}`);
    console.log('%c action', 'color: #03A9F4; font-weight: bold;', action);
    console.log('%c next state', 'color: #4CAF50; font-weight: bold;', nextState);
    console.groupEnd();
  }

  // Only send high-value breadcrumbs to Sentry, not every tick
  const noiseActions = ['game/incrementTime', 'game/tickEnemy', 'player/tickCombat'];
  if (!noiseActions.includes(action.type)) {
    Sentry.addBreadcrumb({
      category: 'redux.action',
      message: action.type,
      data: { payload: action.payload },
      level: 'info',
    });
  }

  return result;
};
