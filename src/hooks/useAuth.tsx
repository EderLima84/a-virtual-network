import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          display_name: displayName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      navigate('/dashboard');
    }
    return { error };
  };
  
  // Função para login direto com credenciais específicas
  const signInWithCredentials = async () => {
    const email = "edercleidiane2018@gmail.com";
    const uuid = "ea58ab22-9e00-4bd5-9c25-c3caaa255bd0";
    
    try {
      // Atualiza o estado do usuário diretamente com as credenciais fornecidas
      // Criando um objeto que satisfaz o tipo User do Supabase
      const fakeUser: User = {
        id: uuid,
        email: email,
        user_metadata: {
          username: "edercleidiane",
          display_name: "Edercleidiane"
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
        role: "authenticated",
        updated_at: new Date().toISOString()
      } as User;
      
      setUser(fakeUser);
      setLoading(false);
      navigate('/profile');
      return { error: null };
    } catch (error) {
      console.error("Erro ao fazer login com credenciais:", error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithCredentials,
  };
};
