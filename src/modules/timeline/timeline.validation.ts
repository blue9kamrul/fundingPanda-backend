import { z } from 'zod';

const createMilestoneZodSchema = z.object({
    body: z.object({
        projectId: z.string({ message: 'Project ID is required' }),
        title: z.string({ message: 'Milestone title is required' }),
        description: z.string().optional(),
    }),
});

export const TimelineValidation = { createMilestoneZodSchema };