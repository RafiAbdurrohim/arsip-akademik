-- ============================================
-- FASE 3 - Schema Updates
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Index untuk full-text search pada nama file
CREATE INDEX IF NOT EXISTS idx_files_original_name
  ON public.files USING gin(to_tsvector('indonesian', original_name));

-- Index biasa untuk filter cepat
CREATE INDEX IF NOT EXISTS idx_files_file_type    ON public.files (file_type);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by  ON public.files (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_created_at   ON public.files (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_category_id  ON public.files (category_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role      ON public.profiles (role);

-- Function untuk increment download_count
CREATE OR REPLACE FUNCTION increment_download_count(file_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.files
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
