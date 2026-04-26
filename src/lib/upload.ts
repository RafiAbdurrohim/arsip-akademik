import { createClient } from '@/lib/supabase/client'
import { FileType } from '@/types'

// Config upload
export const UPLOAD_CONFIG = {
  maxSizeMB: 50,
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['pdf', 'docx', 'xlsx', 'pptx', 'zip', 'jpg', 'png'] as FileType[],
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
  ],
  bucketName: 'arsip-files',
}

// Validasi file sebelum upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Cek ukuran
  if (file.size > UPLOAD_CONFIG.maxSizeBytes) {
    return { valid: false, error: `Ukuran file maksimal ${UPLOAD_CONFIG.maxSizeMB}MB` }
  }

  // Cek tipe
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: 'Tipe file tidak didukung. Gunakan PDF, DOCX, XLSX, PPTX, ZIP, JPG, atau PNG' }
  }

  return { valid: true }
}

// Ambil file extension dari MIME type
export function mimeToExtension(mimeType: string): FileType {
  const map: Record<string, FileType> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'image/jpeg': 'jpg',
    'image/png': 'png',
  }
  return map[mimeType] || 'pdf'
}

// Generate unique filename untuk storage
export function generateStoragePath(userId: string, originalName: string): string {
  const timestamp = Date.now()
  const ext = originalName.split('.').pop()?.toLowerCase()
  const random = Math.random().toString(36).substring(2, 8)
  return `${userId}/${timestamp}-${random}.${ext}`
}

// Upload file ke Supabase Storage
export async function uploadToStorage(file: File, storagePath: string): Promise<string> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(UPLOAD_CONFIG.bucketName)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`Gagal upload ke storage: ${error.message}`)
  return storagePath
}

// Get signed URL untuk download/preview
export async function getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(UPLOAD_CONFIG.bucketName)
    .createSignedUrl(storagePath, expiresIn)

  if (error) throw new Error(`Gagal membuat URL: ${error.message}`)
  return data.signedUrl
}

// Hapus file dari storage
export async function deleteFromStorage(storagePath: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(UPLOAD_CONFIG.bucketName)
    .remove([storagePath])

  if (error) throw new Error(`Gagal menghapus file: ${error.message}`)
}

// Format ukuran file
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Icon & warna per file type
export const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  pdf:  { icon: '📄', color: '#e05252', bg: 'rgba(224,82,82,0.1)',   label: 'PDF' },
  docx: { icon: '📝', color: '#4a9eff', bg: 'rgba(74,158,255,0.1)',  label: 'Word' },
  xlsx: { icon: '📊', color: '#25a368', bg: 'rgba(37,163,104,0.1)',  label: 'Excel' },
  pptx: { icon: '📋', color: '#c9a84c', bg: 'rgba(201,168,76,0.1)', label: 'PowerPoint' },
  zip:  { icon: '🗜️', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', label: 'ZIP' },
  jpg:  { icon: '🖼️', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', label: 'JPG' },
  png:  { icon: '🖼️', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', label: 'PNG' },
}
