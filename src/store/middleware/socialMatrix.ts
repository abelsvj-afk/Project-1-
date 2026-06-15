// Social matrix cascades are handled directly inside the updateRelationship reducer
// in gameSlice.ts (fear→trust and romance→trust). This middleware is kept as a
// no-op passthrough to avoid removing it from the middleware chain in one step.
import type { Middleware } from '@reduxjs/toolkit';

export const socialMatrixMiddleware: Middleware = (_store) => (next) => (action) => {
  return next(action);
};
