import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  MessageSquare, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { PresenceIndicator } from './presence-indicator';
import { useCollaboration } from '@/hooks/use-collaboration';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

interface CollaborativeEditorProps {
  roomId: string;
  currentUser: User;
  initialContent?: string;
  onSave?: (content: string) => void;
  title?: string;
}

interface CursorPosition {
  userId: string;
  userName: string;
  userColor: string;
  position: number;
  selection?: { start: number; end: number };
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  roomId,
  currentUser,
  initialContent = '',
  onSave,
  title = 'Collaborative Editor'
}) => {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const {
    isConnected,
    users,
    presence,
    sendEdit,
    sendCursor,
    addComment,
    resolveConflict,
    reconnect
  } = useCollaboration({
    roomId,
    currentUser,
    onEdit: handleRemoteEdit,
    onComment: handleRemoteComment
  });

  function handleRemoteEdit(data: any) {
    // Handle remote edits with conflict resolution
    if (data.userId !== currentUser.id) {
      const { newContent, timestamp } = data;
      
      // Simple conflict resolution - in a real app, you'd use operational transforms
      if (timestamp > Date.now() - 5000) { // Only apply recent edits
        setContent(newContent);
      } else {
        // Add to conflicts for manual resolution
        setConflicts(prev => [...prev, {
          id: `conflict_${Date.now()}`,
          type: 'content',
          data,
          timestamp: new Date()
        }]);
      }
    }
  }

  function handleRemoteComment(comment: any) {
    setComments(prev => [...prev, comment]);
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Send edit to other users
    sendEdit({
      newContent,
      timestamp: Date.now()
    });

    // Handle typing indicator
    setIsTyping(true);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  const handleCursorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPosition = e.target.selectionStart;
    const newSelection = e.target.selectionStart !== e.target.selectionEnd ? {
      start: e.target.selectionStart,
      end: e.target.selectionEnd
    } : null;

    setCursorPosition(newPosition);
    setSelection(newSelection);

    // Send cursor position to other users
    sendCursor({
      position: newPosition,
      selection: newSelection
    });
  };

  const handleSave = () => {
    onSave?.(content);
  };

  const handleAddComment = () => {
    const commentText = prompt('Enter your comment:');
    if (commentText) {
      addComment({
        text: commentText,
        position: { x: 0, y: 0 } // In a real app, you'd get the actual position
      });
    }
  };

  const handleResolveConflict = (conflictId: string) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (conflict) {
      const resolution = prompt('How would you like to resolve this conflict? (local/remote)');
      if (resolution === 'remote') {
        setContent(conflict.data.newContent);
      }
      resolveConflict(conflictId, { resolution });
    }
  };

  const renderCursor = (user: User, position: number, selection?: { start: number; end: number }) => {
    if (user.id === currentUser.id) return null;

    return (
      <div
        key={user.id}
        ref={(el) => {
          if (el) cursorRefs.current.set(user.id, el);
        }}
        className="absolute pointer-events-none z-10"
        style={{
          left: `${position * 8}px`, // Approximate character width
          top: '0px',
          height: '100%'
        }}
      >
        <div
          className="w-0.5 h-full"
          style={{ backgroundColor: user.color }}
        />
        <div
          className="absolute -top-6 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
          style={{ backgroundColor: user.color }}
        >
          {user.name}
        </div>
        {selection && (
          <div
            className="absolute opacity-20"
            style={{
              left: `${selection.start * 8}px`,
              width: `${(selection.end - selection.start) * 8}px`,
              height: '100%',
              backgroundColor: user.color
            }}
          />
        )}
      </div>
    );
  };

  const renderComments = () => (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: comment.user.color }}
            />
            <span className="text-sm font-medium">{comment.user.name}</span>
            <span className="text-xs text-gray-500">
              {comment.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm">{comment.text}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-4 gap-6 h-full">
      {/* Main Editor */}
      <div className="col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
                {!isConnected && (
                  <Button variant="outline" size="sm" onClick={reconnect}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reconnect
                  </Button>
                )}
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onSelect={handleCursorChange}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Start typing to collaborate in real-time..."
              />
              
              {/* Remote cursors */}
              {presence.map((presenceData) => 
                renderCursor(
                  presenceData.user,
                  presenceData.position.x,
                  presenceData.selection
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>Conflicts ({conflicts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Content conflict detected</div>
                      <div className="text-xs text-gray-500">
                        {conflict.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveConflict(conflict.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        {showComments && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Comments ({comments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length > 0 ? (
                renderComments()
              ) : (
                <p className="text-gray-500 text-sm">No comments yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Presence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Collaborators</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PresenceIndicator
              users={users}
              presence={presence}
              currentUser={currentUser}
              showDetails={true}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleAddComment}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Comment
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowComments(!showComments)}
            >
              {showComments ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Hide Comments
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Show Comments
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Users online</span>
              <Badge variant="outline">{users.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Characters</span>
              <Badge variant="outline">{content.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 