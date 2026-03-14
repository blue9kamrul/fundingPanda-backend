import { z } from 'zod';

const createProjectZodSchema = z.object({
    title: z.string().nonempty({ message: 'Title is required' }),
    description: z.string().nonempty({ message: 'Description is required' }),
    goalAmount: z.number().positive({ message: 'Goal amount must be positive' }),
    studentId: z.string().nonempty({ message: 'Student ID is required' }), // Note: Later, this will come from the Auth token, not the body!
});

export const ProjectValidation = {
    createProjectZodSchema,
};