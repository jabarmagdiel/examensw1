import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { envConfig } from './config/env.config.js';
import { corsConfig } from './config/cors.config.js';
import { initSocketHandlers } from './sockets/index.js';

const app = createApp();
const httpServer = createServer(app);

// Inicializar Socket.io con configuración CORS
const io = new Server(httpServer, {
  cors: {
    origin: corsConfig.origin,
    methods: ['GET', 'POST']
  }
});

// Conectar handlers modulares de sockets
initSocketHandlers(io);

// Iniciar servidor HTTP y WebSocket
httpServer.listen(envConfig.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 CASE Enterprise Studio — Backend API & Sockets`);
  console.log(`📡 Puerto: ${envConfig.port}`);
  console.log(`🌍 Entorno: ${envConfig.nodeEnv}`);
  console.log(`🩺 Health check: http://localhost:${envConfig.port}/api/health`);
  console.log(`====================================================`);
});

export { app, httpServer, io };
