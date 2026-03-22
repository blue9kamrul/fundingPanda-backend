import prisma from '../../lib/prisma';
import { UserRole } from '@prisma/client';

type TNotificationType =
    | 'MESSAGE'
    | 'DONATION'
    | 'PROJECT_STATUS'
    | 'PROJECT_FEEDBACK'
    | 'MILESTONE'
    | 'ADMIN_PROJECT_SUBMISSION';

export type TNotificationItem = {
    id: string;
    type: TNotificationType;
    title: string;
    description: string;
    createdAt: Date;
    link: string;
    isUnread: boolean;
};

const getMyNotificationsFromDB = async (userId: string, role: string) => {
    const [receivedMessages, donationEvents, myProjects, sponsorMilestones, pendingProjects] = await Promise.all([
        prisma.message.findMany({
            where: { receiverId: userId },
            include: {
                sender: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 40,
        }),
        prisma.donation.findMany({
            where: {
                OR: [
                    { project: { studentId: userId } },
                    { userId },
                ],
            },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 30,
        }),
        prisma.project.findMany({
            where: { studentId: userId },
            select: {
                id: true,
                title: true,
                status: true,
                adminFeedback: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 20,
        }),
        prisma.timelineEvent.findMany({
            where: {
                type: 'MILESTONE',
                project: {
                    donations: {
                        some: { userId },
                    },
                },
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        student: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 30,
        }),
        role === UserRole.ADMIN
            ? prisma.project.findMany({
                where: { status: 'PENDING' },
                include: {
                    student: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 30,
            })
            : Promise.resolve([]),
    ]);

    const notifications: TNotificationItem[] = [];

    for (const msg of receivedMessages) {
        notifications.push({
            id: `msg-${msg.id}`,
            type: 'MESSAGE',
            title: `New message from ${msg.sender.name}`,
            description: msg.content?.trim() || (msg.imageUrl ? 'Sent an image attachment' : 'Sent a message'),
            createdAt: msg.createdAt,
            link: `/dashboard/messages?contact=${msg.sender.id}`,
            isUnread: !msg.isRead,
        });
    }

    for (const donation of donationEvents) {
        const isIncomingForStudent = donation.project && donation.userId !== userId;
        const title = isIncomingForStudent
            ? `${donation.user.name} donated $${donation.amount.toFixed(2)}`
            : `You donated $${donation.amount.toFixed(2)}`;
        const description = isIncomingForStudent
            ? `Project: ${donation.project.title}`
            : `Donation recorded for ${donation.project.title}`;

        notifications.push({
            id: `donation-${donation.id}`,
            type: 'DONATION',
            title,
            description,
            createdAt: donation.createdAt,
            link: `/projects/${donation.project.id}`,
            isUnread: true,
        });
    }

    for (const project of myProjects) {
        if (project.status === 'APPROVED') {
            notifications.push({
                id: `project-status-approved-${project.id}`,
                type: 'PROJECT_STATUS',
                title: 'Project approved by admin',
                description: project.title,
                createdAt: project.updatedAt,
                link: `/projects/${project.id}`,
                isUnread: true,
            });
        }

        if (project.adminFeedback && project.adminFeedback.trim().length > 0) {
            notifications.push({
                id: `project-feedback-${project.id}`,
                type: 'PROJECT_FEEDBACK',
                title: 'Admin feedback added to your project',
                description: `${project.title}: ${project.adminFeedback}`,
                createdAt: project.updatedAt,
                link: `/dashboard/my-projects`,
                isUnread: true,
            });
        }
    }

    for (const event of sponsorMilestones) {
        notifications.push({
            id: `milestone-${event.id}`,
            type: 'MILESTONE',
            title: `New milestone on ${event.project.title}`,
            description: `${event.project.student.name}: ${event.title}`,
            createdAt: event.createdAt,
            link: `/projects/${event.project.id}`,
            isUnread: true,
        });
    }

    if (role === UserRole.ADMIN) {
        for (const project of pendingProjects) {
            notifications.push({
                id: `admin-project-submission-${project.id}`,
                type: 'ADMIN_PROJECT_SUBMISSION',
                title: 'New project submitted for review',
                description: `${project.title} by ${project.student.name}`,
                createdAt: project.createdAt,
                link: `/dashboard/admin`,
                isUnread: true,
            });
        }
    }

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const unreadCount = notifications.filter((item) => item.isUnread).length;

    return {
        unreadCount,
        notifications: notifications.slice(0, 60),
    };
};

const markAllMessageNotificationsReadInDB = async (userId: string) => {
    const result = await prisma.message.updateMany({
        where: {
            receiverId: userId,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });

    return result.count;
};

export const NotificationService = {
    getMyNotificationsFromDB,
    markAllMessageNotificationsReadInDB,
};
