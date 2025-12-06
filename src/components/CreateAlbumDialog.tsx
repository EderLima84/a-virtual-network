import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FolderPlus } from "lucide-react";

interface CreateAlbumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  onAlbumCreated: () => void;
}

export const CreateAlbumDialog = ({ open, onOpenChange, userId, onAlbumCreated }: CreateAlbumDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!userId || !name.trim()) {
      toast.error("Nome do álbum é obrigatório");
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from("albums").insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success("Álbum criado com sucesso!");
      setName("");
      setDescription("");
      onAlbumCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar álbum:", error);
      toast.error("Erro ao criar álbum");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-primary" />
            Criar Novo Álbum
          </DialogTitle>
          <DialogDescription>
            Organize suas fotos em álbuns temáticos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="album-name">Nome do Álbum *</Label>
            <Input
              id="album-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem ao Sertão"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="album-description">Descrição (opcional)</Label>
            <Textarea
              id="album-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva seu álbum..."
              rows={3}
              maxLength={200}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? "Criando..." : "Criar Álbum"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
