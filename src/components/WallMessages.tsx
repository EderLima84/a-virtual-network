import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type WallMessage = Tables<'wall_messages'> & {
  sender: Tables<'profiles'>;
};

interface WallMessagesProps {
  userId: string;
  isOwner: boolean;
}

export const WallMessages = ({ userId, isOwner }: WallMessagesProps) => {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('wall_messages')
        .select(`
          *,
          sender:from_user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('to_user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMessages(data as any || []);
    } catch (error) {
      console.error('Erro ao buscar recados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('wall_messages').insert({
        from_user_id: user.id,
        to_user_id: userId,
        message: newMessage.trim(),
        is_public: true
      });

      if (error) throw error;

      toast.success('Recado enviado! 💌');
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar recado:', error);
      toast.error('Não foi possível enviar o recado');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('wall_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Recado removido');
      fetchMessages();
    } catch (error) {
      console.error('Erro ao deletar recado:', error);
      toast.error('Não foi possível remover o recado');
    }
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Recados no Muro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form to send message */}
        {!isOwner && (
          <div className="space-y-2">
            <Textarea
              placeholder="Deixe um recado na varanda..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={500}
              className="min-h-[80px]"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newMessage.length}/500 caracteres
              </span>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="bg-gradient-orkut"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Enviando...' : 'Enviar Recado'}
              </Button>
            </div>
          </div>
        )}

        {/* Messages list */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Carregando recados...
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isOwner ? 'Ninguém deixou recados ainda' : 'Seja o primeiro a deixar um recado!'}
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-orkut flex items-center justify-center text-white text-sm font-bold">
                      {msg.sender.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{msg.sender.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{msg.sender.username}
                      </p>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
