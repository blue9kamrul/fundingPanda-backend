import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

const validateRequest = (schema: ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (err) {
            next(err);
        }
    };
};

export default validateRequest;