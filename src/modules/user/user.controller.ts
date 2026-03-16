import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { UserService } from './user.service';



const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.getAllUsersFromDB();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Users retrieved successfully',
        data: result,
    });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await UserService.getMyProfileFromDB(userId);

    sendResponse(res, { statusCode: 200, success: true, message: 'Profile retrieved successfully', data: result });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await UserService.updateMyProfileInDB(userId, req.body);

    sendResponse(res, { statusCode: 200, success: true, message: 'Profile updated successfully', data: result });
});

export const UserController = {

    getAllUsers,
    getMyProfile,
    updateMyProfile
};