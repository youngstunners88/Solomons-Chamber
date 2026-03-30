/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - LOGGER ADAPTER
 * ═══════════════════════════════════════════════════════════════
 */

import type { LoggerPort, LogLevel, LogContext } from '../ports/logger.port.ts';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

export class ConsoleLoggerAdapter implements LoggerPort {
  private level: LogLevel = 'info';
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level];
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      context: Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
    };

    switch (level) {
      case 'debug':
        console.debug('[DEBUG]', message, mergedContext);
        break;
      case 'info':
        console.info('[INFO]', message, mergedContext);
        break;
      case 'warn':
        console.warn('[WARN]', message, mergedContext);
        break;
      case 'error':
      case 'fatal':
        console.error(`[${level.toUpperCase()}]`, message, mergedContext);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  fatal(message: string, context?: LogContext): void {
    this.log('fatal', message, context);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  child(context: LogContext): LoggerPort {
    return new ConsoleLoggerAdapter({ ...this.context, ...context });
  }
}
