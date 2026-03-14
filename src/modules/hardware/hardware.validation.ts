import { z } from 'zod';

const createHardwareZodSchema = z.object({
    name: z.string().nonempty({ message: 'Hardware name is required' }),
    category: z.string().nonempty({ message: 'Category is required (e.g., GPU, Sensor)' }),
    description: z.string().nonempty({ message: 'Description is required' }),
});

export const HardwareValidation = {
    createHardwareZodSchema,
};