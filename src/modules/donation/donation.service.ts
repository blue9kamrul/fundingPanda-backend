import prisma from '../../lib/prisma';
import { TDonation } from './donation.interface';
import { QueryBuilder } from '../../utils/QueryBuilder';

const createDonationIntoDB = async (payload: TDonation) => {
    const [donation, updatedProject] = await prisma.$transaction([
        prisma.donation.create({ data: payload }),
        prisma.project.update({
            where: { id: payload.projectId },
            data: { raisedAmount: { increment: payload.amount } },
        }),
    ]);
    return { donation, updatedProject };
};

const getAllDonationsFromDB = async (query: Record<string, unknown>) => {
    const donationQuery = new QueryBuilder(
        prisma.donation,
        query,
        {
            searchableFields: ['user.name', 'project.title'],
            filterableFields: ['amount', 'projectId', 'userId']
        }
    )
        .search()
        .filter()
        .sort()
        .paginate()
        .fields()
        .dynamicInclude(
            {
                user: { select: { name: true, email: true } },
                project: { select: { title: true, goalAmount: true, raisedAmount: true } }
            },
            ['user', 'project']
        );

    return await donationQuery.execute();
};

export const DonationService = {
    createDonationIntoDB,
    getAllDonationsFromDB,
};