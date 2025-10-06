-- Create announcements table for Coreto Digital
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and allow public read
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Announcements are viewable by everyone"
    ON public.announcements
    FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create testimonials table (Depoimentos)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT testimonials_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT testimonials_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS and policies mirroring scraps behavior
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view testimonials to or from them"
    ON public.testimonials
    FOR SELECT
    USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create testimonials"
    ON public.testimonials
    FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete testimonials on their wall"
    ON public.testimonials
    FOR DELETE
    USING (auth.uid() = to_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Weekly ranking function used by the feed
CREATE OR REPLACE FUNCTION public.calculate_weekly_ranking()
RETURNS TABLE (user_id uuid, score integer)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id AS user_id,
         COUNT(po.id)::int AS score
  FROM public.profiles p
  LEFT JOIN public.posts po
    ON po.user_id = p.id
   AND po.created_at >= now() - interval '7 days'
  GROUP BY p.id
  ORDER BY score DESC
  LIMIT 10
$$;