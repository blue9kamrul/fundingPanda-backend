import prisma from '../../lib/prisma';
import AppError from '../../errors/AppError';
import { TMilestone } from './timeline.interface';

const createMilestoneInDB = async (
    userId: string,
    payload: TMilestone,
    mediaUrl: string | null
) => {
    // Verify the student actually owns this project
    const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
    if (!project) throw new AppError(404, 'Project not found');
    if (project.studentId !== userId) throw new AppError(403, 'You can only add milestones to your own projects');

    return await prisma.timelineEvent.create({
        data: {
            projectId: payload.projectId,
            type: 'MILESTONE',
            title: payload.title,
            description: payload.description,
            mediaUrl, // The Cloudinary URL
        },
    });
};

const getProjectTimelineFromDB = async (projectId: string) => {
    return await prisma.timelineEvent.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }, // Newest events first
    });
};

export const TimelineService = { createMilestoneInDB, getProjectTimelineFromDB };