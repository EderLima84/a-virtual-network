import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CityNavigation } from '@/components/CityNavigation';
import { Shield, Eye, MessageSquare, UserPlus, Save } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type PrivacySetting = Database['public']['Enums']['privacy_setting'];

interface PrivacySettingsData {
  who_can_see_posts: PrivacySetting;
  who_can_send_requests: PrivacySetting;
}

export default function PrivacySettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettingsData>({
    who_can_see_posts: 'todos',
    who_can_send_requests: 'todos'
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    loadSettings();
  }, [user, authLoading, navigate]);

  const loadSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading settings:', error);
    }

    if (data) {
      setSettings({
        who_can_see_posts: data.who_can_see_posts || 'todos',
        who_can_send_requests: data.who_can_send_requests || 'todos'
      });
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('privacy_settings')
      .upsert({
        user_id: user.id,
        who_can_see_posts: settings.who_can_see_posts,
        who_can_send_requests: settings.who_can_send_requests,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      toast.error('Erro ao salvar configurações');
      console.error('Error saving settings:', error);
    } else {
      toast.success('🔒 Configurações de privacidade salvas!');
    }
    
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const privacyOptions = [
    { value: 'todos', label: '🌍 Todos', description: 'Qualquer pessoa na cidade' },
    { value: 'amigos_de_amigos', label: '👥 Amigos de amigos', description: 'Seus vizinhos e vizinhos deles' },
    { value: 'ninguem', label: '🔒 Ninguém', description: 'Apenas você' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <CityNavigation />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto flex items-center justify-center mb-4 shadow-elevated">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              Configurações de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Controle quem pode interagir com você na cidade Portella
            </p>
          </div>

          <Card className="shadow-elevated border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Visibilidade dos Posts
              </CardTitle>
              <CardDescription>
                Escolha quem pode ver suas publicações na Praça Central
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="who_can_see_posts">Quem pode ver meus posts?</Label>
                <Select
                  value={settings.who_can_see_posts}
                  onValueChange={(value: PrivacySetting) => 
                    setSettings(prev => ({ ...prev, who_can_see_posts: value }))
                  }
                >
                  <SelectTrigger id="who_can_see_posts" className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {privacyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elevated border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Convites de Convivência
              </CardTitle>
              <CardDescription>
                Controle quem pode enviar pedidos de amizade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="who_can_send_requests">Quem pode me cumprimentar na praça?</Label>
                <Select
                  value={settings.who_can_send_requests}
                  onValueChange={(value: PrivacySetting) => 
                    setSettings(prev => ({ ...prev, who_can_send_requests: value }))
                  }
                >
                  <SelectTrigger id="who_can_send_requests" className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {privacyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elevated border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Mensagens Privadas
              </CardTitle>
              <CardDescription>
                Apenas vizinhos próximos e amigos da varanda podem enviar mensagens privadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Esta configuração é automática baseada no seu nível de amizade. Você precisa ser pelo menos "Vizinho Próximo" para trocar mensagens privadas com alguém.
              </p>
            </CardContent>
          </Card>

          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="w-full gap-2"
            size="lg"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </main>
    </div>
  );
}