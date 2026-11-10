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

    // Enviar historial del chat grupal y configuración de IA Senior si existen en la sala
    if (room.chatMessages && room.chatMessages.length > 0) {
      socket.emit('group_chat_sync', { roomId, messages: room.chatMessages });
    }
    if (room.aiConfig) {
      socket.emit('ai_config_sync', { roomId, config: room.aiConfig });
    }

    // Difundir lista actualizada de colaboradores a toda la sala
    io.to(roomId).emit('users_updated', Array.from(room.users.values()));
    console.log(`[Colaboración] ${registeredUser.name} (${registeredUser.role}) entró a la sala: ${roomId}`);
  });

  // Chat Grupal Colaborativo + Respuestas del Senior AI Mentor
  socket.on('group_chat_send', ({ roomId, message }) => {
    if (!roomId || !message) return;
    roomService.addChatMessage(roomId, message);
    socket.to(roomId).emit('group_chat_message', { roomId, message });
  });

  // Cambio de configuración del Senior AI Mentor compartido en la sala
  socket.on('ai_config_change', ({ roomId, config }) => {
    if (!roomId || !config) return;
    roomService.updateAIConfig(roomId, config);
    socket.to(roomId).emit('ai_config_sync', { roomId, config });
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
