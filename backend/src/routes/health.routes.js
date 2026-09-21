import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

router.get('/', healthController.check);
router.get('/health', healthController.check);

export default router;
