-- ============================================
-- FASE 4 - Schema Update
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tambah kolom plagiarism_data (JSONB) untuk simpan detail hasil cek
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS plagiarism_data JSONB;

-- Index untuk filter file terenkripsi
CREATE INDEX IF NOT EXISTS idx_files_is_encrypted ON public.files (is_encrypted);

-- Index untuk filter berdasarkan plagiarism score
CREATE INDEX IF NOT EXISTS idx_files_plagiarism_score ON public.files (plagiarism_score);
