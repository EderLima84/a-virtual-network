import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CityNavigation } from "@/components/CityNavigation";
import { ChatDialog } from "@/components/ChatDialog";
import { MessageSquare, Search, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  recipientId: string;
  recipientName: string;
  recipientUsername: string;
  recipientAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

const Messages = () => {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
      subscribeToMessages();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      // Get all messages involving the current user
      const { data: messages, error } = await supabase
        .from("private_messages")
        .select(`
          *,
          from_profile:profiles!private_messages_from_user_id_fkey(id, display_name, username, avatar_url),
          to_profile:profiles!private_messages_to_user_id_fkey(id, display_name, username, avatar_url)
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((msg) => {
        const isFromMe = msg.from_user_id === user.id;
        const partner = isFromMe ? msg.to_profile : msg.from_profile;
        
        if (!partner) return;

        const existing = conversationMap.get(partner.id);
        const unreadIncrement = !isFromMe && !msg.is_read ? 1 : 0;

        if (!existing) {
          conversationMap.set(partner.id, {
            recipientId: partner.id,
            recipientName: partner.display_name,
            recipientUsername: partner.username,
            recipientAvatar: partner.avatar_url,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            unreadCount: unreadIncrement,
          });
        } else {
          existing.unreadCount += unreadIncrement;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel("messages-page")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const openChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setChatOpen(true);
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.recipientUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <CityNavigation />

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-orkut rounded-full">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mensagens</h1>
            <p className="text-muted-foreground">Suas conversas privadas</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhuma conversa ainda</p>
                <p className="text-sm">
                  Envie uma mensagem para um vizinho ou amigo da varanda
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.recipientId}
                    onClick={() => openChat(conversation)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.recipientAvatar || undefined} />
                        <AvatarFallback className="bg-gradient-orkut text-white">
                          {conversation.recipientName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unreadCount > 0 && (
                        <Circle className="absolute -top-1 -right-1 w-4 h-4 fill-primary text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate">
                          {conversation.recipientName}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="bg-primary text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </main>

      {selectedConversation && (
        <ChatDialog
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          recipientId={selectedConversation.recipientId}
          recipientName={selectedConversation.recipientName}
          recipientAvatar={selectedConversation.recipientAvatar || undefined}
          currentUserId={user.id}
        />
      )}
    </div>
  );
};

export default Messages;