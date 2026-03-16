import { z } from 'zod';

const uploadImageZodSchema = z.object({
    body: z.object({
        receiverId: z.string({ message: 'Receiver ID is required to send an image' }),
    }),
});

export const MessageValidation = { uploadImageZodSchema };