import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { HardwareService } from './hardware.service';

const createHardware = catchAsync(async (req: Request, res: Response) => {
    const lenderId = req.user?.id;

    const hardwareData = {
        ...req.body,
        lenderId,
    };

    const result = await HardwareService.createHardwareIntoDB(hardwareData);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Hardware listed successfully',
        data: result,
    });
});


// Update the getAllHardware function
const getAllHardware = catchAsync(async (req: Request, res: Response) => {
    const result = await HardwareService.getAllHardwareFromDB(req.query); // Pass req.query

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Available hardware retrieved successfully',
        meta: result.meta, // Add pagination meta
        data: result.data,
    });
});

export const HardwareController = {
    createHardware,
    getAllHardware,
};