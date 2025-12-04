import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, UserPlus, Gift, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'gift';
  title: string;
  description: string;
  created_at: string;
  from_user_id: string;
  from_user_name?: string;
  is_read: boolean;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    loadNotifications();
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('notifications-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `to_user_id=eq.${user.id}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', newMessage.from_user_id)
            .single();
          
          const notification: Notification = {
            id: `msg-${newMessage.id}`,
            type: 'message',
            title: 'Nova mensagem',
            description: `${profile?.display_name || 'Alguém'} te enviou uma mensagem`,
            created_at: newMessage.created_at,
            from_user_id: newMessage.from_user_id,
            from_user_name: profile?.display_name,
            is_read: false
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to new friend requests
    const requestsChannel = supabase
      .channel('notifications-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          const newRequest = payload.new as any;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', newRequest.sender_id)
            .single();
          
          const notification: Notification = {
            id: `req-${newRequest.id}`,
            type: 'friend_request',
            title: 'Novo convite de convivência',
            description: `${profile?.display_name || 'Alguém'} acenou para você!`,
            created_at: newRequest.created_at,
            from_user_id: newRequest.sender_id,
            from_user_name: profile?.display_name,
            is_read: false
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to new gifts
    const giftsChannel = supabase
      .channel('notifications-gifts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gifts',
          filter: `to_user_id=eq.${user.id}`
        },
        async (payload) => {
          const newGift = payload.new as any;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', newGift.from_user_id)
            .single();
          
          const notification: Notification = {
            id: `gift-${newGift.id}`,
            type: 'gift',
            title: 'Novo presente',
            description: `${profile?.display_name || 'Alguém'} te enviou um presente!`,
            created_at: newGift.created_at,
            from_user_id: newGift.from_user_id,
            from_user_name: profile?.display_name,
            is_read: false
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(giftsChannel);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    // Load unread messages count
    const { count: messagesCount } = await supabase
      .from('private_messages')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', user.id)
      .eq('is_read', false);

    // Load pending friend requests count
    const { count: requestsCount } = await supabase
      .from('friend_requests')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    // Load recent gifts (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: recentGifts } = await supabase
      .from('gifts')
      .select('*, profiles!gifts_from_user_id_fkey(display_name)')
      .eq('to_user_id', user.id)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // Load recent messages
    const { data: recentMessages } = await supabase
      .from('private_messages')
      .select('*, profiles!private_messages_from_user_id_fkey(display_name)')
      .eq('to_user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    // Load pending requests
    const { data: pendingRequests } = await supabase
      .from('friend_requests')
      .select('*, profiles!friend_requests_sender_id_fkey(display_name)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    const allNotifications: Notification[] = [];

    recentMessages?.forEach(msg => {
      allNotifications.push({
        id: `msg-${msg.id}`,
        type: 'message',
        title: 'Nova mensagem',
        description: `${(msg.profiles as any)?.display_name || 'Alguém'} te enviou uma mensagem`,
        created_at: msg.created_at,
        from_user_id: msg.from_user_id,
        from_user_name: (msg.profiles as any)?.display_name,
        is_read: msg.is_read
      });
    });

    pendingRequests?.forEach(req => {
      allNotifications.push({
        id: `req-${req.id}`,
        type: 'friend_request',
        title: 'Convite de convivência',
        description: `${(req.profiles as any)?.display_name || 'Alguém'} acenou para você!`,
        created_at: req.created_at,
        from_user_id: req.sender_id,
        from_user_name: (req.profiles as any)?.display_name,
        is_read: false
      });
    });

    recentGifts?.forEach(gift => {
      allNotifications.push({
        id: `gift-${gift.id}`,
        type: 'gift',
        title: 'Presente recebido',
        description: `${(gift.profiles as any)?.display_name || 'Alguém'} te enviou um presente!`,
        created_at: gift.created_at,
        from_user_id: gift.from_user_id,
        from_user_name: (gift.profiles as any)?.display_name,
        is_read: false
      });
    });

    // Sort by date
    allNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setNotifications(allNotifications);
    setUnreadCount((messagesCount || 0) + (requestsCount || 0));
  };

  const handleNotificationClick = (notification: Notification) => {
    setOpen(false);
    
    if (notification.type === 'friend_request') {
      navigate('/explore');
    } else if (notification.type === 'message') {
      // Could navigate to chat with the user
      navigate('/dashboard');
    } else if (notification.type === 'gift') {
      navigate('/dashboard');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('to_user_id', user.id)
      .eq('is_read', false);
    
    setUnreadCount(0);
    loadNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'gift':
        return <Gift className="w-4 h-4 text-pink-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs gap-1"
            >
              <Check className="w-3 h-3" />
              Marcar como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true,
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}