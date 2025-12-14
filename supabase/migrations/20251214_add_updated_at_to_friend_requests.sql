-- Add updated_at column to friend_requests if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friend_requests' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.friend_requests 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    
    -- Create trigger for updated_at if it doesn't exist
    DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON public.friend_requests;
    
    CREATE TRIGGER update_friend_requests_updated_at
      BEFORE UPDATE ON public.friend_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
      
    RAISE NOTICE 'Added updated_at column and trigger to friend_requests table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in friend_requests table';
  END IF;
END $$;
