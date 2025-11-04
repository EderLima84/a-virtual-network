-- Criar tabela para posts de clubes
CREATE TABLE IF NOT EXISTS public.club_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para comentários de posts de clubes
CREATE TABLE IF NOT EXISTS public.club_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.club_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para curtidas de posts de clubes
CREATE TABLE IF NOT EXISTS public.club_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.club_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Criar tabela para eventos de clubes
CREATE TABLE IF NOT EXISTS public.club_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

-- Policies para club_posts
CREATE POLICY "Club posts são visíveis para membros do clube"
  ON public.club_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = club_posts.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem criar posts no clube"
  ON public.club_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = club_posts.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar seus próprios posts"
  ON public.club_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para club_post_comments
CREATE POLICY "Comentários são visíveis para membros"
  ON public.club_post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_posts
      JOIN public.community_members ON community_members.community_id = club_posts.community_id
      WHERE club_posts.id = club_post_comments.post_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem comentar"
  ON public.club_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários"
  ON public.club_post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para club_post_likes
CREATE POLICY "Curtidas são visíveis para membros"
  ON public.club_post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_posts
      JOIN public.community_members ON community_members.community_id = club_posts.community_id
      WHERE club_posts.id = club_post_likes.post_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem curtir posts"
  ON public.club_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Membros podem descurtir posts"
  ON public.club_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para club_events
CREATE POLICY "Eventos são visíveis para membros"
  ON public.club_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = club_events.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem criar eventos"
  ON public.club_events FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = club_events.community_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Triggers para atualizar contadores
CREATE OR REPLACE FUNCTION update_club_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.club_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.club_posts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_club_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.club_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.club_posts 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER club_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.club_post_likes
FOR EACH ROW EXECUTE FUNCTION update_club_post_likes_count();

CREATE TRIGGER club_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.club_post_comments
FOR EACH ROW EXECUTE FUNCTION update_club_post_comments_count();

-- Inserir alguns clubes iniciais para inspirar
INSERT INTO public.communities (name, description, category, creator_id, icon)
SELECT 
  'Forró e Vaquejada Digital',
  'O ritmo do Nordeste bate forte aqui! Compartilhe músicas, eventos e histórias do forró e da vaquejada.',
  'Música',
  (SELECT id FROM auth.users LIMIT 1),
  '🎶'
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE name = 'Forró e Vaquejada Digital');

INSERT INTO public.communities (name, description, category, creator_id, icon)
SELECT 
  'Cine Portella',
  'Para os amantes da sétima arte! Discuta filmes, séries e compartilhe recomendações.',
  'Filmes',
  (SELECT id FROM auth.users LIMIT 1),
  '🎬'
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE name = 'Cine Portella');

INSERT INTO public.communities (name, description, category, creator_id, icon)
SELECT 
  'Poetas Nordestinos',
  'Versos que nascem do coração do sertão. Compartilhe poesia, cordel e prosa.',
  'Livros',
  (SELECT id FROM auth.users LIMIT 1),
  '📚'
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE name = 'Poetas Nordestinos');

INSERT INTO public.communities (name, description, category, creator_id, icon)
SELECT 
  'Dev Sertanejo',
  'Programadores da Caatinga! Tecnologia, código e inovação com sotaque nordestino.',
  'Outros',
  (SELECT id FROM auth.users LIMIT 1),
  '💻'
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE name = 'Dev Sertanejo');

INSERT INTO public.communities (name, description, category, creator_id, icon)
SELECT 
  'Histórias do Sertão',
  'Causos, lendas e memórias que constroem nossa identidade. Conte sua história!',
  'Cultura',
  (SELECT id FROM auth.users LIMIT 1),
  '🤠'
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE name = 'Histórias do Sertão');

INSERT INTO public.communities (name, description, category, creator_id, icon)
SELECT 
  'Artes e Cultura Nordestina',
  'Artesanato, dança, música, pintura... A arte do Nordeste é infinita!',
  'Cultura',
  (SELECT id FROM auth.users LIMIT 1),
  '🎨'
WHERE NOT EXISTS (SELECT 1 FROM public.communities WHERE name = 'Artes e Cultura Nordestina');