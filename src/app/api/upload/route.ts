import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStoragePath, mimeToExtension, UPLOAD_CONFIG } from '@/lib/upload'
import { encryptBuffer } from '@/lib/encryption'
import { checkPlagiarism } from '@/lib/plagiarism'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profil tidak ditemukan' }, { status: 404 })

    const formData    = await request.formData()
    const file        = formData.get('file') as File
    const assignmentId = formData.get('assignment_id') as string | null
    const categoryId  = formData.get('category_id') as string | null
    const title       = formData.get('title') as string
    const description = formData.get('description') as string | null
    const subject     = formData.get('subject') as string
    const year        = formData.get('year') as string
    const semester    = formData.get('semester') as string
    const type        = formData.get('type') as string

    // ✅ Fase 4: opsi enkripsi & plagiarism check
    const shouldEncrypt   = formData.get('encrypt') === 'true'
    const checkPlagiarism_ = formData.get('check_plagiarism') === 'true'

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    if (file.size > UPLOAD_CONFIG.maxSizeBytes)
      return NextResponse.json({ error: `Ukuran file maksimal ${UPLOAD_CONFIG.maxSizeMB}MB` }, { status: 400 })
    if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type))
      return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 })

    const fileType    = mimeToExtension(file.type)
    const storagePath = generateStoragePath(user.id, file.name)

    // ============================================
    // ✅ ENKRIPSI AES-256 (jika diaktifkan)
    // ============================================
    let uploadBuffer: Buffer
    let finalEncrypted = false

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    if (shouldEncrypt) {
      try {
        uploadBuffer  = encryptBuffer(rawBuffer)
        finalEncrypted = true
      } catch (err: any) {
        // Kalau ENCRYPTION_SECRET tidak diset, upload tanpa enkripsi
        console.warn('Enkripsi gagal, upload tanpa enkripsi:', err.message)
        uploadBuffer = rawBuffer
      }
    } else {
      uploadBuffer = rawBuffer
    }

    // Upload ke Supabase Storage
    const { error: storageError } = await supabase.storage
      .from(UPLOAD_CONFIG.bucketName)
      .upload(storagePath, uploadBuffer, {
        contentType: finalEncrypted ? 'application/octet-stream' : file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (storageError) {
      return NextResponse.json({ error: 'Gagal upload file ke storage' }, { status: 500 })
    }

    // ============================================
    // ✅ PLAGIARISM CHECK (jika diaktifkan)
    // ============================================
    let plagiarismScore: number | null = null
    let plagiarismData: any = null

    if (checkPlagiarism_) {
      try {
        const result = await checkPlagiarism(title || file.name)
        plagiarismScore = result.score
        plagiarismData  = result
      } catch (err) {
        console.error('Plagiarism check error:', err)
      }
    }

    // Buat assignment jika data lengkap
    let finalAssignmentId = assignmentId
    if (!assignmentId && title && subject && year && semester && type) {
      const { data: newAssignment, error: assignError } = await supabase
        .from('assignments')
        .insert({ title, description, subject, year: parseInt(year), semester: parseInt(semester), type, user_id: user.id })
        .select().single()

      if (assignError) {
        await supabase.storage.from(UPLOAD_CONFIG.bucketName).remove([storagePath])
        return NextResponse.json({ error: 'Gagal membuat assignment' }, { status: 500 })
      }
      finalAssignmentId = newAssignment.id
    }

    // Simpan metadata ke DB
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        filename:         storagePath.split('/').pop() || file.name,
        original_name:    file.name,
        file_type:        fileType,
        file_size:        file.size,   // ukuran ASLI (bukan setelah enkripsi)
        storage_path:     storagePath,
        assignment_id:    finalAssignmentId || null,
        uploaded_by:      user.id,
        category_id:      categoryId || null,
        is_encrypted:     finalEncrypted,
        plagiarism_score: plagiarismScore,
      })
      .select('*, uploader:profiles!uploaded_by(id, full_name, email, role), assignment:assignments(*), category:categories(*)')
      .single()

    if (dbError) {
      await supabase.storage.from(UPLOAD_CONFIG.bucketName).remove([storagePath])
      return NextResponse.json({ error: 'Gagal menyimpan data file' }, { status: 500 })
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id:       user.id,
      action:        'upload',
      resource_type: 'file',
      resource_id:   fileRecord.id,
      metadata: {
        filename:         file.name,
        file_size:        file.size,
        file_type:        fileType,
        is_encrypted:     finalEncrypted,
        plagiarism_score: plagiarismScore,
      },
    })

    return NextResponse.json({
      message:   'File berhasil diupload',
      data:      fileRecord,
      plagiarism: plagiarismData,
      encrypted:  finalEncrypted,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
