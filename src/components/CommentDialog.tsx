import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type Comment = Tables<"comments"> & {
  profiles: Tables<"profiles">;
};

interface CommentDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentDialog = ({ postId, isOpen, onClose }: CommentDialogProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles (*)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
      toast.error("Erro ao carregar comentários");
    } finally {
      setLoading(false);
    }
  };

  const createComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      toast.success("Comentário adicionado!");
      loadComments();
    } catch (error) {
      console.error("Erro ao criar comentário:", error);
      toast.error("Erro ao adicionar comentário");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Comentários</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold flex-shrink-0">
                    {comment.profiles.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{comment.profiles.display_name}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at!).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                createComment();
              }
            }}
          />
          <Button
            onClick={createComment}
            disabled={!newComment.trim() || submitting}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
