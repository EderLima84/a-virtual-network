import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Coffee, Flower2, Heart, Sparkles, Sun, Music } from 'lucide-react';

interface Gift {
  type: string;
  icon: React.ElementType;
  label: string;
  emoji: string;
  color: string;
}

const availableGifts: Gift[] = [
  { type: 'coffee', icon: Coffee, label: 'Café', emoji: '☕', color: 'text-amber-600' },
  { type: 'flowers', icon: Flower2, label: 'Flores', emoji: '🌸', color: 'text-pink-500' },
  { type: 'heart', icon: Heart, label: 'Coração', emoji: '❤️', color: 'text-red-500' },
  { type: 'sparkle', icon: Sparkles, label: 'Brilho', emoji: '✨', color: 'text-yellow-500' },
  { type: 'sun', icon: Sun, label: 'Sol', emoji: '☀️', color: 'text-orange-500' },
  { type: 'music', icon: Music, label: 'Música', emoji: '🎵', color: 'text-purple-500' },
];

interface GiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

export const GiftDialog = ({ isOpen, onClose, recipientId, recipientName }: GiftDialogProps) => {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error('Escolha um presente primeiro!');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('gifts').insert({
        from_user_id: user.id,
        to_user_id: recipientId,
        gift_type: selectedGift,
        message: message || null
      });

      if (error) throw error;

      const gift = availableGifts.find(g => g.type === selectedGift);
      toast.success(`${gift?.emoji} Presente enviado para ${recipientName}!`);
      onClose();
      setSelectedGift(null);
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar presente:', error);
      toast.error('Não foi possível enviar o presente');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Presente Digital</DialogTitle>
          <DialogDescription>
            Escolha um presente para alegrar o dia de {recipientName}!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {availableGifts.map((gift) => {
              const Icon = gift.icon;
              return (
                <button
                  key={gift.type}
                  onClick={() => setSelectedGift(gift.type)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedGift === gift.type
                      ? 'border-primary bg-primary/10 shadow-glow'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">{gift.emoji}</span>
                    <Icon className={`w-5 h-5 ${gift.color}`} />
                    <span className="text-xs font-medium">{gift.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Mensagem (opcional)
            </label>
            <Textarea
              placeholder="Escreva uma mensagem carinhosa..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/200 caracteres
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendGift}
              disabled={!selectedGift || sending}
              className="bg-gradient-orkut"
            >
              {sending ? 'Enviando...' : 'Enviar Presente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
