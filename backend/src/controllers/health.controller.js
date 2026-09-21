import { envConfig } from '../config/env.config.js';
import { roomService } from '../services/room.service.js';
import { db } from '../config/db.config.js';

/**
 * Controlador de verificación de estado y métricas de salud (AWS ALB / CloudWatch / App Runner)
 */
export const healthController = {
  check(req, res) {
    res.status(200).json({
      status: 'ok',
      service: 'CASE Enterprise Studio Backend API',
      version: '1.0.0',
      environment: envConfig.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      activeRooms: roomService.getAllRoomsSummary().length,
      database: {
        engine: 'PostgreSQL',
        connected: db.isConnected(),
        status: db.isConnected() ? 'ONLINE' : 'FALLBACK_MEMORY'
      }
    });
  }
};
