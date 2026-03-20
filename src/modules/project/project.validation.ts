import { z } from 'zod';

const createProjectZodSchema = z.object({
    body: z.object({
        title: z.string().nonempty({ message: 'Title is required' }),
        description: z.string().nonempty({ message: 'Description is required' }),
        goalAmount: z.coerce.number().positive({ message: 'Goal amount must be positive' }),
        categories: z.array(z.string().uuid({ message: 'Each category ID must be a valid UUID' })).optional(),
        status: z.enum(['DRAFT', 'PENDING']).optional(),
    }),
});

const updateProjectZodSchema = z.object({
    body: z.object({
        title: z.string().nonempty({ message: 'Title is required' }).optional(),
        description: z.string().nonempty({ message: 'Description is required' }).optional(),
        goalAmount: z.coerce.number().positive({ message: 'Goal amount must be positive' }).optional(),
        categories: z.array(z.string().uuid({ message: 'Each category ID must be a valid UUID' })).optional(),
        status: z.enum(['DRAFT', 'PENDING']).optional(),
    }),
});

export const ProjectValidation = {
    createProjectZodSchema,
    updateProjectZodSchema,
};