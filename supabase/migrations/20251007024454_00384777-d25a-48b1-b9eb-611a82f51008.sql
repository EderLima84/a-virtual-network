-- Fix the calculate_weekly_ranking function
CREATE OR REPLACE FUNCTION public.calculate_weekly_ranking()
RETURNS TABLE(user_id uuid, score integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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