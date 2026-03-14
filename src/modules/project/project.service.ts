import prisma from '../../utils/prisma';
import { TProject } from './project.interface';

const createProjectIntoDB = async (payload: TProject) => {
    const result = await prisma.project.create({
        data: payload,
    });
    return result;
};

const getAllProjectsFromDB = async () => {
    // We include the student details so the frontend can display who created it
    return await prisma.project.findMany({
        include: {
            student: {
                select: { name: true, email: true, university: true },
            },
        },
    });
};

export const ProjectService = {
    createProjectIntoDB,
    getAllProjectsFromDB,
};