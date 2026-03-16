import prisma from '../../lib/prisma';
import { TResource } from './resource.interface';
import AppError from '../../errors/AppError';
import { QueryBuilder } from '../../utils/QueryBuilder';

const createResourceIntoDB = async (payload: TResource, lenderId: string) => {
    const { categoryIds, totalCapacity = 1, ...resourceData } = payload;

    // Ensure numeric totalCapacity (default to 1)
    const finalCapacity = typeof totalCapacity === 'number' ? totalCapacity : Number(totalCapacity) || 1;

    const data: any = {
        ...resourceData,
        lenderId,
        // Prisma model uses totalQuantity / availableQuantity
        totalQuantity: finalCapacity,
        availableQuantity: finalCapacity,
    };

    // Connect the categories dynamically
    if (categoryIds && categoryIds.length > 0) {
        data.categories = { connect: categoryIds.map((id) => ({ id })) };
    }

    return await prisma.resource.create({ data, include: { categories: true } });
};

const getAllResourcesFromDB = async (query: Record<string, unknown>) => {
    const resourceQuery = new QueryBuilder(prisma.resource, query, {
        searchableFields: ['name', 'description', 'lender.name'],
        filterableFields: ['type', 'categories.name', 'lenderId']
    })
        .search().filter().sort().paginate().fields()
        .dynamicInclude({
            lender: { select: { name: true, email: true } },
            categories: { select: { name: true } }
        }, ['lender', 'categories']);

    return await resourceQuery.execute();
};

const deleteResourceFromDB = async (id: string, userId: string) => {
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) throw new AppError(404, 'Resource not found');

    if (resource.lenderId !== userId) throw new AppError(403, 'You can only delete your own resources');

    // Enforce Availability Guard: Cannot delete if ANY software license or hardware is rented out
    const available = typeof resource.availableQuantity === 'number' ? resource.availableQuantity : (resource.availableQuantity ?? 0);
    const total = typeof resource.totalQuantity === 'number' ? resource.totalQuantity : (resource.totalQuantity ?? 0);

    if (available < total) {
        throw new AppError(400, 'Cannot delete a resource while students are currently using it');
    }

    return await prisma.resource.delete({ where: { id } });
};

const claimResourceInDB = async (resourceId: string, studentId: string) => {
    // 1. We must use a database transaction to prevent race conditions
    return await prisma.$transaction(async (tx) => {
        // 2. Fetch the resource and lock it for this transaction
        const resource = await tx.resource.findUnique({
            where: { id: resourceId },
        });

        if (!resource) throw new AppError(404, 'Resource not found');
        const available = typeof resource.availableQuantity === 'number' ? resource.availableQuantity : (resource.availableQuantity ?? 0);
        if (available <= 0) {
            throw new AppError(400, 'This resource is completely out of stock/capacity.');
        }

        // 3. Create the claim record
        const claim = await tx.resourceClaim.create({
            data: {
                studentId,
                resourceId,
            },
        });

        // 4. Decrement the available capacity
        await tx.resource.update({
            where: { id: resourceId },
            data: { availableQuantity: { decrement: 1 } },
        });

        return claim;
    });
};

const getMyClaimsFromDB = async (studentId: string) => {
    return await prisma.resourceClaim.findMany({
        where: { studentId },
        include: {
            resource: {
                include: { lender: { select: { name: true, email: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};
// Export it in ResourceService

export const ResourceService = {
    createResourceIntoDB,
    getAllResourcesFromDB,
    deleteResourceFromDB,
    claimResourceInDB,
    getMyClaimsFromDB

};