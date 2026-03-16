import { Server, Socket } from 'socket.io';
import prisma from '../lib/prisma';

const initializeSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`A user connected: ${socket.id}`);

        // 1. User joins their personal room to receive messages
        socket.on('join_own_room', (userId: string) => {
            socket.join(userId);
            console.log(`User ${userId} joined their personal room.`);
        });

        // 2. Listen for a new message being sent
        socket.on('send_message', async (data: { senderId: string; receiverId: string; content?: string; imageUrl?: string }) => {
            try {
                // Save the message to the database first!
                const savedMessage = await prisma.message.create({
                    data: {
                        senderId: data.senderId,
                        receiverId: data.receiverId,
                        content: data.content,
                        imageUrl: data.imageUrl,
                    },
                });

                // Emit the message to the RECEIVER'S personal room so it pops up instantly
                io.to(data.receiverId).emit('receive_message', savedMessage);

                // Also emit it back to the SENDER so their own UI updates instantly
                io.to(data.senderId).emit('receive_message', savedMessage);

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