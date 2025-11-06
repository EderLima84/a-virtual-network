import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Heart, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AffinityScoreProps {
  userId: string;
  currentUserId: string;
}

export const AffinityScore = ({ userId, currentUserId }: AffinityScoreProps) => {
  const [affinity, setAffinity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateAffinity = async () => {
      try {
        const { data, error } = await supabase.rpc('calculate_affinity', {
          user1_id: currentUserId,
          user2_id: userId
        });

        if (error) throw error;
        setAffinity(data || 0);
      } catch (error) {
        console.error('Erro ao calcular afinidade:', error);
        setAffinity(0);
      } finally {
        setLoading(false);
      }
    };

    if (userId !== currentUserId) {
      calculateAffinity();
    } else {
      setLoading(false);
    }
  }, [userId, currentUserId]);

  if (loading || affinity === null || userId === currentUserId) {
    return null;
  }

  const getAffinityLabel = (score: number) => {
    if (score >= 80) return { text: 'Sintonia Incrível!', color: 'text-primary', icon: '🌟' };
    if (score >= 60) return { text: 'Boa Sintonia', color: 'text-accent', icon: '✨' };
    if (score >= 40) return { text: 'Começando a se conhecer', color: 'text-secondary', icon: '🌱' };
    return { text: 'Conhecidos da Praça', color: 'text-muted-foreground', icon: '👋' };
  };

  const label = getAffinityLabel(affinity);

  return (
    <Card className="p-4 bg-gradient-to-br from-card/95 to-primary/5 border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Sintonia da Praça</h3>
          </div>
          <span className="text-2xl">{label.icon}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={label.color}>{label.text}</span>
            <span className="font-bold text-primary">{affinity}%</span>
          </div>
          <Progress value={affinity} className="h-2" />
        </div>

        <p className="text-xs text-muted-foreground">
          Baseado em interesses comuns, clubes e interações na cidade
        </p>
      </div>
    </Card>
  );
};
