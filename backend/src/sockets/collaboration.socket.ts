import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Types for event payloads
export type PageUpdatePayload = { pageId: string; components: any[]; userId: string };
export type CursorMovePayload = { pageId: string; userId: string; x: number; y: number };
export type CommentAddPayload = { pageId: string; userId: string; comment: string; timestamp: number };

export function setupCollaborationSocket(io: Server) {
  const nsp = io.of('/collaboration');

  nsp.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      (socket as any).user = payload;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  nsp.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User ${user.id} connected to collaboration namespace`);

    // Page update event
    socket.on('page_update', (data: PageUpdatePayload) => {
      // Validate data here
      nsp.to(data.pageId).emit('page_update', { ...data, userId: user.id });
    });

    // Cursor move event (debounced on client)
    socket.on('cursor_move', (data: CursorMovePayload) => {
      nsp.to(data.pageId).emit('cursor_move', { ...data, userId: user.id });
    });

    // Comment add event
    socket.on('comment_add', (data: CommentAddPayload) => {
      // Validate and sanitize comment
      nsp.to(data.pageId).emit('comment_add', { ...data, userId: user.id, timestamp: Date.now() });
    });

    // Join page room
    socket.on('join_page', (pageId: string) => {
      socket.join(pageId);
    });

    // Leave page room
    socket.on('leave_page', (pageId: string) => {
      socket.leave(pageId);
    });

    socket.on('disconnect', (reason) => {
      console.log(`User ${user.id} disconnected: ${reason}`);
    });
  });
} 