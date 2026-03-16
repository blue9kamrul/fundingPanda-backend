import { z } from 'zod';

const createUserZodSchema = z.object({
    body: z.object({
        name: z.string().nonempty({ message: 'Name is required' }),
        email: z.string().email({ message: 'Invalid email address' }),
        role: z.enum(['STUDENT', 'SPONSOR'] as const),
        university: z.string().optional(),
        bio: z.string().optional(),
    }),
});

export const UserValidation = {
    createUserZodSchema,
};