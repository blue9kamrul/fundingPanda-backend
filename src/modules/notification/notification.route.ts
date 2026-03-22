import { Router } from 'express';
import checkAuth from '../../middlewares/checkAuth';
import { NotificationController } from './notification.controller';

const router = Router();

router.get('/', checkAuth('STUDENT', 'SPONSOR', 'ADMIN'), NotificationController.getMyNotifications);
router.post('/mark-all-read', checkAuth('STUDENT', 'SPONSOR', 'ADMIN'), NotificationController.markAllNotificationsRead);

export const NotificationRoutes = router;
