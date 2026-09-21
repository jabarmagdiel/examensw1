import { registerPresenceHandlers } from './presence.socket.js';
import { registerModelHandlers } from './model.socket.js';
import { registerWorkspaceHandlers } from './workspace.socket.js';
import { roomService } from '../services/room.service.js';

/**
 * Registrador principal de eventos de WebSocket
 */
export function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Conexión establecida: ${socket.id}`);

    // Registrar handlers modulares
    registerWorkspaceHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerModelHandlers(io, socket);

    // Desconexión limpia
    socket.on('disconnect', () => {
      const affectedRooms = roomService.removeUserFromAllRooms(socket.id);
      affectedRooms.forEach(({ roomId, user, remainingUsers }) => {
        io.to(roomId).emit('users_updated', remainingUsers);
        console.log(`[Socket] Usuario ${user?.name || socket.id} abandonó la sala ${roomId}`);
      });
      console.log(`[Socket] Conexión cerrada: ${socket.id}`);
    });
  });
}
