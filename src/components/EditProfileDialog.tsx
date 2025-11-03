import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useAchievements } from "@/hooks/useAchievements";

type ProfileData = Tables<"profiles">;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData | null;
  onProfileUpdate: () => void;
}

const themeOptions = [
  { value: "default", label: "Padrão" },
  { value: "sunset", label: "Pôr do Sol" },
  { value: "ocean", label: "Oceano" },
  { value: "forest", label: "Floresta" },
  { value: "desert", label: "Deserto" },
  { value: "nordeste", label: "Nordestino" },
];

export const EditProfileDialog = ({ open, onOpenChange, profile, onProfileUpdate }: EditProfileDialogProps) => {
  const { checkWriter } = useAchievements();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [houseTheme, setHouseTheme] = useState(profile?.house_theme || "default");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;

    if (!displayName.trim() || !username.trim()) {
      toast.error("Nome e usuário são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          house_theme: houseTheme,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      
      // Check for writer achievement if bio is long enough
      if (bio.trim().length >= 20) {
        await checkWriter(profile.id);
      }
      
      onProfileUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      if (error.message?.includes("duplicate key")) {
        toast.error("Este nome de usuário já está em uso");
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Personalize suas informações e a aparência da sua casa virtual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome completo"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="seunome"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Apenas letras minúsculas, números e underline
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Tema da Casa</Label>
            <Select value={houseTheme} onValueChange={setHouseTheme}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-orkut">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
