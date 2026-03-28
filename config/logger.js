/**
 * Lightweight logger that:
 * - Prints to stdout/stderr in non-production environments
 * - Silences all debug/info logs in production (NODE_ENV=production)
 * - Always prints warnings and errors (but strips sensitive stack traces in production)
 */

const IS_PROD = process.env.NODE_ENV === 'production';

const logger = {
  /** General informational log — suppressed in production */
  info: (...args) => {
    if (!IS_PROD) console.log('[INFO]', ...args);
  },

  /** Debug log — suppressed in production */
  debug: (...args) => {
    if (!IS_PROD) console.log('[DEBUG]', ...args);
  },

  /** Warning — always shown */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error — always shown.
   * In production: only logs the message string, NOT the full stack trace
   * to avoid exposing internal paths or query details.
   */
  error: (label, err) => {
    if (IS_PROD) {
      // Only log a safe summary in production
      console.error(`[ERROR] ${label}:`, err?.message ?? err);
    } else {
      console.error(`[ERROR] ${label}:`, err);
    }
  },
};

module.exports = logger;
