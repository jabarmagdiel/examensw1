import { envConfig } from './env.config.js';

/**
 * Configuración de políticas CORS para HTTP y WebSockets.
 */
export const corsConfig = {
  origin: envConfig.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};
