import { createClient } from '@/lib/supabase/client'
import { UserRole, UserProfile } from '@/types'

// Login dengan email & password
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// Register user baru
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
  extraData?: { nim?: string; nip?: string; prodi?: string; angkatan?: string }
) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        ...extraData,
      },
    },
  })
  if (error) throw error
  return data
}

// Logout
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Ambil profile user yang login
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
}

// Redirect berdasarkan role setelah login
export function getDashboardByRole(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    admin: '/dashboard/admin',
    dosen: '/dashboard/dosen',
    mahasiswa: '/dashboard/mahasiswa',
    kaprodi: '/dashboard/kaprodi',
    perpustakaan: '/dashboard/perpustakaan',
  }
  return routes[role]
}

// Cek apakah role punya akses ke route tertentu
export function hasAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}
