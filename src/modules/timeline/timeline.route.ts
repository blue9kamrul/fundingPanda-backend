import { Router } from 'express';
import { TimelineController } from './timeline.controller';
import checkAuth from '../../middlewares/checkAuth';
import { upload } from '../../middlewares/upload';
import parseFormData from '../../middlewares/parseFormData';

const router = Router();

// Student creates a milestone (supports file uploads)
router.post(
    '/milestone',
    checkAuth('STUDENT'),
    upload.single('media'), // Accept 1 image or video
    parseFormData,
    TimelineController.createMilestone
);

// Anyone can view the timeline
router.get('/:projectId', TimelineController.getProjectTimeline);

export const TimelineRoutes = router;