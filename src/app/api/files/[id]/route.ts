import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UPLOAD_CONFIG } from '@/lib/upload'
import { decryptBuffer } from '@/lib/encryption'

// GET /api/files/[id]
// Kalau file terenkripsi: download → dekripsi → kirim sebagai stream
// Kalau tidak terenkripsi: kirim signed URL biasa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: file, error } = await supabase
      .from('files')
      .select('*, uploader:profiles!uploaded_by(id, full_name, role), category:categories(id, name)')
      .eq('id', params.id)
      .single()

    if (error || !file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })

    // Update download count & log audit
    await supabase.from('files')
      .update({ download_count: (file.download_count || 0) + 1 })
      .eq('id', params.id)

    await supabase.from('audit_logs').insert({
      user_id: user.id, action: 'download',
      resource_type: 'file', resource_id: file.id,
      metadata: { filename: file.original_name, is_encrypted: file.is_encrypted },
    })

    // ============================================
    // File TIDAK terenkripsi → signed URL biasa
    // ============================================
    if (!file.is_encrypted) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(UPLOAD_CONFIG.bucketName)
        .createSignedUrl(file.storage_path, 3600)

      if (signedError || !signedData)
        return NextResponse.json({ error: 'Gagal membuat link download' }, { status: 500 })

      return NextResponse.json({ data: file, signed_url: signedData.signedUrl })
    }

    // ============================================
    // File TERENKRIPSI → download + dekripsi + stream
    // ============================================
    const { data: rawData, error: downloadError } = await supabase.storage
      .from(UPLOAD_CONFIG.bucketName)
      .download(file.storage_path)

    if (downloadError || !rawData)
      return NextResponse.json({ error: 'Gagal mengunduh file terenkripsi' }, { status: 500 })

    let decryptedBuffer: Buffer
    try {
      const encryptedBuffer = Buffer.from(await rawData.arrayBuffer())
      decryptedBuffer = decryptBuffer(encryptedBuffer)
    } catch (err: any) {
      console.error('Dekripsi gagal:', err.message)
      return NextResponse.json({ error: 'Gagal mendekripsi file. Pastikan ENCRYPTION_SECRET benar.' }, { status: 500 })
    }

    // Tentukan MIME type berdasarkan file_type
    const mimeTypes: Record<string, string> = {
      pdf:  'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      zip:  'application/zip',
      jpg:  'image/jpeg',
      png:  'image/png',
    }
    const mimeType = mimeTypes[file.file_type] || 'application/octet-stream'

    // Cek apakah ini request preview (bukan download)
    const wantsPreview = request.nextUrl.searchParams.get('mode') === 'preview'

    return new NextResponse(new Uint8Array(decryptedBuffer), {
      headers: {
        'Content-Type':        mimeType,
        'Content-Disposition': wantsPreview
          ? `inline; filename="${file.original_name}"`
          : `attachment; filename="${file.original_name}"`,
        'Content-Length':      decryptedBuffer.length.toString(),
        'Cache-Control':       'no-store',  // jangan cache file terenkripsi
      },
    })
  } catch (error) {
    console.error('GET /api/files/[id] error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/files/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: file, error: fetchError } = await supabase
      .from('files').select('*').eq('id', params.id).single()
    if (fetchError || !file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    const isOwner = file.uploaded_by === user.id
    const isAdmin = profile?.role === 'admin'
    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: 'Tidak punya akses untuk menghapus file ini' }, { status: 403 })

    await supabase.storage.from(UPLOAD_CONFIG.bucketName).remove([file.storage_path])
    const { error: dbError } = await supabase.from('files').delete().eq('id', params.id)
    if (dbError) return NextResponse.json({ error: 'Gagal menghapus file dari database' }, { status: 500 })

    await supabase.from('audit_logs').insert({
      user_id: user.id, action: 'delete',
      resource_type: 'file', resource_id: file.id,
      metadata: { filename: file.original_name },
    })

    return NextResponse.json({ message: 'File berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
