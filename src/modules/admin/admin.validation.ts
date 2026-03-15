import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

const updateProjectStatusZodSchema = z.object({
    status: z.nativeEnum(ProjectStatus, {
        message: 'Status is required',
    }),
});

const verifyUserZodSchema = z.object({
    isVerified: z.boolean({ message: 'isVerified boolean is required' }),
});

export const AdminValidation = {
    updateProjectStatusZodSchema,
    verifyUserZodSchema,
};