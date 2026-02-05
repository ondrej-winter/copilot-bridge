/**
 * Port for logging operations
 */
export interface LoggerPort {
  /**
   * Log a debug message
   * @param message - Message to log
   */
  debug(message: string): void;

  /**
   * Log an informational message
   * @param message - Message to log
   */
  info(message: string): void;

  /**
   * Log a warning message
   * @param message - Message to log
   */
  warning(message: string): void;

  /**
   * Log an error message
   * @param message - Message to log
   * @param error - Optional error object
   */
  error(message: string, error?: Error): void;

  /**
   * Show the output channel
   * @param preserveFocus - Whether to preserve focus on current editor
   */
  show(preserveFocus?: boolean): void;
}
