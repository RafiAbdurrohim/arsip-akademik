// User roles sesuai diagram
export type UserRole = 'admin' | 'dosen' | 'mahasiswa' | 'kaprodi' | 'perpustakaan'

// User profile
export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  prodi?: string
  angkatan?: string
  nim?: string
  nip?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// File/Arsip types
export type FileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip' | 'jpg' | 'png'

export interface ArsipFile {
  id: string
  filename: string
  original_name: string
  file_type: FileType
  file_size: number
  storage_path: string
  assignment_id?: string
  uploaded_by: string
  category_id?: string
  is_encrypted: boolean
  created_at: string
  updated_at: string
  // Relations
  uploader?: UserProfile
  assignment?: Assignment
  category?: Category
}

// Assignment
export interface Assignment {
  id: string
  title: string
  description?: string
  subject: string
  year: number
  semester: number
  type: string
  user_id: string
  created_at: string
  updated_at: string
}

// Category
export interface Category {
  id: string
  name: string
  prodi: string
  faculty: string
  parent_id?: string
  description?: string
}

// Dashboard stats
export interface DashboardStats {
  total_files: number
  total_users: number
  total_storage: number
  recent_uploads: ArsipFile[]
}

// Navigation item
export interface NavItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
}

// API Response
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
