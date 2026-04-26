-- ============================================
-- FASE 2: Storage Bucket Setup
-- Jalankan ini di Supabase SQL Editor
-- ============================================

-- 1. Buat bucket arsip-files (kalau belum ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arsip-files',
  'arsip-files',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies
-- Authenticated users bisa upload
CREATE POLICY "auth_users_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'arsip-files' AND
    auth.role() = 'authenticated'
  );

-- Authenticated users bisa baca file mereka sendiri (atau semua kalau bukan mahasiswa)
CREATE POLICY "auth_users_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'arsip-files' AND
    auth.role() = 'authenticated'
  );

-- User hanya bisa hapus file milik mereka sendiri (path dimulai dengan user ID)
CREATE POLICY "auth_users_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'arsip-files' AND
    auth.role() = 'authenticated' AND
    (
      -- Owner: path dimulai dengan user ID mereka
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Admin: bisa hapus semua
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================
-- Update types/index.ts sudah include ArsipFile
-- dengan field download_count (sudah ada di schema fase 1)
-- ============================================
