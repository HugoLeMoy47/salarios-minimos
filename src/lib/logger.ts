import pino from 'pino';

// Ajustes de logger simples, cambia según entorno
const isProd = process.env.NODE_ENV === 'production';

// Si pino no está disponible en un entorno (por ejemplo en tests) se desacopla
export const logger = pino(
  {
    level: isProd ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  // write stream por defecto (stdout)
);

export type Logger = pino.Logger;

// helper para crear sub-loggers
export function childLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}
