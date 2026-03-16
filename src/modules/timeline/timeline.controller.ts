import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { TimelineService } from './timeline.service';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { TMilestone } from './timeline.interface';

const createMilestone = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    let mediaUrl = null;

    // Handle optional image/video upload from Multer
    if (req.file) {
        // We use 'auto' so Cloudinary figures out if it's an image or video
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'timeline-media', 'auto');
        mediaUrl = uploadResult.secure_url;
    }

    const payload = req.body as TMilestone;
    const result = await TimelineService.createMilestoneInDB(userId, payload, mediaUrl);

    sendResponse(res, { statusCode: 201, success: true, message: 'Milestone added to timeline', data: result });
});

const getProjectTimeline = catchAsync(async (req: Request, res: Response) => {
    const result = await TimelineService.getProjectTimelineFromDB(req.params.projectId as string);
    sendResponse(res, { statusCode: 200, success: true, message: 'Timeline retrieved', data: result });
});

export const TimelineController = { createMilestone, getProjectTimeline };