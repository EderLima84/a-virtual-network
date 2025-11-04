import { useState, useEffect, useRef } from "react";
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
  Megaphone,
  Share2,
  Loader2,
  X,
  Smile,
  ThumbsUp,
  Flame,
  Sunrise,
  Users
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { CommentDialog } from "@/components/CommentDialog";

type Post = Tables<"posts"> & {
  profiles: Tables<"profiles">;
  user_liked?: boolean;
};

type Announcement = Tables<"announcements">;

type Ranking = {
  user_id: string;
  score: number;
};

type PresenceState = {
  user_id: string;
  display_name: string;
  username: string;
};

const reactions = [
  { icon: "❤️", label: "Coração", color: "text-red-500" },
  { icon: "🤠", label: "Sertanejo", color: "text-amber-500" },
  { icon: "😂", label: "Risada", color: "text-yellow-500" },
  { icon: "🙌", label: "Mãos", color: "text-blue-500" },
  { icon: "🔥", label: "Fogo", color: "text-orange-500" },
];

const getTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);
  
  if (diffInMinutes < 1) return "agora";
  if (diffInMinutes < 60) return `há ${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "ontem";
  if (diffInDays < 7) return `há ${diffInDays} dias`;
  
  return past.toLocaleDateString("pt-BR");
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Bom dia, Portellanos!", icon: Sunrise, message: "O sol nasceu na Praça Central — compartilhe sua história de hoje." };
  if (hour < 18) return { text: "Boa tarde, Portellanos!", icon: TrendingUp, message: "A cidade está animada — veja o que está acontecendo!" };
  return { text: "Boa noite, Portellanos!", icon: Star, message: "As estrelas brilham na Praça — conte como foi seu dia." };
};

const Feed = () => {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [rankingProfiles, setRankingProfiles] = useState<Record<string, Tables<"profiles">>>({});
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentDialogPostId, setCommentDialogPostId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      const { data: postsData, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (*)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Check if user liked each post
      if (user && postsData) {
        const { data: likesData } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id);

        const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
        
        const postsWithLikes = postsData.map(post => ({
          ...post,
          user_liked: likedPostIds.has(post.id),
        }));

        setPosts(postsWithLikes);
      } else {
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadRanking = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_weekly_ranking');
      
      if (error) throw error;
      setRanking(data || []);

      // Load profiles for ranking users
      if (data && data.length > 0) {
        const userIds = data.map((r: Ranking) => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        if (!profilesError && profiles) {
          const profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, Tables<"profiles">>);
          setRankingProfiles(profilesMap);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 5MB.");
        return;
      }
      setNewPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewPostImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const createPost = async () => {
    if ((!newPostContent.trim() && !newPostImage) || !user) return;

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      // Upload image if exists
      if (newPostImage) {
        setUploadingImage(true);
        const fileExt = newPostImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('post-images')
          .upload(fileName, newPostImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        setUploadingImage(false);
      }

      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: newPostContent.trim() || "",
          image_url: imageUrl,
        });

      if (error) throw error;

      setNewPostContent("");
      setNewPostImage(null);
      setImagePreview(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      toast.success("✨ Post criado! +2 pontos de cidadania");
      loadPosts();
    } catch (error) {
      console.error("Erro ao criar post:", error);
      toast.error("Erro ao criar post");
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (currentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            user_liked: !currentlyLiked,
            likes_count: currentlyLiked 
              ? (post.likes_count || 1) - 1 
              : (post.likes_count || 0) + 1,
          };
        }
        return post;
      }));
    } catch (error) {
      console.error("Erro ao curtir post:", error);
      toast.error("Erro ao curtir post");
    }
  };

  const sharePost = (postId: string) => {
    const url = `${window.location.origin}/feed?post=${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
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

  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-8">
      <div className="container mx-auto px-4">
        {/* Boletim da Cidade */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <greeting.icon className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">{greeting.text}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{greeting.message}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                <Users className="w-4 h-4 text-green-500" />
                <span><strong>{onlineUsers.length}</strong> cidadãos online agora</span>
              </div>
              <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span><strong>{posts.length}</strong> conversas na praça</span>
              </div>
              <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Ranking atualizado hoje</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <Card className="bg-card/95 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Cidadãos Online
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {onlineUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ninguém online no momento.</p>
                  ) : (
                    <ul className="space-y-2">
                      {onlineUsers.map((presence) => (
                        <li key={presence.user_id}>
                          <Link to={`/profile/${presence.username}`} className="flex items-center gap-3 hover:bg-primary/10 p-2 rounded-lg transition-all hover:scale-105">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold shadow-md">
                                {presence.display_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background animate-pulse" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{presence.display_name}</p>
                              <p className="text-xs text-muted-foreground">@{presence.username}</p>
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
            <Card className="p-6 mb-8 shadow-elevated border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
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
        <Card className="p-6 mb-8 shadow-card bg-card/95 backdrop-blur-sm rounded-xl">
          <h3 className="font-semibold mb-4 text-lg">O que está acontecendo na praça?</h3>
          <Textarea
            placeholder="Compartilhe algo com a comunidade..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="mb-4 min-h-[100px]"
          />
          
          {imagePreview && (
            <div className="relative mb-4 bg-muted rounded-lg">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-96 rounded-lg object-contain w-full"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4 mr-2" />
                )}
                Foto
              </Button>
            </div>
            <Button
              onClick={createPost}
              disabled={(!newPostContent.trim() && !newPostImage) || submitting || uploadingImage}
              className="bg-gradient-orkut hover:opacity-90"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
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
              <Card key={post.id} className="p-6 shadow-card hover:shadow-elevated transition-all bg-card/95 backdrop-blur-sm rounded-xl">
                <div className="flex items-start gap-4">
                  <Link to={`/profile/${post.profiles.username}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold flex-shrink-0 hover:scale-110 transition-transform shadow-md">
                      {post.profiles.display_name.charAt(0).toUpperCase()}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/profile/${post.profiles.username}`} className="hover:underline">
                        <h4 className="font-semibold">{post.profiles.display_name}</h4>
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        @{post.profiles.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <span>{getTimeAgo(post.created_at!)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        na Praça Central
                      </span>
                    </div>
                    
                    {post.content && (
                      <p className="text-foreground mb-4 whitespace-pre-wrap break-words">{post.content}</p>
                    )}
                    
                    {post.image_url && (
                      <div className="bg-muted rounded-lg mb-4">
                        <img 
                          src={post.image_url} 
                          alt="Post image" 
                          className="rounded-lg max-h-[500px] w-full object-contain"
                        />
                      </div>
                    )}
                    
                    {/* Interações */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id, post.user_liked || false)}
                        className={`gap-2 hover:scale-110 transition-transform ${
                          post.user_liked ? 'text-red-500' : ''
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{post.likes_count || 0}</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:scale-110 transition-transform"
                        onClick={() => setCommentDialogPostId(post.id)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.comments_count || 0}</span>
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:scale-110 transition-transform"
                        onClick={() => sharePost(post.id)}
                      >
                        <Share2 className="w-4 h-4" />
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
              <Card className="bg-card/95 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Ranking da Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRanking ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : ranking.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ninguém no ranking ainda.</p>
                  ) : (
                    <ul className="space-y-3">
                      {ranking.map((entry, index) => {
                        const profile = rankingProfiles[entry.user_id];
                        if (!profile) return null;
                        return (
                          <li key={entry.user_id} className="flex items-center gap-3">
                            <span className={`font-bold text-lg ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-600' : ''}`}>
                              {index + 1}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold text-sm">
                              {profile.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm truncate">{profile.display_name}</p>
                              <p className="text-xs text-muted-foreground">{entry.score} pontos</p>
                            </div>
                            {index === 0 && <Trophy className="w-5 h-5 text-amber-400" />}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-card/95 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    Anúncios
                  </CardTitle>
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

      <CommentDialog
        postId={commentDialogPostId || ""}
        isOpen={!!commentDialogPostId}
        onClose={() => setCommentDialogPostId(null)}
      />
    </div>
  );
};

export default Feed;
