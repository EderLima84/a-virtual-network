-- Script para aplicar manualmente no Supabase SQL Editor
-- Adiciona o campo updated_at à tabela friend_requests se não existir

DO $$ 
BEGIN
  -- Verificar se a coluna existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friend_requests' 
    AND column_name = 'updated_at'
  ) THEN
    -- Adicionar coluna updated_at
    ALTER TABLE public.friend_requests 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    
    RAISE NOTICE 'Coluna updated_at adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna updated_at já existe';
  END IF;
  
  -- Recriar o trigger (caso exista)
  DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON public.friend_requests;
  
  -- Verificar se a função handle_updated_at existe
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at'
  ) THEN
    CREATE TRIGGER update_friend_requests_updated_at
      BEFORE UPDATE ON public.friend_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
      
    RAISE NOTICE 'Trigger criado com sucesso!';
  ELSE
    RAISE NOTICE 'Função handle_updated_at não encontrada. Criando...';
    
    -- Criar a função handle_updated_at se não existir
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Criar o trigger
    CREATE TRIGGER update_friend_requests_updated_at
      BEFORE UPDATE ON public.friend_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
      
    RAISE NOTICE 'Função e trigger criados com sucesso!';
  END IF;
END $$;

-- Verificar o resultado
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'friend_requests'
ORDER BY ordinal_position;
