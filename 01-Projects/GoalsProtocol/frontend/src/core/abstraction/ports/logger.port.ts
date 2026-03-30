/**
 * ═══════════════════════════════════════════════════════════════
 * ABSTRACTION LAYER - LOGGER PORT
 * ═══════════════════════════════════════════════════════════════
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  readonly [key: string]: unknown;
}

export interface LoggerPort {
  readonly debug: (message: string, context?: LogContext) => void;
  readonly info: (message: string, context?: LogContext) => void;
  readonly warn: (message: string, context?: LogContext) => void;
  readonly error: (message: string, context?: LogContext) => void;
  readonly fatal: (message: string, context?: LogContext) => void;
  readonly setLevel: (level: LogLevel) => void;
  readonly child: (context: LogContext) => LoggerPort;
}
