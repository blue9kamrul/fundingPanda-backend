import prisma from '../../lib/prisma';

type BotAnalyticsMeta = {
    total: number;
    topQueries: Array<{ query: string; count: number }>;
};

type BotAnalyticsResult = {
    data: Array<{ id: string; query: string; createdAt: Date }>;
    meta: BotAnalyticsMeta;
};

const createBotQueryLog = async (query: string) => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
        throw new Error('Query is required');
    }

    return prisma.botAnalytics.create({
        data: {
            query: normalizedQuery.slice(0, 1000),
        },
    });
};

const getBotQueryLogs = async (page = 1, limit = 20): Promise<BotAnalyticsResult> => {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
    const skip = (safePage - 1) * safeLimit;

    const [data, total, grouped] = await Promise.all([
        prisma.botAnalytics.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take: safeLimit,
        }),
        prisma.botAnalytics.count(),
        prisma.botAnalytics.groupBy({
            by: ['query'],
            _count: { query: true },
            orderBy: { _count: { query: 'desc' } },
            take: 10,
        }),
    ]);

    return {
        data,
        meta: {
            total,
            topQueries: grouped.map((item) => ({
                query: item.query,
                count: item._count.query,
            })),
        },
    };
};

export const AnalyticsService = {
    createBotQueryLog,
    getBotQueryLogs,
};
