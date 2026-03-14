import { z } from 'zod';

const createUserZodSchema = z.object({
    body: z.object({
        name: z.string({ message: 'Name is required' }),
        email: z.email({ message: 'Invalid email address' }),
        role: z.enum(['STUDENT', 'SPONSOR'], { message: 'Role is required' }),
        university: z.string().optional(),
        bio: z.string().optional(),
    }),
});

export const UserValidation = {
    createUserZodSchema,
};