import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Circle, 
  Users, 
  Wifi, 
  WifiOff,
  Clock,
  MessageSquare
} from 'lucide-react';

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
  isTyping?: boolean;
  currentActivity?: string;
}

interface PresenceIndicatorProps {
  users: User[];
  presence: Presence[];
  currentUser: User;
  onUserClick?: (user: User) => void;
  showDetails?: boolean;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  users,
  presence,
  currentUser,
  onUserClick,
  showDetails = true
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (lastSeen: Date) => {
    const timeDiff = currentTime.getTime() - lastSeen.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < 1) return 'text-green-500';
    if (minutesDiff < 5) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getStatusText = (lastSeen: Date) => {
    const timeDiff = currentTime.getTime() - lastSeen.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < 1) return 'Online';
    if (minutesDiff < 5) return 'Recently active';
    if (minutesDiff < 60) return `${Math.floor(minutesDiff)}m ago`;
    
    const hoursDiff = minutesDiff / 60;
    if (hoursDiff < 24) return `${Math.floor(hoursDiff)}h ago`;
    
    const daysDiff = hoursDiff / 24;
    return `${Math.floor(daysDiff)}d ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const onlineUsers = presence.filter(p => {
    const timeDiff = currentTime.getTime() - p.lastSeen.getTime();
    return timeDiff < 5 * 60 * 1000; // 5 minutes
  });

  const offlineUsers = users.filter(user => 
    !onlineUsers.some(p => p.user.id === user.id)
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Online Users */}
        {showDetails && (
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {onlineUsers.length} online
            </span>
            <Badge variant="outline" className="text-xs">
              {users.length} total
            </Badge>
          </div>
        )}

        {/* Online Users Grid */}
        <div className="grid grid-cols-2 gap-2">
          {onlineUsers.map((presenceData) => {
            const user = presenceData.user;
            const isCurrentUser = user.id === currentUser.id;
            
            return (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isCurrentUser ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => onUserClick?.(user)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback 
                              className="text-xs"
                              style={{ backgroundColor: user.color }}
                            >
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <Circle 
                            className={`w-3 h-3 absolute -bottom-1 -right-1 ${getStatusColor(presenceData.lastSeen)}`}
                            fill="currentColor"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium truncate">
                              {user.name}
                            </span>
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          
                          {showDetails && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{getStatusText(presenceData.lastSeen)}</span>
                              {presenceData.isTyping && (
                                <span className="text-blue-500">typing...</span>
                              )}
                            </div>
                          )}
                          
                          {presenceData.currentActivity && showDetails && (
                            <div className="text-xs text-gray-400 truncate">
                              {presenceData.currentActivity}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-sm">
                      Status: {getStatusText(presenceData.lastSeen)}
                    </div>
                    {presenceData.currentActivity && (
                      <div className="text-sm">
                        Activity: {presenceData.currentActivity}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Offline Users (Collapsible) */}
        {offlineUsers.length > 0 && showDetails && (
          <div className="space-y-2">
            <details className="group">
              <summary className="flex items-center space-x-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                <WifiOff className="w-4 h-4" />
                <span>{offlineUsers.length} offline</span>
              </summary>
              
              <div className="mt-2 grid grid-cols-2 gap-2">
                {offlineUsers.map((user) => {
                  const presenceData = presence.find(p => p.user.id === user.id);
                  const lastSeen = presenceData?.lastSeen || new Date(0);
                  
                  return (
                    <Tooltip key={user.id}>
                      <TooltipTrigger asChild>
                        <Card 
                          className="cursor-pointer transition-all hover:shadow-md opacity-60"
                          onClick={() => onUserClick?.(user)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback 
                                    className="text-xs"
                                    style={{ backgroundColor: user.color }}
                                  >
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <Circle 
                                  className={`w-3 h-3 absolute -bottom-1 -right-1 ${getStatusColor(lastSeen)}`}
                                  fill="currentColor"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getStatusText(lastSeen)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm">
                            Last seen: {getStatusText(lastSeen)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {/* Compact View for Small Screens */}
        {!showDetails && (
          <div className="flex items-center space-x-1">
            {onlineUsers.slice(0, 3).map((presenceData) => (
              <Tooltip key={presenceData.user.id}>
                <TooltipTrigger asChild>
                  <Avatar 
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => onUserClick?.(presenceData.user)}
                  >
                    <AvatarImage src={presenceData.user.avatar} />
                    <AvatarFallback 
                      className="text-xs"
                      style={{ backgroundColor: presenceData.user.color }}
                    >
                      {getInitials(presenceData.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <div className="font-medium">{presenceData.user.name}</div>
                    <div className="text-sm text-gray-500">{presenceData.user.email}</div>
                    <div className="text-sm">
                      Status: {getStatusText(presenceData.lastSeen)}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            
            {onlineUsers.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{onlineUsers.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}; 