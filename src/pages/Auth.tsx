import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import portellaLogo from "@/assets/portella-logo.png";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  username: z.string()
    .min(3, "Nome de usuário deve ter no mínimo 3 caracteres")
    .max(20, "Nome de usuário deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário só pode conter letras, números e _"),
  displayName: z.string()
    .min(2, "Nome de exibição deve ter no mínimo 2 caracteres")
    .max(50, "Nome de exibição deve ter no máximo 50 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    setErrors({});
    
    try {
      if (mode === 'signup') {
        signupSchema.parse({ email, password, username, displayName });
      } else {
        loginSchema.parse({ email, password });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, username, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email já está cadastrado');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Conta criada! Redirecionando...');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Login realizado com sucesso!');
        }
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img src={portellaLogo} alt="Portella Logo" className="w-48 h-auto" />
          </div>
          <CardTitle className="text-3xl bg-gradient-orkut bg-clip-text text-transparent">
            {mode === 'login' ? 'Entrar no Portella' : 'Criar sua Casa Virtual'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Entre com suas credenciais para acessar sua casa' 
              : 'Preencha os dados para criar sua conta'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="seunome"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={errors.username ? "border-destructive" : ""}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Seu Nome Completo"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={errors.displayName ? "border-destructive" : ""}
                  />
                  {errors.displayName && (
                    <p className="text-xs text-destructive">{errors.displayName}</p>
                  )}
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
              {mode === 'signup' && !errors.password && (
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, 1 maiúscula e 1 número
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-orkut hover:opacity-90 text-white"
              disabled={loading}
            >
              {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrors({});
              }}
              className="text-sm text-primary hover:underline"
            >
              {mode === 'login' 
                ? 'Não tem conta? Criar uma agora' 
                : 'Já tem conta? Fazer login'
              }
            </button>
          </div>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground block w-full"
            >
              Voltar para o início
            </button>
            <div className="text-xs text-muted-foreground">
              Ao criar uma conta, você concorda com nossos{' '}
              <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
              {' '}e{' '}
              <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;