import { roomService } from '../services/room.service.js';
import { modelSyncService } from '../services/modelSync.service.js';

/**
 * Controlador REST para consultar salas activas y modelos de proyectos
 */
export const projectController = {
  // Listar todas las salas de colaboración activas
  listActiveRooms(req, res) {
    const rooms = roomService.getAllRoomsSummary();
    res.json({
      total: rooms.length,
      rooms
    });
  },

  // Obtener estado y usuarios de una sala específica
  getRoomDetails(req, res) {
    const { roomId } = req.params;
    const room = roomService.getOrCreateRoom(roomId);
    res.json({
      roomId: room.id,
      version: room.version,
      hasModel: Boolean(room.model),
      users: Array.from(room.users.values())
    });
  },

  // Obtener snapshot del modelo
  getModelSnapshot(req, res) {
    const { roomId } = req.params;
    const { model, version } = modelSyncService.getModel(roomId);
    if (!model) {
      return res.status(404).json({ message: 'No hay modelo sincronizado para esta sala aún.' });
    }
    res.json({ roomId, version, model });
  }
};
