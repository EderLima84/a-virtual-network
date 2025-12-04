import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { CityIcon } from "@/components/CityIcon";
import { Button } from "@/components/ui/button";
import { Home, Users, BookOpen, Film, Shield, Building2, LogOut, Volume2, VolumeX, Search, Settings } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import Feed from "./Feed";
import Profile from "./Profile";
import portellaLogo from "@/assets/portella-logo.png";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { NotificationBell } from "@/components/NotificationBell";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('feed');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const { gradient, greeting, emoji } = useTimeOfDay();

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
    <div 
      className="min-h-screen transition-all duration-1000"
      style={{
        background: `linear-gradient(135deg, ${gradient}, var(--background))`
      }}
    >
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={portellaLogo} alt="Portella Logo" className="h-12 w-auto" />
              <div className="hidden md:flex items-center gap-2 text-lg font-medium text-foreground">
                <span>{emoji}</span>
                <span>{greeting}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="gap-2 hidden md:flex"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-xs">Sons</span>
              </Button>
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/privacy-settings')}
                title="Configurações de Privacidade"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* City Map Navigation */}
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 mb-8 shadow-elevated bg-card/90 backdrop-blur-sm border-2">
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Navegue pela Cidade Portella
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
              icon={Search}
              label="Explorar"
              active={false}
              onClick={() => navigate('/explore')}
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
