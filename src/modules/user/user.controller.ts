import { Request, Response } from 'express';
import { UserService } from './user.service';

const createUser = async (req: Request, res: Response) => {
    try {
        const result = await UserService.createUserIntoDB(req.body);
        res.status(200).json({
            success: true,
            message: 'User created successfully',
            data: result,
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message || 'Something went wrong',
        });
    }
};

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await UserService.getAllUsersFromDB();
        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: result,
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message || 'Something went wrong',
        });
    }
};

export const UserController = {
    createUser,
    getAllUsers,
};