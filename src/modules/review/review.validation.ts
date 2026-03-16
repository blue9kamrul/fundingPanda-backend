import { z } from 'zod';

const createReviewZodSchema = z.object({
    body: z.object({
        projectId: z.string({ message: 'Project ID is required' }),
        revieweeId: z.string({ message: 'Reviewee ID is required' }),
        rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
        comment: z.string().optional(),
    }),
});

export const ReviewValidation = { createReviewZodSchema };