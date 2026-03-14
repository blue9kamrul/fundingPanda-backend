import { z } from 'zod';

const createUserZodSchema = z.object({
    name: z.string().nonempty({ message: 'Name is required' }),
    email: z.email({ message: 'Invalid email address' }),
    role: z.enum(['STUDENT', 'SPONSOR']),
    university: z.string().optional(),
    bio: z.string().optional(),
});

export const UserValidation = {
    createUserZodSchema,
};