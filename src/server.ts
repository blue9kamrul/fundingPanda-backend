import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import 'dotenv/config';
import initializeSocket from './socket/socket'; // We will create this next!

let server: HttpServer;

async function main() {
    try {
        // Wrap Express app in an HTTP server
        server = app.listen(process.env.PORT, () => {
            console.log(`Database connected and Server running on port ${process.env.PORT}`);
        });

        // Initialize Socket.io and attach it to the server
        const io = new SocketIOServer(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow your Next.js frontend
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        // Pass the io instance to our custom socket handler
        initializeSocket(io);

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

main();
