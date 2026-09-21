import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { corsConfig } from './config/cors.config.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Middlewares globales
  app.use(cors(corsConfig));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Rutas de API REST
  app.use('/api', apiRouter);

  // Soporte opcional para servir frontend estático si existe carpeta public/dist
  const possibleDistPaths = [
    path.join(__dirname, '../public'),
    path.join(__dirname, '../../frontend/dist'),
    path.join(__dirname, '../../dist')
  ];

  for (const distPath of possibleDistPaths) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
          return res.sendFile(path.join(distPath, 'index.html'));
        }
        next();
      });
      break;
    }
  }

  // Middleware de errores
  app.use(errorHandler);

  return app;
}
