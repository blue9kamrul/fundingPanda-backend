import prisma from '../../lib/prisma';
import { TMessage } from './message.interface';

const getConversationHistoryFromDB = async (userId: string, otherUserId: string) => {
    // Find all messages where these two users are the sender/receiver
    return await prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
            ],
        },
        orderBy: { createdAt: 'asc' }, // Oldest first, so the chat reads top-to-bottom
    });
};

// We don't need a createMessage service here because socket.ts handles it!
// But we DO need one for image uploads in the chat.
const uploadChatImageInDB = async (message: TMessage) => {
    return await prisma.message.create({
        data: {
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: message.content ?? null,
            imageUrl: message.imageUrl ?? null,
        },
    });
};

export const MessageService = { getConversationHistoryFromDB, uploadChatImageInDB };