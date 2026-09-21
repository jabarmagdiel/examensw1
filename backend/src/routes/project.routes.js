import { Router } from 'express';
import { projectController } from '../controllers/project.controller.js';

const router = Router();

router.get('/rooms', projectController.listActiveRooms);
router.get('/rooms/:roomId', projectController.getRoomDetails);
router.get('/rooms/:roomId/model', projectController.getModelSnapshot);

export default router;
