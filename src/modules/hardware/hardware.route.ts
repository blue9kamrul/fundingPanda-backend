import { Router } from 'express';
import { HardwareController } from './hardware.controller';
import validateRequest from '../../middlewares/validateRequest';
import { HardwareValidation } from './hardware.validation';
import checkAuth from '@/src/middlewares/checkAuth';
import { UserRole } from '@prisma/client';

const router = Router();

router.post(
    '/list-hardware',
    checkAuth(UserRole.SPONSOR),
    validateRequest(HardwareValidation.createHardwareZodSchema),
    HardwareController.createHardware
);

router.get('/', HardwareController.getAllHardware);

export const HardwareRoutes = router;