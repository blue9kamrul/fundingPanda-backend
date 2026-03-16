import { z } from 'zod';

const createDonationZodSchema = z.object({
    body: z.object({
        amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
        projectId: z.string().nonempty({ message: 'Project ID is required' }),
    }),
});

export const DonationValidation = {
    createDonationZodSchema,
};