import type { Middleware } from '@reduxjs/toolkit';
import * as Sentry from "@sentry/react";

/**
 * Professional-grade logging middleware.
 * Logs actions and state changes to the console and Sentry breadcrumbs.
 */
export const loggerMiddleware: Middleware = (store) => (next) => (action: any) => {
  const prevState = store.getState();
  const result = next(action);
  const nextState = store.getState();

  // Console Logging (Standard for Dev/Diagnostics)
  console.groupCollapsed(`ACTION: ${action.type}`);
  console.log('%c prev state', 'color: #9E9E9E; font-weight: bold;', prevState);
  console.log('%c action', 'color: #03A9F4; font-weight: bold;', action);
  console.log('%c next state', 'color: #4CAF50; font-weight: bold;', nextState);
  console.groupEnd();

  // Sentry Breadcrumbs (Crucial for remote diagnostics)
  Sentry.addBreadcrumb({
    category: 'redux.action',
    message: action.type,
    data: {
      payload: action.payload,
      // We don't log the full state to Sentry for privacy/performance, 
      // but we could log specific keys if needed.
    },
    level: 'info',
  });

  return result;
};
