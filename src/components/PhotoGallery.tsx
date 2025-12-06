import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, FolderPlus, Upload, Grid3X3, Image as ImageIcon, Trash2 } from "lucide-react";
import { PhotoLightbox } from "./PhotoLightbox";
import { CreateAlbumDialog } from "./CreateAlbumDialog";

interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_photo_url: string | null;
  created_at: string;
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  album_id: string | null;
  created_at: string;
}

interface PhotoGalleryProps {
  userId: string;
  isOwner: boolean;
}

export const PhotoGallery = ({ userId, isOwner }: PhotoGalleryProps) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [uploadAlbumId, setUploadAlbumId] = useState<string>("none");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAlbums();
    fetchPhotos();
  }, [userId]);

  const fetchAlbums = async () => {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar álbuns:", error);
    } else {
      setAlbums(data || []);
    }
  };

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar fotos:", error);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (files.length > 20) {
      toast.error("Máximo de 20 fotos por vez");
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("gallery")
          .getPublicUrl(filePath);

        // Insert photo record
        const { error: insertError } = await supabase.from("gallery_photos").insert({
          user_id: userId,
          photo_url: publicUrl,
          album_id: uploadAlbumId === "none" ? null : uploadAlbumId,
        });

        if (insertError) throw insertError;

        return publicUrl;
      });

      await Promise.all(uploadPromises);
      toast.success(`${files.length} foto(s) enviada(s) com sucesso!`);
      fetchPhotos();
      
      // Update album cover if uploading to album
      if (uploadAlbumId !== "none") {
        const album = albums.find(a => a.id === uploadAlbumId);
        if (album && !album.cover_photo_url) {
          fetchAlbums();
        }
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar fotos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;

      // Delete from storage
      const path = photo.photo_url.split("/gallery/")[1];
      if (path) {
        await supabase.storage.from("gallery").remove([path]);
      }

      // Delete from database
      const { error } = await supabase.from("gallery_photos").delete().eq("id", photoId);
      if (error) throw error;

      toast.success("Foto excluída");
      setPhotos(photos.filter(p => p.id !== photoId));
      setLightboxOpen(false);
    } catch (error) {
      console.error("Erro ao excluir foto:", error);
      toast.error("Erro ao excluir foto");
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    try {
      // Move photos to no album
      await supabase
        .from("gallery_photos")
        .update({ album_id: null })
        .eq("album_id", albumId);

      // Delete album
      const { error } = await supabase.from("albums").delete().eq("id", albumId);
      if (error) throw error;

      toast.success("Álbum excluído");
      fetchAlbums();
      fetchPhotos();
      setSelectedAlbum(null);
    } catch (error) {
      console.error("Erro ao excluir álbum:", error);
      toast.error("Erro ao excluir álbum");
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const filteredPhotos = selectedAlbum
    ? photos.filter(p => p.album_id === selectedAlbum)
    : photos;

  const getAlbumPhotoCount = (albumId: string) => {
    return photos.filter(p => p.album_id === albumId).length;
  };

  const getAlbumCover = (album: Album) => {
    if (album.cover_photo_url) return album.cover_photo_url;
    const firstPhoto = photos.find(p => p.album_id === album.id);
    return firstPhoto?.photo_url;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Galeria de Fotos
          <Badge variant="secondary">{photos.length}</Badge>
        </CardTitle>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreateAlbumOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
              Novo Álbum
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Enviando..." : "Enviar Fotos"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isOwner && (
          <div className="mb-4">
            <Select value={uploadAlbumId} onValueChange={setUploadAlbumId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Álbum de destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem álbum</SelectItem>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" onClick={() => setSelectedAlbum(null)}>
              <Grid3X3 className="w-4 h-4 mr-2" />
              Todas ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="albums">
              <FolderPlus className="w-4 h-4 mr-2" />
              Álbuns ({albums.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma foto ainda</p>
                {isOwner && <p className="text-sm mt-1">Envie suas primeiras fotos!</p>}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filteredPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || "Foto"}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="albums">
            {albums.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum álbum ainda</p>
                {isOwner && <p className="text-sm mt-1">Crie seu primeiro álbum!</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albums.map((album) => (
                  <Card
                    key={album.id}
                    className="cursor-pointer group overflow-hidden"
                    onClick={() => {
                      setSelectedAlbum(album.id);
                      const tabsTrigger = document.querySelector('[value="all"]') as HTMLElement;
                      tabsTrigger?.click();
                    }}
                  >
                    <div className="aspect-square relative bg-muted">
                      {getAlbumCover(album) ? (
                        <img
                          src={getAlbumCover(album)}
                          alt={album.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderPlus className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-semibold text-white truncate">{album.name}</h3>
                        <p className="text-white/70 text-sm">{getAlbumPhotoCount(album.id)} fotos</p>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAlbum(album.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedAlbum && (
          <Button
            variant="link"
            className="mt-4"
            onClick={() => setSelectedAlbum(null)}
          >
            ← Ver todas as fotos
          </Button>
        )}
      </CardContent>

      <PhotoLightbox
        photos={filteredPhotos.map(p => ({ id: p.id, photo_url: p.photo_url, caption: p.caption || undefined }))}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onDelete={isOwner ? handleDeletePhoto : undefined}
        canDelete={isOwner}
      />

      <CreateAlbumDialog
        open={createAlbumOpen}
        onOpenChange={setCreateAlbumOpen}
        userId={userId}
        onAlbumCreated={fetchAlbums}
      />
    </Card>
  );
};
