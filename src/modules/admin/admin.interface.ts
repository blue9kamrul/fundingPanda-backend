import { ProjectStatus } from '@prisma/client';

export type TUpdateProjectStatus = {
    status: ProjectStatus;
};

export type TVerifyUser = {
    isVerified: boolean;
};