import { useState, useEffect, useCallback, useRef } from 'react';

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

interface CollaborationMessage {
  type: 'presence' | 'edit' | 'cursor' | 'comment' | 'sync';
  userId: string;
  data: any;
  timestamp: number;
}

interface UseCollaborationProps {
  roomId: string;
  currentUser: User;
  onEdit?: (data: any) => void;
  onComment?: (comment: any) => void;
}

export const useCollaboration = ({
  roomId,
  currentUser,
  onEdit,
  onComment
}: UseCollaborationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  // Generate a unique color for the user
  const generateUserColor = useCallback(() => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    try {
      // In a real app, you'd connect to your WebSocket server
      // For now, we'll simulate the connection
      setIsConnected(true);
      
      // Simulate other users joining
      const mockUsers: User[] = [
        {
          id: 'user1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          color: '#3B82F6'
        },
        {
          id: 'user2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          color: '#EF4444'
        }
      ];
      
      setUsers([currentUser, ...mockUsers]);
      
      // Simulate presence updates
      const mockPresence: Presence[] = mockUsers.map(user => ({
        user,
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        lastSeen: new Date()
      }));
      
      setPresence(mockPresence);
      
      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        sendMessage({
          type: 'presence',
          userId: currentUser.id,
          data: {
            position: { x: Math.random() * 800, y: Math.random() * 600 },
            lastSeen: new Date()
          },
          timestamp: Date.now()
        });
      }, 30000);
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsConnected(false);
    }
  }, [currentUser]);

  // Send message to other users
  const sendMessage = useCallback((message: CollaborationMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
    
    // Simulate message handling
    handleMessage(message);
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: CollaborationMessage) => {
    switch (message.type) {
      case 'presence':
        setPresence(prev => {
          const existing = prev.find(p => p.user.id === message.userId);
          if (existing) {
            return prev.map(p => 
              p.user.id === message.userId 
                ? { ...p, ...message.data, lastSeen: new Date() }
                : p
            );
          } else {
            const user = users.find(u => u.id === message.userId);
            if (user) {
              return [...prev, { user, ...message.data, lastSeen: new Date() }];
            }
            return prev;
          }
        });
        break;
        
      case 'edit':
        onEdit?.(message.data);
        break;
        
      case 'cursor':
        setPresence(prev => 
          prev.map(p => 
            p.user.id === message.userId 
              ? { ...p, selection: message.data.selection }
              : p
          )
        );
        break;
        
      case 'comment':
        setComments(prev => [...prev, message.data]);
        onComment?.(message.data);
        break;
        
      case 'sync':
        // Handle synchronization
        break;
    }
  }, [users, onEdit, onComment]);

  // Send edit operation
  const sendEdit = useCallback((data: any) => {
    sendMessage({
      type: 'edit',
      userId: currentUser.id,
      data,
      timestamp: Date.now()
    });
  }, [currentUser.id, sendMessage]);

  // Send cursor position
  const sendCursor = useCallback((selection: { start: number; end: number }) => {
    sendMessage({
      type: 'cursor',
      userId: currentUser.id,
      data: { selection },
      timestamp: Date.now()
    });
  }, [currentUser.id, sendMessage]);

  // Add comment
  const addComment = useCallback((comment: { text: string; position: { x: number; y: number } }) => {
    const newComment = {
      id: `comment_${Date.now()}`,
      text: comment.text,
      position: comment.position,
      user: currentUser,
      timestamp: new Date(),
      replies: []
    };
    
    sendMessage({
      type: 'comment',
      userId: currentUser.id,
      data: newComment,
      timestamp: Date.now()
    });
  }, [currentUser, sendMessage]);

  // Resolve conflict
  const resolveConflict = useCallback((conflictId: string, resolution: any) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    
    sendMessage({
      type: 'sync',
      userId: currentUser.id,
      data: { conflictId, resolution },
      timestamp: Date.now()
    });
  }, [currentUser.id, sendMessage]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsConnected(false);
  }, []);

  // Auto-reconnect
  const reconnect = useCallback(() => {
    disconnect();
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Initialize connection
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    isConnected,
    users,
    presence,
    comments,
    conflicts,
    
    // Actions
    sendEdit,
    sendCursor,
    addComment,
    resolveConflict,
    reconnect,
    disconnect
  };
}; 