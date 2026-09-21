import { modelSyncService } from '../services/modelSync.service.js';

/**
 * Handler de eventos de sincronización del modelo relacional y cambios atómicos
 */
export function registerModelHandlers(io, socket) {
  // Cambio en el modelo de base de datos
  socket.on('model_change', ({ roomId, model, changeType, sourceUserId }) => {
    if (!roomId || !model) return;

    const syncResult = modelSyncService.updateModel(roomId, model, changeType, sourceUserId);

    // Difundir el cambio al resto de los participantes de la sala
    socket.to(roomId).emit('model_updated', {
      model: syncResult.model,
      version: syncResult.version,
      changeType,
      sourceUserId
    });
  });

  // Sincronización en lote tras reconexión offline
  socket.on('sync_offline_burst', ({ roomId, queuedChanges, user }) => {
    if (!roomId) return;

    const result = modelSyncService.applyBatchOfflineChanges(roomId, queuedChanges, user);
    console.log(`[Offline Sync] Aplicados ${result.appliedCount} cambios acumulados de ${user?.name} en sala ${roomId}`);

    socket.to(roomId).emit('batch_changes_applied', {
      queuedChanges,
      byUser: user,
      timestamp: result.timestamp
    });
  });
}
