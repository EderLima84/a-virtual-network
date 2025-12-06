import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
}

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (photoId: string) => void;
  canDelete?: boolean;
}

export const PhotoLightbox = ({
  photos,
  initialIndex,
  open,
  onOpenChange,
  onDelete,
  canDelete = false,
}: PhotoLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, currentIndex]);

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative flex items-center justify-center min-h-[80vh]">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Delete button */}
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 z-50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              onClick={() => onDelete(currentPhoto.id)}
            >
              <Trash2 className="w-6 h-6" />
            </Button>
          )}

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={handleNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <img
            src={currentPhoto.photo_url}
            alt={currentPhoto.caption || "Foto"}
            className="max-w-full max-h-[85vh] object-contain"
          />

          {/* Caption and counter */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex justify-between items-end">
              <p className="text-white text-lg">
                {currentPhoto.caption || ""}
              </p>
              <span className="text-white/70 text-sm">
                {currentIndex + 1} / {photos.length}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
