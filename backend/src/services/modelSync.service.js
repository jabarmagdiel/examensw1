import { roomService } from './room.service.js';

/**
 * Servicio para sincronización de modelos relacionales y resolución de cambios en tiempo real.
 */
class ModelSyncService {
  updateModel(roomId, model, changeType, sourceUserId) {
    const room = roomService.getOrCreateRoom(roomId);
    room.model = model;
    room.version = (room.version || 0) + 1;
    room.lastModified = Date.now();
    room.lastModifiedBy = sourceUserId;

    return {
      model: room.model,
      version: room.version,
      changeType,
      sourceUserId,
      timestamp: room.lastModified
    };
  }

  getModel(roomId) {
    const room = roomService.getOrCreateRoom(roomId);
    return {
      model: room.model,
      version: room.version
    };
  }

  applyBatchOfflineChanges(roomId, queuedChanges, user) {
    const room = roomService.getOrCreateRoom(roomId);
    room.version = (room.version || 0) + (queuedChanges?.length || 1);
    room.lastModified = Date.now();

    return {
      roomId,
      appliedCount: queuedChanges?.length || 0,
      user,
      version: room.version,
      timestamp: Date.now()
    };
  }
}

export const modelSyncService = new ModelSyncService();
