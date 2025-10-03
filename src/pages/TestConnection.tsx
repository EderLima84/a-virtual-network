import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const TestConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>("Verificando...");
  const [error, setError] = useState<string | null>(null);
  const { signInWithCredentials } = useAuth();

  const expectedTables = [
    'profiles',
    'achievements',
    'comments',
    'communities',
    'community_members',
    'posts',
    'scraps',
    'testimonials',
    'user_achievements',
    'user_roles'
  ];

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus("Verificando conexão...");
      setError(null);

      // 1. Test basic connection
      const { error: connectionError } = await supabase.from('profiles').select('id').limit(1);
      if (connectionError) throw connectionError;
      setConnectionStatus("Conectado ao Supabase com sucesso!");

    } catch (err: any) {
      setConnectionStatus("Falha na conexão");
      setError(err.message || "Erro desconhecido");
      console.error("Erro na conexão:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-2xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Teste de Conexão e Tabelas Supabase</h1>
        
        <div className="space-y-4">
          <div className="p-4 rounded-md bg-muted">
            <h2 className="font-semibold mb-2">Status da Conexão:</h2>
            <p className={`${connectionStatus.includes("sucesso") ? "text-green-500" : connectionStatus.includes("Falha") ? "text-red-500" : "text-yellow-500"} font-medium`}>
              {connectionStatus}
            </p>
            {error && (
              <div className="mt-2 p-2 bg-red-100 text-red-800 rounded text-sm">
                <p className="font-semibold">Erro:</p>
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-md bg-muted">
            <h2 className="font-semibold mb-2">Tabelas Esperadas no Banco de Dados:</h2>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {expectedTables.map(table => (
                <li key={table} className="truncate text-green-500">
                  &#10004; {table}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button onClick={testConnection} variant="default">
              Testar Novamente
            </Button>
            <Button onClick={() => signInWithCredentials()} variant="secondary">
              Login com Credenciais Fornecidas
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TestConnection;