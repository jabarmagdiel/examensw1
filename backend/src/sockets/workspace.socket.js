import { workspaceService } from '../services/workspace.service.js';

/**
 * Handler de eventos de WebSocket para sincronización en vivo de Carpetas y Proyectos
 */
export function registerWorkspaceHandlers(io, socket) {
  // Cuando un cliente solicita sincronizar todo el espacio de trabajo
  socket.on('workspace_get', () => {
    socket.emit('workspace_sync', workspaceService.getWorkspace());
  });

  // Crear carpeta en tiempo real
  socket.on('folder_create', (folder) => {
    if (!folder) return;
    const created = workspaceService.createFolder(folder);
    io.emit('folder_created', created);
    console.log(`[Colaboración] Carpeta creada y difundida: ${created.name}`);
  });

  // Eliminar carpeta en tiempo real
  socket.on('folder_delete', (folderId) => {
    if (!folderId) return;
    workspaceService.deleteFolder(folderId);
    io.emit('folder_deleted', folderId);
    console.log(`[Colaboración] Carpeta eliminada y difundida: ${folderId}`);
  });

  // Crear proyecto en tiempo real
  socket.on('project_create', (project) => {
    if (!project) return;
    const created = workspaceService.createProject(project);
    io.emit('project_created', created);
    console.log(`[Colaboración] Proyecto creado y difundido: ${created.name} (${created.id})`);
  });

  // Actualizar proyecto en tiempo real
  socket.on('project_update', (project) => {
    if (!project) return;
    const updated = workspaceService.updateProject(project);
    io.emit('project_updated', updated);
  });

  // Eliminar proyecto en tiempo real
  socket.on('project_delete', (projectId) => {
    if (!projectId) return;
    workspaceService.deleteProject(projectId);
    io.emit('project_deleted', projectId);
    console.log(`[Colaboración] Proyecto eliminado y difundido: ${projectId}`);
  });
}
