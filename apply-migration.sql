-- Script para aplicar manualmente no Supabase SQL Editor
-- Adiciona o campo updated_at à tabela friend_requests se não existir

-- Passo 1: Adicionar coluna updated_at (se não existir)
ALTER TABLE public.friend_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Passo 2: Criar função handle_updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passo 3: Remover trigger antigo (se existir)
DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON public.friend_requests;

-- Passo 4: Criar novo trigger
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Passo 5: Verificar o resultado
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'friend_requests'
ORDER BY ordinal_position;
