import app from './app';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Socket.IO setup
import { setupCollaborationSocket } from './sockets/collaboration.socket';
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupCollaborationSocket(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 