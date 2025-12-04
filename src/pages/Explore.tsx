import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, UserCheck, UserX, Users, X, HandMetal, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { CityNavigation } from '@/components/CityNavigation';
import { FriendshipLevelBadge, FriendshipLevel } from '@/components/FriendshipLevel';
import { GiftDialog } from '@/components/GiftDialog';
import { AffinityScore } from '@/components/AffinityScore';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  friendshipStatus?: 'none' | 'pending_sent' | 'pending_received' | 'friends';
  friendshipLevel?: FriendshipLevel;
  affinityScore?: number;
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  category: string;
  members_count: number;
  icon: string | null;
  isMember: boolean;
}

interface SuggestedProfile extends Profile {
  reason: string;
  commonFriends?: number;
  commonCommunities?: number;
}

export default function Explore() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Profile[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedProfile[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [selectedGiftRecipient, setSelectedGiftRecipient] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    loadPendingRequests();
    loadFriendSuggestions();
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const loadPendingRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friend_requests')
      .select('sender_id, profiles!friend_requests_sender_id_fkey(*)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (!error && data) {
      const requests = data.map(req => ({
        id: req.sender_id,
        username: (req.profiles as any).username,
        display_name: (req.profiles as any).display_name,
        avatar_url: (req.profiles as any).avatar_url,
        bio: (req.profiles as any).bio,
        friendshipStatus: 'pending_received' as const
      }));
      setPendingRequests(requests);
    }
  };

  const loadFriendSuggestions = async () => {
    if (!user) return;
    
    setLoadingSuggestions(true);
    
    // Get user's current friends
    const { data: myFriends } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id);
    
    const myFriendIds = myFriends?.map(f => f.friend_id) || [];
    
    // Get user's pending requests to exclude them
    const { data: pendingOut } = await supabase
      .from('friend_requests')
      .select('receiver_id')
      .eq('sender_id', user.id)
      .eq('status', 'pending');
    
    const pendingIds = pendingOut?.map(p => p.receiver_id) || [];
    
    // Get user's communities
    const { data: myCommunities } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);
    
    const myCommunityIds = myCommunities?.map(c => c.community_id) || [];
    
    // Find people in same communities
    let suggestions: SuggestedProfile[] = [];
    
    if (myCommunityIds.length > 0) {
      const { data: communityMembers } = await supabase
        .from('community_members')
        .select('user_id, community_id, profiles(*)')
        .in('community_id', myCommunityIds)
        .neq('user_id', user.id);
      
      if (communityMembers) {
        const profileMap = new Map<string, { profile: any; communities: Set<string> }>();
        
        communityMembers.forEach(member => {
          if (myFriendIds.includes(member.user_id) || pendingIds.includes(member.user_id)) return;
          
          if (!profileMap.has(member.user_id)) {
            profileMap.set(member.user_id, {
              profile: member.profiles,
              communities: new Set([member.community_id])
            });
          } else {
            profileMap.get(member.user_id)!.communities.add(member.community_id);
          }
        });
        
        profileMap.forEach(({ profile, communities }) => {
          if (profile) {
            suggestions.push({
              id: profile.id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              bio: profile.bio,
              friendshipStatus: 'none',
              reason: communities.size > 1 
                ? `${communities.size} clubes em comum` 
                : '1 clube em comum',
              commonCommunities: communities.size
            });
          }
        });
      }
    }
    
    // Find friends of friends
    if (myFriendIds.length > 0) {
      const { data: friendsOfFriends } = await supabase
        .from('friendships')
        .select('friend_id, profiles(*)')
        .in('user_id', myFriendIds)
        .neq('friend_id', user.id);
      
      if (friendsOfFriends) {
        const fofMap = new Map<string, { profile: any; count: number }>();
        
        friendsOfFriends.forEach(fof => {
          if (myFriendIds.includes(fof.friend_id) || pendingIds.includes(fof.friend_id)) return;
          
          if (!fofMap.has(fof.friend_id)) {
            fofMap.set(fof.friend_id, { profile: fof.profiles, count: 1 });
          } else {
            fofMap.get(fof.friend_id)!.count++;
          }
        });
        
        fofMap.forEach(({ profile, count }, userId) => {
          if (profile && !suggestions.find(s => s.id === userId)) {
            suggestions.push({
              id: profile.id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              bio: profile.bio,
              friendshipStatus: 'none',
              reason: count > 1 
                ? `${count} amigos em comum` 
                : '1 amigo em comum',
              commonFriends: count
            });
          }
        });
      }
    }
    
    // Sort by relevance (more common friends/communities first)
    suggestions.sort((a, b) => {
      const aScore = (a.commonFriends || 0) + (a.commonCommunities || 0) * 2;
      const bScore = (b.commonFriends || 0) + (b.commonCommunities || 0) * 2;
      return bScore - aScore;
    });
    
    setSuggestedFriends(suggestions.slice(0, 6));
    setLoadingSuggestions(false);
  };

  const searchUsers = async (query: string) => {
    if (!user || !query.trim()) {
      setProfiles([]);
      return;
    }

    setLoading(true);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (profilesError) {
      toast.error('Erro ao buscar usuários');
      setLoading(false);
      return;
    }

    // Check friendship status
    const profilesWithStatus = await Promise.all(
      (profilesData || []).map(async (profile) => {
        const { data: sentRequest } = await supabase
          .from('friend_requests')
          .select('status')
          .eq('sender_id', user.id)
          .eq('receiver_id', profile.id)
          .single();

        const { data: receivedRequest } = await supabase
          .from('friend_requests')
          .select('status')
          .eq('sender_id', profile.id)
          .eq('receiver_id', user.id)
          .single();

        const { data: friendship } = await supabase
          .from('friendships')
          .select('id, level, affinity_score')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`)
          .single();

        let friendshipStatus: Profile['friendshipStatus'] = 'none';
        let friendshipLevel: FriendshipLevel | undefined = undefined;
        let affinityScore: number | undefined = undefined;
        
        if (friendship) {
          friendshipStatus = 'friends';
          friendshipLevel = friendship.level as FriendshipLevel;
          affinityScore = friendship.affinity_score;
        } else if (sentRequest?.status === 'pending') {
          friendshipStatus = 'pending_sent';
        } else if (receivedRequest?.status === 'pending') {
          friendshipStatus = 'pending_received';
        }

        return { ...profile, friendshipStatus, friendshipLevel, affinityScore };
      })
    );

    setProfiles(profilesWithStatus);
    setLoading(false);
  };

  const searchCommunities = async (query: string) => {
    if (!user || !query.trim()) {
      setCommunities([]);
      return;
    }

    setLoading(true);
    const { data: communitiesData, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (communitiesError) {
      toast.error('Erro ao buscar clubes');
      setLoading(false);
      return;
    }

    // Check membership status
    const communitiesWithStatus = await Promise.all(
      (communitiesData || []).map(async (community) => {
        const { data: membership } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', community.id)
          .eq('user_id', user.id)
          .single();

        return { ...community, isMember: !!membership };
      })
    );

    setCommunities(communitiesWithStatus);
    setLoading(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchUsers(query);
    searchCommunities(query);
  };

  const sendFriendRequest = async (receiverId: string, receiverName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      });

    if (error) {
      toast.error('Erro ao enviar convite');
    } else {
      toast.success(`👋 Você acenou para ${receiverName} na praça!`);
      loadFriendSuggestions();
      if (searchQuery) handleSearch(searchQuery);
    }
  };

  const acceptFriendRequest = async (senderId: string) => {
    if (!user) return;

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id);

    if (updateError) {
      toast.error('Erro ao aceitar solicitação');
      return;
    }

    // Create friendship (bidirectional)
    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert([
        { user_id: user.id, friend_id: senderId },
        { user_id: senderId, friend_id: user.id }
      ]);

    if (friendshipError) {
      toast.error('Erro ao criar amizade');
    } else {
      // Get sender profile for personalized message
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', senderId)
        .single();
      
      toast.success(`🌻 Você e ${senderProfile?.display_name || 'alguém'} agora são vizinhos!`);
      loadPendingRequests();
      loadFriendSuggestions();
      if (searchQuery) handleSearch(searchQuery);
    }
  };

  const rejectFriendRequest = async (senderId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id);

    if (error) {
      toast.error('Erro ao recusar solicitação');
    } else {
      toast.success('Solicitação recusada');
      loadPendingRequests();
      handleSearch(searchQuery);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) {
      toast.error('Erro ao remover amizade');
    } else {
      toast.success('Amizade removida');
      handleSearch(searchQuery);
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: user.id
      });

    if (error) {
      toast.error('Erro ao entrar no clube');
    } else {
      toast.success('Você entrou no clube!');
      handleSearch(searchQuery);
    }
  };

  const leaveCommunity = async (communityId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao sair do clube');
    } else {
      toast.success('Você saiu do clube');
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <CityNavigation />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              🔍 Explorar Portella
            </h1>
            <p className="text-muted-foreground">
              Encontre vizinhos e clubes na cidade digital — cumprimente, faça amizades e compartilhe afinidades!
            </p>
          </div>

          {pendingRequests.length > 0 && (
            <Card className="p-4 border-primary/20 bg-gradient-to-br from-card/95 to-primary/5 backdrop-blur-sm shadow-elevated">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <HandMetal className="h-5 w-5 text-primary" />
                👋 Convites de Convivência ({pendingRequests.length})
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Alguém acenou para você na praça! Aceite para virar vizinho.
              </p>
              <div className="grid gap-3">
                {pendingRequests.map(profile => (
                  <div key={profile.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{profile.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptFriendRequest(profile.id)}>
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectFriendRequest(profile.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {suggestedFriends.length > 0 && !searchQuery && (
            <Card className="p-6 border-accent/30 bg-gradient-to-br from-card to-accent/5">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                🌟 Pessoas que você pode conhecer
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Vizinhos com interesses em comum na Cidade Portella
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {suggestedFriends.map(profile => (
                  <Card key={profile.id} className="p-4 hover:border-accent/50 transition-all hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <Avatar 
                        className="h-14 w-14 border-2 border-accent/20 cursor-pointer" 
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-semibold cursor-pointer hover:text-accent transition-colors truncate"
                          onClick={() => navigate(`/profile/${profile.id}`)}
                        >
                          {profile.display_name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {profile.reason}
                        </Badge>
                        {profile.bio && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => sendFriendRequest(profile.id, profile.display_name)}
                      className="w-full mt-3 bg-gradient-orkut"
                    >
                      <HandMetal className="h-3 w-3 mr-1" />
                      Cumprimentar
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar usuários ou clubes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="communities">Clubes</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4 mt-6">
              {loading ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Buscando...</p>
                </Card>
              ) : profiles.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Nenhum usuário encontrado' : 'Digite algo para começar a busca'}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {profiles.map(profile => (
                    <Card key={profile.id} className="p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/20 cursor-pointer" onClick={() => navigate(`/profile/${profile.id}`)}>
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg cursor-pointer hover:text-primary flex items-center gap-2" onClick={() => navigate(`/profile/${profile.id}`)}>
                              {profile.display_name}
                              {profile.friendshipLevel && (
                                <FriendshipLevelBadge level={profile.friendshipLevel} size="sm" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                            {profile.bio && (
                              <p className="text-sm mt-2">{profile.bio}</p>
                            )}
                          </div>
                          
                          {profile.friendshipStatus === 'friends' && user && (
                            <AffinityScore userId={profile.id} currentUserId={user.id} />
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {profile.friendshipStatus === 'none' && (
                            <Button onClick={() => sendFriendRequest(profile.id, profile.display_name)} className="bg-gradient-orkut">
                              <HandMetal className="h-4 w-4 mr-2" />
                              Cumprimentar
                            </Button>
                          )}
                          {profile.friendshipStatus === 'pending_sent' && (
                            <Badge variant="secondary" className="justify-center py-2">
                              👋 Convite enviado
                            </Badge>
                          )}
                          {profile.friendshipStatus === 'pending_received' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => acceptFriendRequest(profile.id)} className="bg-gradient-orkut">
                                Aceitar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => rejectFriendRequest(profile.id)}>
                                Recusar
                              </Button>
                            </div>
                          )}
                          {profile.friendshipStatus === 'friends' && (
                            <>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedGiftRecipient({ id: profile.id, name: profile.display_name });
                                  setGiftDialogOpen(true);
                                }}
                                className="border-primary/30 hover:bg-primary/10"
                              >
                                <Gift className="h-4 w-4 mr-2" />
                                Enviar Presente
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => removeFriend(profile.id)} className="text-destructive">
                                <UserX className="h-4 w-4 mr-2" />
                                Remover
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="communities" className="space-y-4 mt-6">
              {loading ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Buscando...</p>
                </Card>
              ) : communities.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Nenhum clube encontrado' : 'Digite algo para começar a busca'}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {communities.map(community => (
                    <Card key={community.id} className="p-4 hover:border-primary/50 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{community.icon || '🏘️'}</div>
                            <div>
                              <h3 className="font-semibold">{community.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {community.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {community.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {community.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {community.members_count} membros
                          </div>
                          {community.isMember ? (
                            <Button size="sm" variant="outline" onClick={() => leaveCommunity(community.id)}>
                              Sair
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => joinCommunity(community.id)}>
                              Entrar
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Gift Dialog */}
      {selectedGiftRecipient && (
        <GiftDialog
          isOpen={giftDialogOpen}
          onClose={() => {
            setGiftDialogOpen(false);
            setSelectedGiftRecipient(null);
          }}
          recipientId={selectedGiftRecipient.id}
          recipientName={selectedGiftRecipient.name}
        />
      )}
    </div>
  );
}
