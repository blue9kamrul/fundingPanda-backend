import prisma from '../../lib/prisma';
import AppError from '../../errors/AppError';
import { TReview } from './review.interface';

const createReviewInDB = async (reviewerId: string, payload: TReview) => {
    if (reviewerId === payload.revieweeId) {
        throw new AppError(400, 'You cannot review yourself.');
    }

    // 1. Verify the project exists and is completed
    const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
    if (!project) throw new AppError(404, 'Project not found');
    if (project.status !== 'COMPLETED') {
        throw new AppError(400, 'You can only leave a review after the project is marked as COMPLETED.');
    }

    // 2. Ensure they haven't already left a review for this project
    const existingReview = await prisma.review.findUnique({
        where: {
            reviewerId_projectId: {
                reviewerId,
                projectId: payload.projectId,
            },
        },
    });

    if (existingReview) {
        throw new AppError(409, 'You have already submitted a review for this project.');
    }

    // 3. Create the review
    return await prisma.review.create({
        data: {
            ...payload,
            reviewerId,
        },
        include: {
            reviewer: { select: { name: true, role: true } },
        },
    });
};

const getUserReviewsFromDB = async (userId: string) => {
    // Fetch all reviews RECEIVED by this user
    const reviews = await prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
            reviewer: { select: { name: true, role: true } },
            project: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return { averageRating, totalReviews: reviews.length, reviews };
};

export const ReviewService = { createReviewInDB, getUserReviewsFromDB };