import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, MessageCircle, Play, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type Video = Tables<"videos"> & {
  profiles: Tables<"profiles">;
  user_liked?: boolean;
};

export default function Cinema() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: "", description: "" });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const videoInputRef = useRef<HTMLInputElement>(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="bg-card border-b shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <img src="/portella-logo.jpg" alt="Portella Logo" className="h-12 w-auto" />
            </div>
            <Button onClick={() => setShowUploadForm(!showUploadForm)}>
              <Upload className="w-4 h-4 mr-2" />
              Postar Vídeo
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cinema</h1>
          <p className="text-muted-foreground">
            Compartilhe seus vídeos e reels com a comunidade
          </p>
        </div>

        {showUploadForm && (
          <Card className="mb-8 shadow-elevated">
            <CardHeader>
              <CardTitle>Postar Novo Vídeo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Título do vídeo"
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                maxLength={100}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newVideo.description}
                onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                maxLength={500}
                rows={3}
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
                <div className="relative bg-muted rounded-lg">
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-elevated transition-shadow">
              <div className="relative bg-black aspect-video">
                <video
                  src={video.video_url}
                  controls
                  className="w-full h-full"
                  preload="metadata"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold flex-shrink-0">
                    {video.profiles.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">{video.profiles.display_name}</p>
                  </div>
                </div>

                {video.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {video.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={() => toggleLike(video.id, video.user_liked || false)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        video.user_liked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    <span>{video.likes_count || 0}</span>
                  </button>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Play className="w-5 h-5" />
                    <span>{video.views_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {videos.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Play className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Nenhum vídeo ainda</h3>
                <p className="text-muted-foreground">
                  Seja o primeiro a compartilhar um vídeo!
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
