import prisma from '../../lib/prisma';
import { THardware } from './hardware.interface';
import { QueryBuilder } from '../../utils/QueryBuilder';

const createHardwareIntoDB = async (payload: THardware) => {
    return await prisma.hardware.create({ data: payload });
};

const getAllHardwareFromDB = async (query: Record<string, unknown>) => {
    const hardwareQuery = new QueryBuilder(
        prisma.hardware,
        query,
        {
            searchableFields: ['name', 'category', 'description', 'lender.name'],
            filterableFields: ['category', 'isAvailable', 'lenderId']
        }
    )
        .search()
        .filter()
        .sort()
        .paginate()
        .fields()
        .dynamicInclude(
            { lender: { select: { name: true, email: true, bio: true } } },
            ['lender']
        );

    return await hardwareQuery.execute();
};

export const HardwareService = {
    createHardwareIntoDB,
    getAllHardwareFromDB,
};