/**
 * BizReel Enterprise Logger
 * Centralized logging for performance monitoring and error tracking.
 */

const IS_DEV = __DEV__;

export const Logger = {
  log: (message: string, data?: any) => {
    if (IS_DEV) {
      console.log(`[BIZREEL LOG] ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    // In production, you would send this to Sentry or a similar service
    console.error(`[BIZREEL ERROR] ${message}`, error || '');
  },

  warn: (message: string, data?: any) => {
    if (IS_DEV) {
      console.warn(`[BIZREEL WARN] ${message}`, data || '');
    }
  },

  perf: (metric: string, duration: number) => {
    if (IS_DEV && duration > 100) { // Log slow operations
      console.log(`[BIZREEL PERF] ${metric} took ${duration}ms`);
    }
  }
};
