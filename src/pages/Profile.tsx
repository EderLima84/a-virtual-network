import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  MessageSquare, Award, Image as ImageIcon, Music, Trophy, Send, 
  Camera, Edit2, Users, MapPin, Calendar, MoreHorizontal,
  Grid3X3, Bookmark, Heart, Settings, ShieldOff, UserPlus,
  Home, Globe, Lock, Star, Gift, Sparkles
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { MusicPlayerDialog } from "@/components/MusicPlayerDialog";
import { GalleryUploadDialog } from "@/components/GalleryUploadDialog";
import { BlockedUsersDialog } from "@/components/BlockedUsersDialog";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useAchievements } from "@/hooks/useAchievements";
import { FriendshipCircle } from "@/components/FriendshipCircle";
import { WallMessages } from "@/components/WallMessages";
import { ReceivedGifts } from "@/components/ReceivedGifts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProfileData = Tables<"profiles"> & {
  avatar_url?: string;
  cover_photo_url?: string;
};
type Scrap = Tables<"scraps"> & {
  from_profile: Tables<"profiles">;
};
type Testimonial = Tables<"testimonials"> & {
  from_profile: Tables<"profiles">;
};
type UserAchievement = Tables<"user_achievements"> & {
  achievement: Tables<"achievements">;
};

const Profile = () => {
  const { user, loading } = useAuth();
  const { checkFirstScrap, checkPhotographer, checkDecorator, checkMusician, checkWriter } = useAchievements();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [newScrap, setNewScrap] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [musicDialogOpen, setMusicDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [blockedUsersDialogOpen, setBlockedUsersDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load friendships count
      const { count: friendsCountData } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setFriendsCount(friendsCountData || 0);

      const { data: scrapsData, error: scrapsError } = await supabase
        .from("scraps")
        .select(`*, from_profile:profiles!scraps_from_user_id_fkey(*)`)
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false });

      if (scrapsError) throw scrapsError;
      setScraps(scrapsData || []);

      try {
        const { data: testimonialsData, error: testimonialsError } = await supabase
          .from("testimonials")
          .select(`*, from_profile:profiles!testimonials_from_user_id_fkey(*)`)
          .eq("to_user_id", user.id)
          .order("created_at", { ascending: false });

        if (testimonialsError) console.warn("Aviso:", testimonialsError);
        setTestimonials(testimonialsData || []);
      } catch {
        setTestimonials([]);
      }

      const { data: achievementsData, error: achievementsError } = await supabase
        .from("user_achievements")
        .select(`*, achievement:achievements(*)`)
        .eq("user_id", user.id);

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoadingData(false);
    }
  };

  const addScrap = async () => {
    if (!newScrap.trim() || !user) return;

    try {
      const { error } = await supabase
        .from("scraps")
        .insert({
          from_user_id: user.id,
          to_user_id: user.id,
          content: newScrap.trim(),
        });

      if (error) throw error;

      setNewScrap("");
      toast.success("✨ Recado adicionado!");
      await checkFirstScrap(user.id);
      loadProfileData();
    } catch (error) {
      console.error("Erro ao adicionar recado:", error);
      toast.error("Erro ao adicionar recado");
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;

      setUploadingAvatar(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success("✨ Avatar atualizado!");
      if (user?.id) await checkPhotographer(user.id);
      loadProfileData();
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast.error("Erro ao atualizar avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;

      setUploadingCover(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('house-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('house-covers')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ house_background: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success("✨ Foto de capa atualizada!");
      if (user?.id) await checkDecorator(user.id);
      loadProfileData();
    } catch (error) {
      console.error('Erro ao fazer upload da capa:', error);
      toast.error("Erro ao atualizar foto de capa");
    } finally {
      setUploadingCover(false);
    }
  };

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
      {/* Cover Photo Section - Facebook Style */}
      <div className="relative">
        <div className="h-[200px] sm:h-[280px] md:h-[350px] bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 relative">
          <img 
            src={profile?.house_background || 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=1912&auto=format&fit=crop'} 
            alt="Capa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          
          {/* Edit Cover Button */}
          <Button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 gap-2 bg-card/90 hover:bg-card shadow-lg"
          >
            <Camera className="w-4 h-4" />
            {uploadingCover ? "Enviando..." : "Editar capa"}
          </Button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={uploadCover}
            className="hidden"
          />
        </div>

        {/* Profile Header Container */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative -mt-[80px] sm:-mt-[100px] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Avatar */}
              <div className="relative group self-center sm:self-auto">
                <div 
                  className="w-[140px] h-[140px] sm:w-[168px] sm:h-[168px] rounded-full border-4 border-background shadow-xl bg-card overflow-hidden cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-orkut flex items-center justify-center text-primary-foreground text-5xl font-bold">
                      {profile?.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left sm:pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {profile?.display_name}
                </h1>
                <p className="text-muted-foreground font-medium">@{profile?.username}</p>
                
                {/* Stats Row */}
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{friendsCount}</span>
                  <span>amigos</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">{achievements.length}</span>
                  <span>conquistas</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-secondary" />
                    <span className="font-semibold text-foreground">{profile?.points || 0}</span>
                    <span>pontos</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-center sm:self-end sm:pb-2">
                <Button 
                  onClick={() => setEditDialogOpen(true)}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar perfil
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setMusicDialogOpen(true)}>
                      <Music className="w-4 h-4 mr-2" />
                      Configurar música
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGalleryDialogOpen(true)}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Adicionar fotos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/privacy-settings">
                        <Lock className="w-4 h-4 mr-2" />
                        Configurações de privacidade
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBlockedUsersDialogOpen(true)}>
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Usuários bloqueados
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Navigation Tabs - Facebook Style */}
          <div className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <nav className="flex gap-1 border-b border-transparent">
              {[
                { id: "posts", label: "Publicações", icon: Grid3X3 },
                { id: "about", label: "Sobre", icon: Home },
                { id: "photos", label: "Fotos", icon: ImageIcon },
                { id: "friends", label: "Amigos", icon: Users },
                { id: "gifts", label: "Presentes", icon: Gift },
                { id: "trophies", label: "Troféus", icon: Trophy },
                { id: "music", label: "Música", icon: Music },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Intro Card */}
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3">Sobre</h3>
              {profile?.bio ? (
                <p className="text-muted-foreground text-sm mb-4">{profile.bio}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic mb-4">
                  Adicione uma bio para contar mais sobre você
                </p>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Home className="w-5 h-5 text-muted-foreground" />
                  <span>Mora em <strong>Portella</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>De <strong>Cidade Virtual</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span>Entrou em <strong>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'data desconhecida'}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span>Nível <strong>{profile?.level || 1}</strong></span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setEditDialogOpen(true)}
              >
                Editar detalhes
              </Button>
            </Card>

            {/* Photos/Gallery Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Fotos</h3>
                <Button variant="ghost" size="sm" onClick={() => setGalleryDialogOpen(true)}>
                  Ver todas
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-muted flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Friends Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Amigos</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("friends")}>
                  Ver todos
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{friendsCount} amigos</p>
              <div className="grid grid-cols-3 gap-2">
                {/* Placeholder for friends */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="text-center">
                    <div className="aspect-square bg-muted rounded-lg mb-1 flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">Amigo</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === "posts" && (
              <>
                {/* Create Post Card */}
                <Card className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-orkut text-primary-foreground">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="O que você está pensando?"
                        value={newScrap}
                        onChange={(e) => setNewScrap(e.target.value)}
                        className="resize-none border-0 bg-muted/50 focus-visible:ring-1 mb-3"
                        rows={2}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="gap-2 text-accent">
                            <ImageIcon className="w-4 h-4" />
                            Foto
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2 text-secondary">
                            <Sparkles className="w-4 h-4" />
                            Momento
                          </Button>
                        </div>
                        <Button
                          onClick={addScrap}
                          disabled={!newScrap.trim()}
                          size="sm"
                          className="gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Publicar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Posts/Scraps List */}
                {loadingData ? (
                  <Card className="p-8 text-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground">Carregando publicações...</p>
                  </Card>
                ) : scraps.length === 0 ? (
                  <Card className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Nenhuma publicação ainda</h3>
                    <p className="text-muted-foreground text-sm">
                      Compartilhe algo com seus amigos!
                    </p>
                  </Card>
                ) : (
                  scraps.map((scrap) => (
                    <Card key={scrap.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={scrap.from_profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-orkut text-primary-foreground">
                              {scrap.from_profile.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {scrap.from_profile.display_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(scrap.created_at!).toLocaleDateString("pt-BR", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <p className="text-sm mt-2 whitespace-pre-wrap">{scrap.content}</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-around py-2 px-4">
                        <Button variant="ghost" size="sm" className="gap-2 flex-1">
                          <Heart className="w-4 h-4" />
                          Curtir
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 flex-1">
                          <MessageSquare className="w-4 h-4" />
                          Comentar
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </>
            )}

            {activeTab === "about" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sobre {profile?.display_name}</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Bio</h3>
                    <p className="text-foreground">
                      {profile?.bio || "Nenhuma bio adicionada ainda."}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Estatísticas</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{profile?.points || 0}</p>
                        <p className="text-xs text-muted-foreground">Pontos</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-secondary">{profile?.level || 1}</p>
                        <p className="text-xs text-muted-foreground">Nível</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-accent">{achievements.length}</p>
                        <p className="text-xs text-muted-foreground">Conquistas</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{friendsCount}</p>
                        <p className="text-xs text-muted-foreground">Amigos</p>
                      </div>
                    </div>
                  </div>
                  {profile?.house_theme && profile.house_theme !== "default" && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-2">Tema da Casa</h3>
                        <Badge variant="secondary">{profile.house_theme}</Badge>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {activeTab === "photos" && user && (
              <PhotoGallery userId={user.id} isOwner={true} />
            )}

            {activeTab === "friends" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Amigos</h2>
                {user && <FriendshipCircle userId={user.id} />}
              </Card>
            )}

            {activeTab === "gifts" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Presentes Recebidos
                </h2>
                {user && <ReceivedGifts userId={user.id} isOwner={true} />}
              </Card>
            )}

            {activeTab === "trophies" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-secondary" />
                  Sala de Troféus
                </h2>
                {achievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma conquista ainda. Continue interagindo!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {achievements.map((ua) => (
                      <Card 
                        key={ua.id} 
                        className="p-4 text-center hover:shadow-lg transition-shadow border-2 border-transparent hover:border-secondary/50"
                      >
                        <div className="text-4xl mb-2">{ua.achievement.icon || "🏆"}</div>
                        <h4 className="font-semibold text-sm">{ua.achievement.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ua.achievement.description}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          +{ua.achievement.points} pts
                        </Badge>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === "music" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-accent" />
                  Música da Casa
                </h2>
                {profile?.house_music ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="w-16 h-16 bg-gradient-orkut rounded-lg flex items-center justify-center">
                        <Music className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Música Ativa</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.house_music}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setMusicDialogOpen(true)}
                      className="w-full gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Alterar Música
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Nenhuma música definida</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Adicione uma música para tocar quando visitarem sua casa!
                    </p>
                    <Button 
                      onClick={() => setMusicDialogOpen(true)}
                      className="gap-2"
                    >
                      <Music className="w-4 h-4" />
                      Adicionar Música
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        onProfileUpdate={loadProfileData}
      />
      
      <MusicPlayerDialog
        open={musicDialogOpen}
        onOpenChange={setMusicDialogOpen}
        userId={user?.id}
        currentMusic={profile?.house_music}
        onMusicUpdate={loadProfileData}
      />

      <GalleryUploadDialog
        open={galleryDialogOpen}
        onOpenChange={setGalleryDialogOpen}
        userId={user?.id}
        onUploadComplete={loadProfileData}
      />

      <BlockedUsersDialog
        open={blockedUsersDialogOpen}
        onOpenChange={setBlockedUsersDialogOpen}
      />
    </div>
  );
};

export default Profile;
