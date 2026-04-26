-- ============================================
-- FASE 6: Notifikasi + Laporan
-- Jalankan di Supabase SQL Editor
-- ============================================

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'upload_success',   -- file berhasil diupload
    'file_downloaded',  -- file kamu didownload orang lain
    'plagiarism_alert', -- hasil plagiarisme tinggi
    'new_user',         -- user baru (admin only)
    'system'            -- notif sistem umum
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,       -- data tambahan (file_id, user_id, dll)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- User hanya bisa lihat notif miliknya sendiri
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Insert boleh dari server (service role) dan user sendiri
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update (mark as read) hanya milik sendiri
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Delete hanya milik sendiri
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- FUNCTION: auto notif saat file diupload
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_upload()
RETURNS TRIGGER AS $$
DECLARE
  uploader_name TEXT;
BEGIN
  -- Ambil nama uploader
  SELECT full_name INTO uploader_name FROM public.profiles WHERE id = NEW.uploaded_by;

  -- Notif ke uploader sendiri (konfirmasi upload berhasil)
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.uploaded_by,
    'upload_success',
    'Upload Berhasil',
    'File "' || NEW.original_name || '" berhasil diupload ke sistem.',
    jsonb_build_object('file_id', NEW.id, 'file_name', NEW.original_name, 'file_type', NEW.file_type)
  );

  -- Notif plagiarisme tinggi ke uploader
  IF NEW.plagiarism_score IS NOT NULL AND NEW.plagiarism_score > 60 THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.uploaded_by,
      'plagiarism_alert',
      'Peringatan Plagiarisme',
      'File "' || NEW.original_name || '" memiliki skor plagiarisme tinggi (' || NEW.plagiarism_score || '%). Harap periksa kembali.',
      jsonb_build_object('file_id', NEW.id, 'score', NEW.plagiarism_score)
    );
  END IF;

  -- Notif ke semua admin: ada file baru
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  SELECT
    p.id,
    'system',
    'File Baru Diupload',
    uploader_name || ' mengupload file baru: "' || NEW.original_name || '"',
    jsonb_build_object('file_id', NEW.id, 'uploaded_by', NEW.uploaded_by)
  FROM public.profiles p
  WHERE p.role = 'admin' AND p.id != NEW.uploaded_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_file_uploaded
  AFTER INSERT ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_upload();

-- ============================================
-- FUNCTION: notif saat user baru register
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Notif ke semua admin
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  SELECT
    p.id,
    'new_user',
    'Pengguna Baru',
    'Pengguna baru mendaftar: ' || NEW.full_name || ' (' || NEW.role || ')',
    jsonb_build_object('new_user_id', NEW.id, 'role', NEW.role, 'email', NEW.email)
  FROM public.profiles p
  WHERE p.role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_new_user_registered
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();
