/**
 * Lightweight structured logger for environments where pino isn't available.
 * Provides the subset of functionality used by the API.
 */

import { config } from '../config/index.js';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const LEVELS: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

type LogPayload = Record<string, unknown> | undefined;

type LogMethod = (payload: LogPayload | string, message?: string) => void;

interface LoggerInstance {
  fatal: LogMethod;
  error: LogMethod;
  warn: LogMethod;
  info: LogMethod;
  debug: LogMethod;
  trace: LogMethod;
  child(bindings: Record<string, unknown>): LoggerInstance;
}

function createConsoleLogger(bindings: Record<string, unknown>, level: LogLevel): LoggerInstance {
  const currentLevel = LEVELS[level] ?? LEVELS.info;

  const log = (logLevel: LogLevel, payload: LogPayload | string, message?: string) => {
    if (LEVELS[logLevel] > currentLevel) {
      return;
    }

    const time = new Date().toISOString();
    const payloadObject =
      typeof payload === 'string' || payload === undefined ? undefined : (payload as Record<string, unknown>);
    const finalMessage = typeof payload === 'string' ? payload : message;
    const entry: Record<string, unknown> = {
      time,
      level: logLevel,
      ...bindings,
      ...(payloadObject ?? {}),
    };
    if (finalMessage !== undefined) {
      entry.msg = finalMessage;
    }

    const serialized = JSON.stringify(entry);
    switch (logLevel) {
      case 'fatal':
      case 'error':
        console.error(serialized);
        break;
      case 'warn':
        console.warn(serialized);
        break;
      default:
        console.log(serialized);
        break;
    }
  };

  const makeMethod = (logLevel: LogLevel): LogMethod => (payload, message) => {
    if (typeof payload === 'string' && message === undefined) {
      log(logLevel, undefined, payload);
    } else {
      log(logLevel, payload, message);
    }
  };

  return {
    fatal: makeMethod('fatal'),
    error: makeMethod('error'),
    warn: makeMethod('warn'),
    info: makeMethod('info'),
    debug: makeMethod('debug'),
    trace: makeMethod('trace'),
    child(childBindings: Record<string, unknown>) {
      return createConsoleLogger({ ...bindings, ...childBindings }, level);
    },
  };
}

const baseBindings = { service: 'microtech-api' };
const level = (config.logging.level ?? 'info') as LogLevel;

export const logger = createConsoleLogger(baseBindings, level);

export const createLogger = (name: string) => logger.child({ module: name });
