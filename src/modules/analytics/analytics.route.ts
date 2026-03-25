import { Router } from 'express';
import checkAuth from '../../middlewares/checkAuth';
import { AnalyticsController } from './analytics.controller';

const router = Router();

router.post('/bot', AnalyticsController.createBotQueryLog);
router.get('/bot', checkAuth('ADMIN'), AnalyticsController.getBotQueryLogs);

export const AnalyticsRoutes = router;
