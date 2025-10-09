import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Music, Film, Palette, BookOpen, Gamepad2, Heart, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type Community = Tables<"communities"> & {
  is_member?: boolean;
};

const categoryIcons: Record<string, any> = {
  Cultura: Palette,
  Música: Music,
  Filmes: Film,
  Animes: Gamepad2,
  Livros: BookOpen,
  Outros: Heart,
};

export default function Clubs() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const navigate = useNavigate();

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: communitiesData, error } = await supabase
        .from("communities")
        .select("*")
        .order("members_count", { ascending: false });

      if (error) throw error;

      if (user) {
        const { data: memberships } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id);

        const membershipIds = new Set(memberships?.map(m => m.community_id) || []);
        
        const enrichedData = communitiesData.map(community => ({
          ...community,
          is_member: membershipIds.has(community.id),
        }));

        setCommunities(enrichedData);
      } else {
        setCommunities(communitiesData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar clubes:", error);
      toast.error("Erro ao carregar clubes");
    } finally {
      setLoading(false);
    }
  };

  const toggleMembership = async (communityId: string, isMember: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      if (isMember) {
        const { error } = await supabase
          .from("community_members")
          .delete()
          .eq("community_id", communityId)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Você saiu do clube");
      } else {
        const { error } = await supabase
          .from("community_members")
          .insert({
            community_id: communityId,
            user_id: user.id,
            role: "member",
          });

        if (error) throw error;
        toast.success("Você entrou no clube!");
      }

      loadCommunities();
    } catch (error) {
      console.error("Erro ao atualizar inscrição:", error);
      toast.error("Erro ao atualizar inscrição");
    }
  };

  const categories = ["Todos", ...Object.keys(categoryIcons)];
  
  const filteredCommunities = activeCategory === "Todos" 
    ? communities 
    : communities.filter(c => c.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="bg-card border-b shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Clubes</h1>
          <p className="text-muted-foreground">
            Encontre pessoas com os mesmos interesses que você
          </p>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => {
            const Icon = categoryIcons[community.category] || Heart;
            
            return (
              <Card key={community.id} className="hover:shadow-elevated transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-orkut rounded-lg">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{community.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {community.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-3">
                    {community.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{community.members_count || 0} membros</span>
                    </div>
                    
                    <Button
                      variant={community.is_member ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleMembership(community.id, community.is_member || false)}
                    >
                      {community.is_member ? "Sair" : "Entrar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCommunities.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Users className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Nenhum clube encontrado</h3>
                <p className="text-muted-foreground">
                  {activeCategory === "Todos" 
                    ? "Ainda não há clubes criados" 
                    : `Não há clubes na categoria ${activeCategory}`}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
