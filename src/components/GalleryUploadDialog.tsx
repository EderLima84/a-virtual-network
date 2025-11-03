import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GalleryUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  onUploadComplete: () => void;
}

export const GalleryUploadDialog = ({ open, onOpenChange, userId, onUploadComplete }: GalleryUploadDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > 10) {
      toast.error("Máximo de 10 fotos por vez");
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleUpload = async () => {
    if (!userId || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      await Promise.all(uploadPromises);

      toast.success(`${selectedFiles.length} foto(s) enviada(s) com sucesso!`);
      
      // Clean up
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      
      onUploadComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar fotos");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-accent" />
            Adicionar Fotos ao Quarto
          </DialogTitle>
          <DialogDescription>
            Envie até 10 fotos de uma vez para sua galeria pessoal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selecionar Fotos</Label>
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Clique para selecionar ou arraste arquivos aqui
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP (máx. 5MB por arquivo)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {previewUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Fotos Selecionadas ({previewUrls.length})</Label>
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                {previewUrls.map((url, index) => (
                  <Card key={index} className="relative aspect-square overflow-hidden group">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              previewUrls.forEach(url => URL.revokeObjectURL(url));
              setSelectedFiles([]);
              setPreviewUrls([]);
              onOpenChange(false);
            }} 
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploading || selectedFiles.length === 0}
            className="bg-gradient-orkut"
          >
            {uploading ? "Enviando..." : `Enviar ${selectedFiles.length} Foto(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
