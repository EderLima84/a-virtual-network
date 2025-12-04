import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Users, BookOpen, Film, Shield, Building2, LogOut, Search, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import portellaLogo from "@/assets/portella-logo.png";
import { CityIcon } from "./CityIcon";
import { NotificationBell } from "./NotificationBell";

export const CityNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const getActiveSection = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "feed";
    if (path === "/explore") return "explore";
    if (path === "/clubs") return "clubs";
    if (path === "/cinema") return "cinema";
    if (path === "/moderation") return "moderation";
    if (path === "/city-hall") return "city-hall";
    return "";
  };

  const activeSection = getActiveSection();

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={portellaLogo} 
              alt="Portella Logo" 
              className="h-12 w-auto cursor-pointer" 
              onClick={() => navigate("/dashboard")}
            />
            <div className="flex items-center gap-4">
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
                {user?.email}
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
        <Card className="p-6 mb-8 shadow-elevated">
          <h2 className="text-2xl font-bold mb-6 text-center">Navegue pela Cidade</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <CityIcon
              icon={Home}
              label="Minha Casa"
              active={false}
              onClick={() => navigate('/dashboard')}
            />
            <CityIcon
              icon={Users}
              label="Praça Central"
              active={activeSection === 'feed'}
              onClick={() => navigate('/dashboard')}
            />
            <CityIcon
              icon={Search}
              label="Explorar"
              active={activeSection === 'explore'}
              onClick={() => navigate('/explore')}
            />
            <CityIcon
              icon={BookOpen}
              label="Clubes"
              active={activeSection === 'clubs'}
              onClick={() => navigate('/clubs')}
            />
            <CityIcon
              icon={Film}
              label="Cinema"
              active={activeSection === 'cinema'}
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
              active={activeSection === 'city-hall'}
              onClick={() => navigate('/city-hall')}
            />
          </div>
        </Card>
      </div>
    </>
  );
};
