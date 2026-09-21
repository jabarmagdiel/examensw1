import { Router } from 'express';
import { dataController } from '../controllers/data.controller.js';

const router = Router();

// Gestión de conexión a Base de Datos (Supabase / Postgres)
router.get('/status', dataController.getStatus);
router.post('/connect', dataController.connect);
router.post('/init', dataController.initSchema);

// Operaciones CRUD genéricas sobre las tablas
router.get('/:table', dataController.listTableRecords);
router.post('/:table', dataController.createRecord);
router.put('/:table/:id', dataController.updateRecord);
router.delete('/:table/:id', dataController.deleteRecord);

export default router;
