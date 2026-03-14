import prisma from '../../utils/prisma';
import { TUser } from './user.interface';

const createUserIntoDB = async (payload: TUser) => {
    const result = await prisma.user.create({
        data: payload,
    });
    return result;
};

const getAllUsersFromDB = async () => {
    return await prisma.user.findMany();
};

export const UserService = {
    createUserIntoDB,
    getAllUsersFromDB,
};