import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Types for event payloads (should match backend)
export type PageUpdatePayload = { pageId: string; components: any[]; userId: string };
export type CursorMovePayload = { pageId: string; userId: string; x: number; y: number };
export type CommentAddPayload = { pageId: string; userId: string; comment: string; timestamp: number };

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

interface Presence {
  user: User;
  position: { x: number; y: number };
  selection?: { start: number; end: number };
  lastSeen: Date;
}

interface UseCollaborationProps {
  roomId: string;
  currentUser: User;
  jwt: string;
  onPageUpdate?: (data: PageUpdatePayload) => void;
  onCursorMove?: (data: CursorMovePayload) => void;
  onCommentAdd?: (data: CommentAddPayload) => void;
}

export const useCollaboration = ({
  roomId,
  currentUser,
  jwt,
  onPageUpdate,
  onCursorMove,
  onCommentAdd
}: UseCollaborationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [comments, setComments] = useState<CommentAddPayload[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('/collaboration', {
      auth: { token: jwt },
      transports: ['websocket'],
      autoConnect: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_page', roomId);
    });
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for events
    socket.on('page_update', (data: PageUpdatePayload) => {
      onPageUpdate?.(data);
    });
    socket.on('cursor_move', (data: CursorMovePayload) => {
      onCursorMove?.(data);
    });
    socket.on('comment_add', (data: CommentAddPayload) => {
      setComments(prev => [...prev, data]);
      onCommentAdd?.(data);
    });

    // Clean up on unmount
    return () => {
      socket.emit('leave_page', roomId);
      socket.disconnect();
    };
  }, [roomId, jwt, onPageUpdate, onCursorMove, onCommentAdd]);

  // Emit events
  const sendPageUpdate = useCallback((components: any[]) => {
    socketRef.current?.emit('page_update', {
      pageId: roomId,
      components,
      userId: currentUser.id
    } as PageUpdatePayload);
  }, [roomId, currentUser.id]);

  // Debounce/throttle cursor move
  const cursorMoveTimeout = useRef<NodeJS.Timeout | null>(null);
  const sendCursorMove = useCallback((x: number, y: number) => {
    if (cursorMoveTimeout.current) clearTimeout(cursorMoveTimeout.current);
    cursorMoveTimeout.current = setTimeout(() => {
      socketRef.current?.emit('cursor_move', {
        pageId: roomId,
        userId: currentUser.id,
        x,
        y
      } as CursorMovePayload);
    }, 50); // 20fps max
  }, [roomId, currentUser.id]);

  const sendComment = useCallback((comment: string) => {
    socketRef.current?.emit('comment_add', {
      pageId: roomId,
      userId: currentUser.id,
      comment,
      timestamp: Date.now()
    } as CommentAddPayload);
  }, [roomId, currentUser.id]);

  return {
    isConnected,
    presence,
    comments,
    sendPageUpdate,
    sendCursorMove,
    sendComment
  };
}; 