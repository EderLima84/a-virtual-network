-- Add function to grant welcome achievement to new users
CREATE OR REPLACE FUNCTION public.grant_welcome_achievement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  welcome_achievement_id UUID;
BEGIN
  -- Get the "Bem-vindo ao Portella!" achievement ID
  SELECT id INTO welcome_achievement_id
  FROM public.achievements
  WHERE name = 'Bem-vindo ao Portella!'
  LIMIT 1;

  -- Grant the achievement if it exists
  IF welcome_achievement_id IS NOT NULL THEN
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (NEW.id, welcome_achievement_id)
    ON CONFLICT DO NOTHING;

    -- Update user points
    UPDATE public.profiles
    SET points = points + 10
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to grant welcome achievement after profile creation
DROP TRIGGER IF EXISTS on_profile_created_grant_achievement ON public.profiles;

CREATE TRIGGER on_profile_created_grant_achievement
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_welcome_achievement();