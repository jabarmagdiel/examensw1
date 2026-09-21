import { Router } from 'express';
import { workspaceService } from '../services/workspace.service.js';

const router = Router();

// Obtener todo el espacio de trabajo (carpetas y proyectos)
router.get('/', (req, res) => {
  res.json(workspaceService.getWorkspace());
});

// Carpetas
router.post('/folders', (req, res) => {
  const folder = workspaceService.createFolder(req.body);
  res.status(201).json(folder);
});

router.delete('/folders/:id', (req, res) => {
  workspaceService.deleteFolder(req.params.id);
  res.json({ success: true });
});

// Proyectos
router.post('/projects', (req, res) => {
  const project = workspaceService.createProject(req.body);
  res.status(201).json(project);
});

router.put('/projects/:id', (req, res) => {
  const project = workspaceService.updateProject({ id: req.params.id, ...req.body });
  res.json(project);
});

router.delete('/projects/:id', (req, res) => {
  workspaceService.deleteProject(req.params.id);
  res.json({ success: true });
});

export default router;
