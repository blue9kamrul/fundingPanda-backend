// src/modules/review/review.route.ts
import { Router } from 'express';
import { ReviewController } from './review.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidation } from './review.validation';
import checkAuth from '../../middlewares/checkAuth';

const router = Router();

// Create a review 
router.post(
    '/',
    checkAuth('STUDENT', 'SPONSOR'),
    validateRequest(ReviewValidation.createReviewZodSchema),
    ReviewController.createReview
);

// Get reviews for a specific user (Public so anyone can see a user's reputation)
router.get('/user/:userId', ReviewController.getUserReviews);

export const ReviewRoutes = router;