import prisma from '../../lib/prisma';
import { TUpdateProjectStatus, TVerifyUser } from './admin.interface';

const verifyUserInDB = async (userId: string, payload: TVerifyUser) => {
    const result = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: payload.isVerified },
    });
    return result;
};

const changeProjectStatusInDB = async (projectId: string, payload: TUpdateProjectStatus) => {
    const result = await prisma.project.update({
        where: { id: projectId },
        data: { status: payload.status },
    });
    return result;
};

export const AdminService = {
    verifyUserInDB,
    changeProjectStatusInDB,
};