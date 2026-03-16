import { Server, Socket } from 'socket.io';
import prisma from '../lib/prisma';
import { auth } from '../lib/auth';

type TSendMessagePayload = {
    receiverId: string;
    content?: string;
    imageUrl?: string;
};

const initializeSocket = (io: Server) => {
    io.use(async (socket, next) => {
        try {
            const headersInit: Record<string, string> = {};
            for (const [key, value] of Object.entries(socket.handshake.headers)) {
                if (typeof value === 'string') headersInit[key] = value;
                else if (Array.isArray(value)) headersInit[key] = value.join(',');
                else if (value !== undefined) headersInit[key] = String(value);
            }

            const session = await auth.api.getSession({ headers: headersInit });
            if (!session?.user?.id) {
                return next(new Error('Unauthorized socket connection'));
            }

            socket.data.user = {
                id: session.user.id,
                role: session.user.role,
            };

            return next();
        } catch {
            return next(new Error('Unauthorized socket connection'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.user?.id as string;
        socket.join(userId);
        console.log(`A user connected: ${socket.id} (user: ${userId})`);

        // Keep event for frontend compatibility, but enforce authenticated room binding.
        socket.on('join_own_room', () => {
            socket.join(userId);
            console.log(`User ${userId} joined their personal room.`);
        });

        socket.on('send_message', async (data: TSendMessagePayload) => {
            try {
                if (!data?.receiverId) {
                    return;
                }

                const savedMessage = await prisma.message.create({
                    data: {
                        senderId: userId,
                        receiverId: data.receiverId,
                        content: data.content,
                        imageUrl: data.imageUrl,
                    },
                });

                io.to(data.receiverId).emit('receive_message', savedMessage);
                io.to(userId).emit('receive_message', savedMessage);

            } catch (error) {
                console.error('Error saving/sending message:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

export default initializeSocket;