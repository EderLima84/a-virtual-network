import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import "./Feed.css";
import { 
  TrendingUp, 
  Cake, 
  Trophy, 
  Heart, 
  Star, 
  Sparkles, 
  MessageCircle,
  Send,
  Image as ImageIcon,
  Megaphone
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts"> & {
  profiles: Tables<"profiles">;
};

type Announcement = Tables<"announcements">;

type Ranking = Tables<"weekly_rankings"> & {
  profiles: Tables<"profiles">;
};

type PresenceState = {
  user_id: string;
  display_name: string;
  username: string;
};

const emotes = [
  { icon: Heart, label: "Coração", color: "text-red-500" },
  { icon: Star, label: "Estrela", color: "text-yellow-500" },
  { icon: Sparkles, label: "Brilho", color: "text-purple-500" },
  { icon: Cake, label: "Bolo", color: "text-pink-500" },
  { icon: Trophy, label: "Troféu", color: "text-amber-500" },
];

const Feed = () => {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadPosts();
      loadRanking();
      loadAnnouncements();

      const channel = supabase.channel("praça-central", {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const newState = channel.presenceState<PresenceState>();
          const users = Object.values(newState).flat();
          setOnlineUsers(users);
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("join", key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("leave", key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, username")
              .eq("id", user.id)
              .single();

            await channel.track({ 
              user_id: user.id, 
              display_name: profile?.display_name,
              username: profile?.username,
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (*)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadRanking = async () => {
    try {
      // First, call the function to calculate the ranking
      const { error: rpcError } = await supabase.rpc('calculate_weekly_ranking');
      if (rpcError) throw rpcError;

      // Then, fetch the results
      const { data, error } = await supabase
        .from("weekly_rankings")
        .select(`
          *,
          profiles (*)
        `)
        .order("rank", { ascending: true })
        .limit(10);

      if (error) throw error;
      setRanking(data || []);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
      toast.error("Erro ao carregar ranking");
    } finally {
      setLoadingRanking(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Erro ao carregar anúncios:", error);
      toast.error("Erro ao carregar anúncios");
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: newPostContent.trim(),
        });

      if (error) throw error;

      setNewPostContent("");
      toast.success("✨ Post criado! +2 pontos de cidadania");
      loadPosts();
    } catch (error) {
      console.error("Erro ao criar post:", error);
      toast.error("Erro ao criar post");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card className="card-gradient-border">
                <CardHeader>
                  <CardTitle>Cidadãos Online</CardTitle>
                </CardHeader>
                <CardContent>
                  {onlineUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ninguém online no momento.</p>
                  ) : (
                    <ul className="space-y-3">
                      {onlineUsers.map((presence) => (
                        <li key={presence.user_id}>
                          <Link to={`/profile/${presence.username}`} className="flex items-center gap-3 hover:bg-primary/10 p-2 rounded-md transition-colors">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold text-sm">
                                {presence.display_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm truncate">{presence.display_name}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>

          <main className="lg:col-span-2">
            {/* Coreto Digital */}
            <Card className="p-6 mb-8 shadow-elevated border-2 border-primary/20">
              <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold bg-gradient-orkut bg-clip-text text-transparent">
              Coreto Digital
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 rounded-lg p-4 hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Cake className="w-5 h-5 text-pink-500" />
                <p className="font-semibold text-sm">Aniversariantes</p>
              </div>
              <p className="text-xs text-muted-foreground">0 pessoas fazendo aniversário hoje</p>
            </div>
            <div className="bg-accent/5 rounded-lg p-4 hover:bg-accent/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <p className="font-semibold text-sm">Conquistas</p>
              </div>
              <p className="text-xs text-muted-foreground">Nenhuma conquista recente</p>
            </div>
            <div className="bg-secondary/5 rounded-lg p-4 hover:bg-secondary/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <p className="font-semibold text-sm">Em Alta</p>
              </div>
              <p className="text-xs text-muted-foreground">Seja o primeiro a postar!</p>
            </div>
          </div>
        </Card>

        {/* Criar Post */}
        <Card className="p-6 mb-8 shadow-card">
          <h3 className="font-semibold mb-4">O que está acontecendo na praça?</h3>
          <Textarea
            placeholder="Compartilhe algo com a comunidade..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="mb-4 min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" disabled>
              <ImageIcon className="w-4 h-4 mr-2" />
              Foto
            </Button>
            <Button
              onClick={createPost}
              disabled={!newPostContent.trim() || submitting}
              className="bg-gradient-orkut hover:opacity-90"
            >
              <Send className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          </div>
        </Card>

        {/* Feed de Posts */}
        <div className="space-y-6">
          {loadingPosts ? (
            <Card className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando posts...</p>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum post ainda. Seja o primeiro a compartilhar algo!
              </p>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="p-6 shadow-card hover:shadow-elevated transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold">
                    {post.profiles.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{post.profiles.display_name}</h4>
                      <span className="text-xs text-muted-foreground">
                        @{post.profiles.username}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at!).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                    
                    {/* Emotes e Interações */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        {emotes.slice(0, 3).map((emote, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="hover:scale-110 transition-transform"
                          >
                            <emote.icon className={`w-4 h-4 ${emote.color}`} />
                          </Button>
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">
                          {post.likes_count || 0}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.comments_count || 0}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card className="card-gradient-border">
                <CardHeader>
                  <CardTitle>Ranking da Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRanking ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : ranking.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ninguém no ranking ainda.</p>
                  ) : (
                    <ul className="space-y-3">
                      {ranking.map((entry, index) => (
                        <li key={entry.id} className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-600' : ''}`}>
                            {index + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold text-sm">
                            {entry.profiles.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm truncate">{entry.profiles.display_name}</p>
                            <p className="text-xs text-muted-foreground">{entry.score} pontos</p>
                          </div>
                          {index === 0 && <Trophy className="w-5 h-5 text-amber-400" />}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card className="card-gradient-border">
                <CardHeader>
                  <CardTitle>Anúncios</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAnnouncements ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : announcements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum anúncio no momento.</p>
                  ) : (
                    <ul className="space-y-4">
                      {announcements.map((announcement) => (
                        <li key={announcement.id} className="border-l-4 border-primary pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Megaphone className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-sm">{announcement.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">{announcement.content}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Feed;
