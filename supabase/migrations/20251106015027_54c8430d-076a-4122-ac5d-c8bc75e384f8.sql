-- Create friendship_level enum
CREATE TYPE public.friendship_level AS ENUM ('conhecido', 'vizinho', 'amigo_varanda');

-- Create privacy_setting enum
CREATE TYPE public.privacy_setting AS ENUM ('todos', 'amigos_de_amigos', 'ninguem');

-- Update friendships table to include levels and interaction tracking
ALTER TABLE public.friendships
ADD COLUMN level friendship_level DEFAULT 'conhecido',
ADD COLUMN interaction_count integer DEFAULT 0,
ADD COLUMN last_interaction_at timestamp with time zone DEFAULT now(),
ADD COLUMN affinity_score integer DEFAULT 0;

-- Create gifts table for digital presents
CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gift_type text NOT NULL,
  message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on gifts
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Create privacy_settings table
CREATE TABLE public.privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  who_can_send_requests privacy_setting DEFAULT 'todos',
  who_can_see_posts privacy_setting DEFAULT 'todos',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on privacy_settings
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Create wall_messages table (recados no muro)
CREATE TABLE public.wall_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on wall_messages
ALTER TABLE public.wall_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gifts
CREATE POLICY "Users can view gifts they sent or received"
  ON public.gifts FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send gifts"
  ON public.gifts FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete gifts they received"
  ON public.gifts FOR DELETE
  USING (auth.uid() = to_user_id);

-- RLS Policies for privacy_settings
CREATE POLICY "Users can view their own privacy settings"
  ON public.privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
  ON public.privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
  ON public.privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for wall_messages
CREATE POLICY "Public wall messages are viewable by everyone"
  ON public.wall_messages FOR SELECT
  USING (is_public = true OR auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send wall messages"
  ON public.wall_messages FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete messages on their wall"
  ON public.wall_messages FOR DELETE
  USING (auth.uid() = to_user_id);

-- Function to update friendship level based on interactions
CREATE OR REPLACE FUNCTION public.update_friendship_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upgrade to vizinho if interaction_count >= 3
  IF NEW.interaction_count >= 3 AND NEW.level = 'conhecido' THEN
    NEW.level := 'vizinho';
  END IF;
  
  -- Upgrade to amigo_varanda if interaction_count >= 15 and affinity >= 70
  IF NEW.interaction_count >= 15 AND NEW.affinity_score >= 70 AND NEW.level = 'vizinho' THEN
    NEW.level := 'amigo_varanda';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-upgrade friendship levels
CREATE TRIGGER update_friendship_level_trigger
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_friendship_level();

-- Function to calculate affinity between users
CREATE OR REPLACE FUNCTION public.calculate_affinity(user1_id uuid, user2_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affinity_score integer := 0;
  common_clubs integer;
  interaction_score integer;
BEGIN
  -- Count common clubs
  SELECT COUNT(*)::integer INTO common_clubs
  FROM community_members cm1
  JOIN community_members cm2 ON cm1.community_id = cm2.community_id
  WHERE cm1.user_id = user1_id AND cm2.user_id = user2_id;
  
  -- Add points for common clubs (10 points each, max 30)
  affinity_score := affinity_score + LEAST(common_clubs * 10, 30);
  
  -- Get interaction score from friendship
  SELECT interaction_count * 2 INTO interaction_score
  FROM friendships
  WHERE (user_id = user1_id AND friend_id = user2_id)
     OR (user_id = user2_id AND friend_id = user1_id)
  LIMIT 1;
  
  -- Add interaction points (max 40)
  affinity_score := affinity_score + LEAST(COALESCE(interaction_score, 0), 40);
  
  -- Add random factor for variety (0-30)
  affinity_score := affinity_score + floor(random() * 30)::integer;
  
  RETURN LEAST(affinity_score, 100);
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_gifts_to_user ON public.gifts(to_user_id);
CREATE INDEX idx_gifts_from_user ON public.gifts(from_user_id);
CREATE INDEX idx_wall_messages_to_user ON public.wall_messages(to_user_id);
CREATE INDEX idx_wall_messages_from_user ON public.wall_messages(from_user_id);
CREATE INDEX idx_friendships_level ON public.friendships(level);