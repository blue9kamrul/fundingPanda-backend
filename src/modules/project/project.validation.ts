import { z } from 'zod';

const createProjectZodSchema = z.object({
    body: z.object({
        title: z.string().nonempty({ message: 'Title is required' }),
        description: z.string().nonempty({ message: 'Description is required' }),
        goalAmount: z.coerce.number().positive({ message: 'Goal amount must be positive' }),
    }),
});

export const ProjectValidation = {
    createProjectZodSchema,
};