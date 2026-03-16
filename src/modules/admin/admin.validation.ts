import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

const updateProjectStatusZodSchema = z.object({
    body: z.object({
        status: z.nativeEnum(ProjectStatus, {
            message: 'Status is required',
        }),
        feedback: z.string().optional(),
    }),
});

const verifyUserZodSchema = z.object({
    body: z.object({
        isVerified: z.boolean({ message: 'isVerified boolean is required' }),
    }),
});

export const AdminValidation = {
    updateProjectStatusZodSchema,
    verifyUserZodSchema,
};