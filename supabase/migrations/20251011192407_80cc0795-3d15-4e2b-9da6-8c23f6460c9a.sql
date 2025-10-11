-- Create elections table
CREATE TABLE public.elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  position TEXT NOT NULL, -- 'prefeito' or 'vereador'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'active', 'finished'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  votes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(election_id, user_id)
);

-- Create election_votes table
CREATE TABLE public.election_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(election_id, voter_id)
);

-- Create polls table for popular voting
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'finished'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create poll_options table
CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  votes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for elections
CREATE POLICY "Elections are viewable by everyone"
  ON public.elections FOR SELECT USING (true);

CREATE POLICY "Admins can manage elections"
  ON public.elections FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for candidates
CREATE POLICY "Candidates are viewable by everyone"
  ON public.candidates FOR SELECT USING (true);

CREATE POLICY "Users can register as candidates"
  ON public.candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage candidates"
  ON public.candidates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for election_votes
CREATE POLICY "Users can view their own votes"
  ON public.election_votes FOR SELECT
  USING (auth.uid() = voter_id);

CREATE POLICY "Users can vote"
  ON public.election_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- RLS Policies for polls
CREATE POLICY "Polls are viewable by everyone"
  ON public.polls FOR SELECT USING (true);

CREATE POLICY "Admins can create polls"
  ON public.polls FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage polls"
  ON public.polls FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for poll_options
CREATE POLICY "Poll options are viewable by everyone"
  ON public.poll_options FOR SELECT USING (true);

CREATE POLICY "Admins can manage poll options"
  ON public.poll_options FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for poll_votes
CREATE POLICY "Users can view their own poll votes"
  ON public.poll_votes FOR SELECT
  USING (auth.uid() = voter_id);

CREATE POLICY "Users can vote on polls"
  ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- Create trigger functions to update vote counts
CREATE OR REPLACE FUNCTION public.update_candidate_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.candidates 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.candidate_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.candidates 
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.candidate_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_poll_option_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.poll_options 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.poll_options 
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.option_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER update_candidate_votes_trigger
  AFTER INSERT OR DELETE ON public.election_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_candidate_votes_count();

CREATE TRIGGER update_poll_option_votes_trigger
  AFTER INSERT OR DELETE ON public.poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_poll_option_votes_count();

-- Create indexes
CREATE INDEX idx_elections_status ON public.elections(status);
CREATE INDEX idx_candidates_election_id ON public.candidates(election_id);
CREATE INDEX idx_election_votes_election_id ON public.election_votes(election_id);
CREATE INDEX idx_polls_status ON public.polls(status);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);