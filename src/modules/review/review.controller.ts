import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { ReviewService } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
    const reviewerId = req.user?.id as string;
    const result = await ReviewService.createReviewInDB(reviewerId, req.body);
    sendResponse(res, { statusCode: 201, success: true, message: 'Review submitted successfully', data: result });
});

const getUserReviews = catchAsync(async (req: Request, res: Response) => {
    const result = await ReviewService.getUserReviewsFromDB(req.params.userId as string);
    sendResponse(res, { statusCode: 200, success: true, message: 'Reviews retrieved', data: result });
});

export const ReviewController = { createReview, getUserReviews };