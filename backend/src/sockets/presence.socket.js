import { roomService } from '../services/room.service.js';

/**
 * Handler de eventos de presencia, cursores y roles PUDS por socket
 */
export function registerPresenceHandlers(io, socket) {
  // Unirse a un proyecto/sala
  socket.on('join_project', ({ roomId, user }) => {
    if (!roomId) return;
    socket.join(roomId);

    const { room, user: registeredUser } = roomService.addUserToRoom(roomId, socket.id, user);

    // Enviar modelo actual al usuario que se acaba de conectar
    if (room.model) {
      socket.emit('model_sync', { model: room.model, version: room.version });
    }

    // Difundir lista actualizada de colaboradores a toda la sala
    io.to(roomId).emit('users_updated', Array.from(room.users.values()));
    console.log(`[Colaboración] ${registeredUser.name} (${registeredUser.role}) entró a la sala: ${roomId}`);
  });

  // Movimiento de cursor y selección de entidades
  socket.on('cursor_move', ({ roomId, cursor, selectedEntityId }) => {
    if (!roomId) return;
    const updatedUser = roomService.updateUserPresence(roomId, socket.id, { cursor, selectedEntityId });

    if (updatedUser) {
      socket.to(roomId).emit('user_cursor', {
        userId: updatedUser.id,
        socketId: socket.id,
        cursor,
        selectedEntityId
      });
    }
  });

  // Salir explícitamente de una sala
  socket.on('leave_project', ({ roomId }) => {
    if (!roomId) return;
    socket.leave(roomId);
    const result = roomService.removeUserFromRoom(roomId, socket.id);
    if (result) {
      io.to(roomId).emit('users_updated', roomService.getUsersInRoom(roomId));
    }
  });
}
