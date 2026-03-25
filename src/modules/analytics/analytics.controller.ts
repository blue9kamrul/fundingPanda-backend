import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AnalyticsService } from './analytics.service';

const createBotQueryLog = catchAsync(async (req: Request, res: Response) => {
    const query = typeof req.body?.query === 'string' ? req.body.query : '';
    const result = await AnalyticsService.createBotQueryLog(query);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Bot query logged successfully',
        data: result,
    });
});

const getBotQueryLogs = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const result = await AnalyticsService.getBotQueryLogs(page, limit);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Bot analytics fetched successfully',
        data: result.data,
        meta: result.meta,
    });
});

export const AnalyticsController = {
    createBotQueryLog,
    getBotQueryLogs,
};
