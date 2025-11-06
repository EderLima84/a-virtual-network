import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { Users, Home, Star } from 'lucide-react';
import { FriendshipLevelBadge, FriendshipLevel } from './FriendshipLevel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

type Friendship = Tables<'friendships'> & {
  friend_profile: Tables<'profiles'>;
};

interface FriendshipCircleProps {
  userId: string;
}

export const FriendshipCircle = ({ userId }: FriendshipCircleProps) => {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendships();
  }, [userId]);

  const fetchFriendships = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          friend_profile:friend_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFriendships(data as any || []);
    } catch (error) {
      console.error('Erro ao buscar amizades:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByLevel = () => {
    const groups = {
      conhecido: [] as Friendship[],
      vizinho: [] as Friendship[],
      amigo_varanda: [] as Friendship[]
    };

    friendships.forEach(friendship => {
      const level = friendship.level as FriendshipLevel;
      groups[level].push(friendship);
    });

    return groups;
  };

  if (loading) {
    return (
      <Card className="bg-card/95 backdrop-blur-sm">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const grouped = groupByLevel();
  const totalFriends = friendships.length;

  return (
    <Card className="bg-card/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Círculo de Convivência
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalFriends} {totalFriends === 1 ? 'vínculo' : 'vínculos'} na cidade
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amigos da Varanda */}
        {grouped.amigo_varanda.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Amigos da Varanda ({grouped.amigo_varanda.length})</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {grouped.amigo_varanda.map((friendship) => (
                <Link
                  key={friendship.id}
                  to={`/profile/${friendship.friend_profile.username}`}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={friendship.friend_profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {friendship.friend_profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-center truncate w-full">
                    {friendship.friend_profile.display_name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Vizinhos Próximos */}
        {grouped.vizinho.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-accent" />
              <h4 className="font-semibold text-sm">Vizinhos Próximos ({grouped.vizinho.length})</h4>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {grouped.vizinho.map((friendship) => (
                <Link
                  key={friendship.id}
                  to={`/profile/${friendship.friend_profile.username}`}
                  className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <Avatar className="h-10 w-10 border border-accent">
                    <AvatarImage src={friendship.friend_profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {friendship.friend_profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-center truncate w-full">
                    {friendship.friend_profile.display_name.split(' ')[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Conhecidos da Praça */}
        {grouped.conhecido.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Conhecidos da Praça ({grouped.conhecido.length})</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {grouped.conhecido.map((friendship) => (
                <Link
                  key={friendship.id}
                  to={`/profile/${friendship.friend_profile.username}`}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={friendship.friend_profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {friendship.friend_profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">
                    {friendship.friend_profile.display_name.split(' ')[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {totalFriends === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum vínculo ainda. Explore a cidade!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
