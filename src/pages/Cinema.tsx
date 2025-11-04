import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, X, Heart, MessageCircle, Share2, Bookmark, Film, Award, TrendingUp, Clock, Sparkles, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Video = Tables<"videos"> & {
  profiles: Tables<"profiles">;
  user_liked?: boolean;
};

export default function Cinema() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [newVideo, setNewVideo] = useState({ title: "", description: "" });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: videosData, error } = await supabase
        .from("videos")
        .select(`
          *,
          profiles (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (user) {
        const { data: likes } = await supabase
          .from("video_likes")
          .select("video_id")
          .eq("user_id", user.id);

        const likedVideoIds = new Set(likes?.map(l => l.video_id) || []);

        const enrichedVideos = videosData.map(video => ({
          ...video,
          user_liked: likedVideoIds.has(video.id),
        }));

        setVideos(enrichedVideos);
      } else {
        setVideos(videosData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar vídeos:", error);
      toast.error("Erro ao carregar vídeos");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Vídeo muito grande! Máximo 100MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview("");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const uploadVideo = async () => {
    if (!videoFile || !newVideo.title.trim()) {
      toast.error("Título e vídeo são obrigatórios");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("videos")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          title: newVideo.title.trim(),
          description: newVideo.description.trim(),
          video_url: publicUrl,
        });

      if (insertError) throw insertError;

      toast.success("Vídeo postado com sucesso!");
      setShowUploadForm(false);
      setNewVideo({ title: "", description: "" });
      removeVideo();
      loadVideos();
    } catch (error) {
      console.error("Erro ao postar vídeo:", error);
      toast.error("Erro ao postar vídeo");
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (videoId: string, isLiked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      if (isLiked) {
        const { error } = await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("video_likes")
          .insert({
            video_id: videoId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      loadVideos();
    } catch (error) {
      console.error("Erro ao curtir vídeo:", error);
      toast.error("Erro ao curtir vídeo");
    }
  };

  const getFilteredVideos = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    switch (activeTab) {
      case "trending":
        return [...videos].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 10);
      case "recent":
        return [...videos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
      case "week":
        return videos.filter(v => new Date(v.created_at) >= oneWeekAgo).sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      default:
        return videos;
    }
  };

  const filteredVideos = getFilteredVideos();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [filteredVideos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="text-center">
          <Film className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-white/80">Carregando o Cinema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header Cinema Style */}
      <header className="bg-black/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:text-primary"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Film className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-white font-bold text-lg">Cinema Portella</h1>
                  <p className="text-white/60 text-xs">Onde cada história ganha luz</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowUploadForm(!showUploadForm)} className="bg-primary hover:bg-primary/90">
              <Upload className="w-4 h-4 mr-2" />
              🎬 Gravar seu curta!
            </Button>
          </div>
        </div>
      </header>

      {/* Banner de Boas-vindas */}
      <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-y border-primary/30 py-6">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Bem-vindo ao Cinema Portella
            <Sparkles className="w-6 h-6 text-primary" />
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Aqui no Cinema Portella, cada vídeo é um pedaço da alma da cidade — histórias, risos e verdades projetadas no coração do sertão digital.
          </p>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-black/50 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <Input
                placeholder="Título do vídeo"
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                maxLength={100}
                className="bg-black/30 border-primary/20 text-white"
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newVideo.description}
                onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                maxLength={500}
                rows={3}
                className="bg-black/30 border-primary/20 text-white"
              />

              <div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoSelect}
                />
                <Button
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Vídeo
                </Button>
              </div>

              {videoPreview && (
                <div className="relative bg-black rounded-lg">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-96 rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeVideo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={uploadVideo}
                  disabled={!videoFile || !newVideo.title.trim() || uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Postando...
                    </>
                  ) : (
                    "Postar Vídeo"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadForm(false);
                    setNewVideo({ title: "", description: "" });
                    removeVideo();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de Filtros */}
      <div className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-black/50 border border-primary/20">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary">
              <Film className="w-4 h-4 mr-2" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-primary">
              <TrendingUp className="w-4 h-4 mr-2" />
              Em Alta
            </TabsTrigger>
            <TabsTrigger value="week" className="data-[state=active]:bg-primary">
              <Award className="w-4 h-4 mr-2" />
              Mais Assistidos
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-primary">
              <Clock className="w-4 h-4 mr-2" />
              Estreias Recentes
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Feed de Vídeos Estilo Reels */}
      <div className="container mx-auto px-4 pb-6">
        {filteredVideos.length === 0 ? (
          <Card className="p-12 text-center bg-black/50 border-primary/20">
            <div className="flex flex-col items-center gap-4">
              <Film className="w-16 h-16 text-primary" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">Nenhum vídeo encontrado</h3>
                <p className="text-white/60">
                  Seja o primeiro a projetar sua história no telão da cidade!
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video, index) => (
              <Card key={video.id} className="group overflow-hidden bg-black/50 border-primary/20 hover:border-primary/50 transition-all">
                <CardContent className="p-0 relative aspect-[9/16]">
                  {/* Video */}
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={video.video_url}
                    className="w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                  />
                  
                  {/* Overlay de Informações */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                      {/* Perfil do Criador */}
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-primary">
                          <AvatarImage src={video.profiles?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {video.profiles?.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">
                            {video.profiles?.display_name || "Anônimo"}
                          </p>
                          <p className="text-white/60 text-xs">@{video.profiles?.username || "desconhecido"}</p>
                        </div>
                      </div>

                      {/* Título e Descrição */}
                      <div>
                        <h3 className="text-white font-bold text-lg line-clamp-2">{video.title}</h3>
                        {video.description && (
                          <p className="text-white/80 text-sm line-clamp-2 mt-1">{video.description}</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-white/80">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{video.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">0</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{video.views_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação Flutuantes */}
                    <div className="absolute right-4 bottom-24 flex flex-col gap-4">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`rounded-full w-12 h-12 ${
                          video.user_liked ? "bg-primary text-white" : "bg-black/50 text-white hover:bg-primary/50"
                        }`}
                        onClick={() => toggleLike(video.id, video.user_liked || false)}
                      >
                        <Heart className={`w-6 h-6 ${video.user_liked ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full w-12 h-12 bg-black/50 text-white hover:bg-primary/50"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full w-12 h-12 bg-black/50 text-white hover:bg-primary/50"
                      >
                        <Share2 className="w-6 h-6" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full w-12 h-12 bg-black/50 text-white hover:bg-primary/50"
                      >
                        <Bookmark className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
