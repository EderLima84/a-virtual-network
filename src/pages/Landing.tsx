import { Button } from "@/components/ui/button";
import { Home, Users, BookOpen, Film, Shield, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Home,
      title: "Casas Virtuais",
      description: "Seu perfil é sua casa. Decore, personalize e receba visitantes!"
    },
    {
      icon: Users,
      title: "Praça Central",
      description: "Encontre amigos, compartilhe momentos e participe da comunidade."
    },
    {
      icon: BookOpen,
      title: "Clubes",
      description: "Junte-se a comunidades com seus interesses e hobbies."
    },
    {
      icon: Film,
      title: "Cinema",
      description: "Compartilhe fotos, vídeos e momentos especiais."
    },
    {
      icon: Shield,
      title: "Delegacia",
      description: "Moderação comunitária para um ambiente seguro."
    },
    {
      icon: Building2,
      title: "Prefeitura",
      description: "Participe das decisões da cidade digital."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-block">
            <img src="/orkadia-logo.jpg" alt="Orkadia Logo" className="mx-auto mb-4 w-32 h-32 rounded-full" />
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Bem-vindo à cidade virtual onde nostalgia encontra inovação
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Uma rede social inspirada no clássico Orkut, mas com recursos modernos. 
            Construa sua casa virtual, participe da praça central e faça parte desta comunidade única!
          </p>
          
          <div className="flex gap-4 justify-center pt-4">
            <Button 
              size="lg"
              className="bg-gradient-orkut hover:opacity-90 text-white shadow-glow text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              Entrar na Cidade
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 text-lg px-8"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Criar Conta
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Explore a Cidade
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-3 bg-gradient-orkut rounded-full w-fit mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-orkut rounded-2xl p-12 text-center text-white shadow-elevated">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Junte-se a milhares de pessoas que já fazem parte do Orkadia
          </p>
          <Button 
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg px-8"
            onClick={() => navigate('/auth?mode=signup')}
          >
            Criar Minha Casa Virtual
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
