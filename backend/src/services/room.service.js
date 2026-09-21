/**
 * Servicio de Gestión de Salas y Presencia de Colaboradores PUDS
 */
class RoomService {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        model: null,
        users: new Map(),
        version: 1,
        createdAt: Date.now()
      });
    }
    return this.rooms.get(roomId);
  }

  addUserToRoom(roomId, socketId, user) {
    const room = this.getOrCreateRoom(roomId);
    const userData = {
      id: user?.id || socketId,
      name: user?.name || `Usuario_${socketId.slice(0, 4)}`,
      role: user?.role || 'Analista',
      color: user?.color || '#3b82f6',
      cursor: { x: 0, y: 0 },
      selectedEntityId: null,
      status: 'online',
      lastActive: Date.now()
    };
    room.users.set(socketId, userData);
    return { room, user: userData };
  }

  updateUserPresence(roomId, socketId, { cursor, selectedEntityId }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.users.get(socketId);
    if (user) {
      user.cursor = cursor || user.cursor;
      user.selectedEntityId = selectedEntityId !== undefined ? selectedEntityId : user.selectedEntityId;
      user.lastActive = Date.now();
      return user;
    }
    return null;
  }

  removeUserFromRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.users.get(socketId);
    room.users.delete(socketId);
    return { room, user };
  }

  removeUserFromAllRooms(socketId) {
    const affectedRooms = [];
    this.rooms.forEach((room, roomId) => {
      if (room.users.has(socketId)) {
        const user = room.users.get(socketId);
        room.users.delete(socketId);
        affectedRooms.push({ roomId, user, remainingUsers: Array.from(room.users.values()) });
      }
    });
    return affectedRooms;
  }

  getUsersInRoom(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  getAllRoomsSummary() {
    const summary = [];
    this.rooms.forEach((room, id) => {
      summary.push({
        id,
        userCount: room.users.size,
        version: room.version,
        hasModel: Boolean(room.model)
      });
    });
    return summary;
  }
}

export const roomService = new RoomService();
