-- Create storage buckets for user images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('house-covers', 'house-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policies for house-covers bucket
CREATE POLICY "House cover images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'house-covers');

CREATE POLICY "Users can upload their own house cover"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'house-covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own house cover"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'house-covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own house cover"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'house-covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );