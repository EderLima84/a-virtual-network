import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Music, ExternalLink, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAchievements } from "@/hooks/useAchievements";

interface MusicPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  currentMusic: string | null | undefined;
  onMusicUpdate: () => void;
}

const popularSongs = [
  { name: "Asa Branca - Luiz Gonzaga", url: "https://www.youtube.com/watch?v=lPO1fduUT5Y" },
  { name: "Feira de Mangaio - Sivuca", url: "https://www.youtube.com/watch?v=r3ygB7pPqQo" },
  { name: "Xote das Meninas - Luiz Gonzaga", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { name: "Vermelho - Fábio Jr.", url: "https://www.youtube.com/watch?v=J9tFZEWfH3s" },
];

export const MusicPlayerDialog = ({ open, onOpenChange, userId, currentMusic, onMusicUpdate }: MusicPlayerDialogProps) => {
  const { checkMusician } = useAchievements();
  const [musicUrl, setMusicUrl] = useState(currentMusic || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userId) return;

    // Validação básica de URL do YouTube
    if (musicUrl && !musicUrl.includes("youtube.com") && !musicUrl.includes("youtu.be")) {
      toast.error("Por favor, insira uma URL válida do YouTube");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          house_music: musicUrl.trim() || null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success(musicUrl ? "Música da casa atualizada!" : "Música removida");
      
      // Check for musician achievement if music was added
      if (musicUrl && userId) {
        await checkMusician(userId);
      }
      
      onMusicUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar música:", error);
      toast.error("Erro ao atualizar música");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Música da Casa
          </DialogTitle>
          <DialogDescription>
            Adicione uma música de fundo para sua casa virtual (YouTube)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="musicUrl">URL do YouTube</Label>
            <Input
              id="musicUrl"
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">
              Cole o link de um vídeo do YouTube que você quer como música de fundo
            </p>
          </div>

          <div className="space-y-2">
            <Label>Sugestões Populares</Label>
            <div className="grid gap-2">
              {popularSongs.map((song, index) => (
                <Card
                  key={index}
                  className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setMusicUrl(song.url)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">{song.name}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {currentMusic && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Música atual:</p>
              <p className="text-sm truncate">{currentMusic}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => setMusicUrl("")}
            disabled={saving || !musicUrl}
          >
            Remover Música
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-orkut">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
