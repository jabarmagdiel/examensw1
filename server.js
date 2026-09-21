import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de salud para balanceadores de carga de AWS (ALB / App Runner / ECS)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'CASE Enterprise Studio (PUDS)', 
    timestamp: new Date().toISOString() 
  });
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Almacenamiento en memoria de sesiones de colaboración por sala
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      model: null,
      users: new Map(),
      version: 1
    });
  }
  return rooms.get(roomId);
}

io.on('connection', (socket) => {
  console.log(`[Colaboración] Cliente conectado: ${socket.id}`);

  socket.on('join_project', ({ roomId, user }) => {
    socket.join(roomId);
    const room = getOrCreateRoom(roomId);

    // Registrar usuario en la sala con rol PUDS
    room.users.set(socket.id, {
      id: user?.id || socket.id,
      name: user?.name || `Usuario_${socket.id.slice(0, 4)}`,
      role: user?.role || 'Analista',
      color: user?.color || '#3b82f6',
      cursor: { x: 0, y: 0 },
      selectedEntityId: null,
      status: 'online',
      lastActive: Date.now()
    });

    // Enviar estado actual del proyecto al recién conectado si existe
    if (room.model) {
      socket.emit('model_sync', { model: room.model, version: room.version });
    }

    // Notificar a todos la lista actualizada de usuarios
    io.to(roomId).emit('users_updated', Array.from(room.users.values()));
    console.log(`[Colaboración] ${user?.name} (${user?.role}) se unió a la sala ${roomId}`);
  });

  // Movimiento de cursor / presencia
  socket.on('cursor_move', ({ roomId, cursor, selectedEntityId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      user.cursor = cursor;
      user.selectedEntityId = selectedEntityId;
      user.lastActive = Date.now();
      socket.to(roomId).emit('user_cursor', {
        userId: user.id,
        socketId: socket.id,
        cursor,
        selectedEntityId
      });
    }
  });

  // Modificación del modelo en tiempo real (operación atómica / CRDT snapshot)
  socket.on('model_change', ({ roomId, model, changeType, sourceUserId }) => {
    const room = getOrCreateRoom(roomId);
    room.model = model;
    room.version++;

    // Reenviar a los demás colaboradores de la sala
    socket.to(roomId).emit('model_updated', {
      model,
      version: room.version,
      changeType,
      sourceUserId
    });
  });

  // Sincronización en lote tras reconexión offline (Mobile / Desktop)
  socket.on('sync_offline_burst', ({ roomId, queuedChanges, user }) => {
    console.log(`[Offline Sync] Recibidos ${queuedChanges?.length || 0} cambios en lote de ${user?.name}`);
    socket.to(roomId).emit('batch_changes_applied', {
      queuedChanges,
      byUser: user,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        const leaving = room.users.get(socket.id);
        room.users.delete(socket.id);
        io.to(roomId).emit('users_updated', Array.from(room.users.values()));
        console.log(`[Colaboración] Usuario desconectado: ${leaving?.name}`);
      }
    });
  });
});

if (fs.existsSync(distPath)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`⚡ Servidor de Colaboración y Producción CASE-AI corriendo en puerto ${PORT}`);
});
