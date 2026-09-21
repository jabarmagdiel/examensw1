import { Router } from 'express';
import healthRoutes from './health.routes.js';
import projectRoutes from './project.routes.js';
import dataRoutes from './data.routes.js';

const apiRouter = Router();

apiRouter.use('/', healthRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/data', dataRoutes);
apiRouter.use('/db', dataRoutes);

export default apiRouter;
