import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Chrome as Home, MessageSquare, Award, Image as ImageIcon, Music, Trophy, Send, Sparkles, Star, Heart, Gift, CirclePlus as PlusCircle, Camera, Upload, Edit2, Settings } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { MusicPlayerDialog } from "@/components/MusicPlayerDialog";
import { GalleryUploadDialog } from "@/components/GalleryUploadDialog";

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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [newScrap, setNewScrap] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [musicDialogOpen, setMusicDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
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
      // Carregar perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erro no perfil:", profileError);
        throw profileError;
      }
      setProfile(profileData);

      // Carregar scraps
      const { data: scrapsData, error: scrapsError } = await supabase
        .from("scraps")
        .select(`
          *,
          from_profile:profiles!scraps_from_user_id_fkey(*)
        `)
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false });

      if (scrapsError) throw scrapsError;
      setScraps(scrapsData || []);

      try {
        // Carregar depoimentos com tratamento de erro específico
        const { data: testimonialsData, error: testimonialsError } = await supabase
          .from("testimonials")
          .select(`
            *,
            from_profile:profiles!testimonials_from_user_id_fkey(*)
          `)
          .eq("to_user_id", user.id)
          .order("created_at", { ascending: false });

        if (testimonialsError) {
          console.warn("Aviso: Erro ao carregar depoimentos:", testimonialsError);
          // Continuar a execução mesmo com erro
        }
        setTestimonials(testimonialsData || []);
      } catch (testimonialsError) {
        console.warn("Aviso: Falha ao carregar depoimentos:", testimonialsError);
        // Definir array vazio para evitar erros de renderização
        setTestimonials([]);
      }

      // Carregar conquistas
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
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
      loadProfileData();
    } catch (error) {
      console.error("Erro ao adicionar recado:", error);
      toast.error("Erro ao adicionar recado");
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploadingAvatar(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar perfil com a nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success("✨ Avatar atualizado!");
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
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploadingCover(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('house-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('house-covers')
        .getPublicUrl(filePath);

      // Atualizar perfil com a nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ house_background: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success("✨ Foto de capa atualizada!");
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
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header da Casa Virtual */}
        <Card className="shadow-elevated relative overflow-hidden border-0 mb-8 rounded-lg">
          {/* Imagem de Capa */}
          <div className="h-48 md:h-64 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 relative group">
            <img 
              src={profile?.house_background || 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=1912&auto=format&fit=crop'} 
              alt="Capa da Casa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
              <Button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-foreground gap-2"
                size="sm"
              >
                <Camera className="w-4 h-4" />
                {uploadingCover ? "Enviando..." : "Alterar Capa"}
              </Button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={uploadCover}
                className="hidden"
              />
            </div>
          </div>

          {/* Conteúdo do Perfil */}
          <div className="p-4 md:p-6 bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-20 sm:-mt-24 relative z-10">
              {/* Foto de Perfil */}
              <div className="relative w-32 h-32 md:w-36 md:h-36 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-full border-4 border-background shadow-lg bg-gradient-orkut overflow-hidden group cursor-pointer"
                     onClick={() => avatarInputRef.current?.click()}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">
                      {profile?.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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

              {/* Informações e Botões */}
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between w-full mt-4 sm:mt-0">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile?.display_name}</h1>
                  <p className="text-muted-foreground">@{profile?.username}</p>
                  {profile?.house_theme && profile.house_theme !== "default" && (
                    <Badge variant="secondary" className="mt-2">
                      Tema: {profile.house_theme}
                    </Badge>
                  )}
                </div>
                
                {/* Botões de Ação */}
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-2 bg-gradient-orkut"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar Perfil
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setMusicDialogOpen(true)}
                  >
                    <Music className="w-4 h-4" />
                    Música
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Bio e Stats */}
            <div className="mt-6 text-center sm:text-left">
              {profile?.bio && (
                <p className="text-foreground max-w-prose mx-auto sm:mx-0">{profile.bio}</p>
              )}
              <div className="flex justify-center sm:justify-start gap-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">{profile?.points || 0}</p>
                  <p className="text-xs text-muted-foreground">Pontos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-accent">{achievements.length}</p>
                  <p className="text-xs text-muted-foreground">Conquistas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-secondary">{scraps.length}</p>
                  <p className="text-xs text-muted-foreground">Recados</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">{testimonials.length}</p>
                  <p className="text-xs text-muted-foreground">Depoimentos</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Conteúdo Principal: Abas e Recados */}
        <div className="space-y-8">
          {/* Mural de Recados */}
          <Card className="p-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Mural de Recados (Sala de Estar)
            </h3>
            <Textarea
              placeholder="Deixe um recado..."
              value={newScrap}
              onChange={(e) => setNewScrap(e.target.value)}
              className="mb-4"
            />
            <Button
              onClick={addScrap}
              disabled={!newScrap.trim()}
              className="bg-gradient-orkut hover:opacity-90"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Recado
            </Button>
          </Card>

          {/* Abas Horizontais para outras seções */}
          <Tabs defaultValue="trophies" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="trophies" className="gap-2">
                <Trophy className="w-4 h-4" />
                Troféus
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-2">
                <Award className="w-4 h-4" />
                Depoimentos
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Quarto
              </TabsTrigger>
              <TabsTrigger value="music" className="gap-2">
                <Music className="w-4 h-4" />
                Música
              </TabsTrigger>
            </TabsList>

            <Card className="mt-4">
              <TabsContent value="trophies" className="p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Sala de Troféus
                </h3>
                {achievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">
                      Nenhuma conquista ainda. Continue interagindo para desbloquear troféus!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {achievements.map((userAchievement) => (
                      <Card 
                        key={userAchievement.id} 
                        className="p-3 text-center hover:shadow-elevated transition-all duration-300 transform hover:-translate-y-1 bg-background/50 border-2 border-transparent hover:border-amber-500/50"
                      >
                        <div className="text-4xl mb-2">{userAchievement.achievement.icon || "🏆"}</div>
                        <div className="text-left">
                          <h4 className="font-semibold text-sm leading-tight mb-1">{userAchievement.achievement.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {userAchievement.achievement.description}
                          </p>
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/20">
                            +{userAchievement.achievement.points} pts
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="testimonials" className="p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Depoimentos
                </h3>
                {testimonials.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">
                      Nenhum depoimento ainda. Seja o primeiro a receber um!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testimonials.map((testimonial) => (
                      <Card key={testimonial.id} className="p-4 shadow-card hover:shadow-elevated transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold text-sm">
                            {testimonial.from_profile.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{testimonial.from_profile.display_name}</p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(testimonial.created_at!).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{testimonial.content}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="gallery" className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-accent" />
                  Galeria de Momentos (Quarto)
                </h3>
                <div className="text-center py-8">
                  <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h4 className="text-lg font-semibold mb-2">Sua galeria está vazia</h4>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Adicione fotos dos seus melhores momentos e compartilhe com seus amigos!
                  </p>
                  <Button 
                    onClick={() => setGalleryDialogOpen(true)}
                    className="gap-2 bg-gradient-orkut"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Adicionar Fotos
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="music" className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-secondary" />
                  Música da Casa
                </h3>
                {profile?.house_music ? (
                  <div className="space-y-4">
                    <Card className="p-4 bg-muted/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-orkut rounded-full flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Música de Fundo Ativa</p>
                          <p className="text-xs text-muted-foreground">Seus visitantes ouvirão esta música</p>
                        </div>
                      </div>
                      <div className="bg-background rounded p-2">
                        <p className="text-sm truncate">{profile.house_music}</p>
                      </div>
                    </Card>
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setMusicDialogOpen(true)}
                        className="gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Alterar Música
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h4 className="text-lg font-semibold mb-2">Nenhuma música definida</h4>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Adicione uma música de fundo do YouTube para tocar quando visitarem sua casa virtual!
                    </p>
                    <Button 
                      onClick={() => setMusicDialogOpen(true)}
                      className="gap-2 bg-gradient-orkut"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Adicionar Música
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Card>
          </Tabs>

          {/* Lista de Recados */}
          <div className="space-y-4">
            {loadingData ? (
              <Card className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando recados...</p>
              </Card>
            ) : scraps.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum recado ainda. Seja o primeiro!</p>
              </Card>
            ) : (
              scraps.map((scrap) => (
                <Card key={scrap.id} className="p-4 shadow-card hover:shadow-elevated transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold text-sm">
                      {scrap.from_profile.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{scrap.from_profile.display_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(scrap.created_at!).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{scrap.content}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Diálogos */}
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
      </div>
    </div>
  );
};

export default Profile;
