import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Music, Film, Palette, BookOpen, Gamepad2, Heart, Plus, ArrowLeft, TrendingUp, MessageSquare, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
          </div>
        </div>
      </header>

      {/* Banner de Boas-vindas */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b">
        <div className="container mx-auto px-6 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Clubes da Portella
            <Sparkles className="w-8 h-8 text-primary" />
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Os Clubes são o coração da cidade. Aqui, quem compartilha, cria laços — e quem cria, faz história.
          </p>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">

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
              <Card key={community.id} className="group hover:shadow-elevated transition-all hover:scale-[1.02] bg-card/95 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-gradient-orkut rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{community.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {community.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3 min-h-[60px]">
                    {community.description}
                  </CardDescription>
                  
                  {/* Stats do Clube */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium">{community.members_count || 0}</span>
                      <span className="text-xs">membros</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs">Ativo</span>
                    </div>
                  </div>

                  {/* Última Atividade */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                    <MessageSquare className="w-3 h-3" />
                    <span>Últimas postagens esta semana</span>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <Button
                      variant={community.is_member ? "outline" : "default"}
                      className="flex-1"
                      onClick={() => toggleMembership(community.id, community.is_member || false)}
                    >
                      {community.is_member ? "Sair" : "Entrar"}
                    </Button>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCommunities.length === 0 && (
          <Card className="p-12 text-center bg-card/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Users className="w-16 h-16 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">
                  {activeCategory === "Todos" 
                    ? "🤝 Nenhum clube foi criado ainda" 
                    : `Nenhum clube encontrado em ${activeCategory}`}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {activeCategory === "Todos"
                    ? "Que tal fundar o primeiro e marcar seu nome na história da cidade?"
                    : `Seja o pioneiro a criar um clube de ${activeCategory}!`}
                </p>
              </div>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Criar um Clube
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
