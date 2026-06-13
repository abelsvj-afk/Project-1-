import * as Sentry from "@sentry/react";

/**
 * Wraps a function with diagnostic logging.
 * Logs call arguments, return value, and execution time.
 */
export function withDiagnostics<T extends (...args: any[]) => any>(
  fn: T, 
  name: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    
    console.log(`%c [DIAGNOSTIC] Calling: ${name}`, 'color: #2196F3; font-style: italic;', { args });
    
    try {
      const result = fn(...args);
      const end = performance.now();
      
      console.log(`%c [DIAGNOSTIC] ${name} returned in ${(end - start).toFixed(2)}ms`, 'color: #4CAF50;', { result });
      
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`%c [DIAGNOSTIC] ${name} FAILED after ${(end - start).toFixed(2)}ms`, 'color: #F44336;', error);
      
      Sentry.captureException(error, {
        extra: {
          functionName: name,
          args,
          executionTime: end - start,
        }
      });
      
      throw error;
    }
  }) as T;
}
