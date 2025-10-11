import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { CityIcon } from "@/components/CityIcon";
import { Button } from "@/components/ui/button";
import { Home, Users, BookOpen, Film, Shield, Building2, LogOut } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import Feed from "./Feed";
import Profile from "./Profile";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('feed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="bg-card border-b shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img src="/portella-logo.jpg" alt="Portella Logo" className="h-12 w-auto" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* City Map Navigation */}
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 mb-8 shadow-elevated">
          <h2 className="text-2xl font-bold mb-6 text-center">Navegue pela Cidade</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <CityIcon
              icon={Home}
              label="Minha Casa"
              active={activeSection === 'profile'}
              onClick={() => setActiveSection('profile')}
            />
            <CityIcon
              icon={Users}
              label="Praça Central"
              active={activeSection === 'feed'}
              onClick={() => setActiveSection('feed')}
            />
            <CityIcon
              icon={BookOpen}
              label="Clubes"
              active={activeSection === 'communities'}
              onClick={() => navigate('/clubs')}
            />
            <CityIcon
              icon={Film}
              label="Cinema"
              active={activeSection === 'media'}
              onClick={() => navigate('/cinema')}
            />
            <CityIcon
              icon={Shield}
              label="Delegacia"
              active={activeSection === 'moderation'}
              onClick={() => navigate('/moderation')}
            />
            <CityIcon
              icon={Building2}
              label="Prefeitura"
              active={activeSection === 'admin'}
              onClick={() => navigate('/city-hall')}
            />
          </div>
        </Card>

        {/* Content Area */}
        {activeSection === 'feed' && <Feed />}
        {activeSection === 'profile' && <Profile />}
        
        {activeSection !== 'feed' && activeSection !== 'profile' && (
          <Card className="p-8 shadow-elevated">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-orkut rounded-full mx-auto flex items-center justify-center animate-float">
                {activeSection === 'communities' && <BookOpen className="w-10 h-10 text-white" />}
                {activeSection === 'media' && <Film className="w-10 h-10 text-white" />}
                {activeSection === 'moderation' && <Shield className="w-10 h-10 text-white" />}
                {activeSection === 'admin' && <Building2 className="w-10 h-10 text-white" />}
              </div>
              <h2 className="text-3xl font-bold">
                {activeSection === 'communities' && 'Clubes e Comunidades'}
                {activeSection === 'media' && 'Cinema Digital'}
                {activeSection === 'moderation' && 'Delegacia - Moderação'}
                {activeSection === 'admin' && 'Prefeitura'}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {activeSection === 'communities' && 'Participe de clubes baseados em seus interesses e hobbies.'}
                {activeSection === 'media' && 'Compartilhe fotos e vídeos. Veja o conteúdo mais popular da semana.'}
                {activeSection === 'moderation' && 'Sistema de moderação comunitária para manter a cidade segura.'}
                {activeSection === 'admin' && 'Participe das decisões da comunidade e veja anúncios oficiais.'}
              </p>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  🚧 Esta seção está em desenvolvimento. Em breve teremos mais funcionalidades!
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
