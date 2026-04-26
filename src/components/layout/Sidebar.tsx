"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { UserProfile } from "@/types";
import { getInitials, getRoleLabel } from "@/lib/utils";
import { LayoutDashboard, Upload, Search, Eye, User, Users, FolderOpen, BarChart3, Bell, Settings, LogOut, BookOpen, ChevronLeft, ChevronRight, Shield, Library } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["admin", "dosen", "mahasiswa", "kaprodi", "perpustakaan"] },
  { label: "Upload File", href: "/dashboard/upload", icon: <Upload size={18} />, roles: ["mahasiswa", "dosen", "admin"] },
  { label: "Arsip", href: "/dashboard/arsip", icon: <FolderOpen size={18} />, roles: ["admin", "dosen", "mahasiswa", "kaprodi", "perpustakaan"] },
  { label: "Pencarian", href: "/dashboard/pencarian", icon: <Search size={18} />, roles: ["admin", "dosen", "mahasiswa", "kaprodi", "perpustakaan"] },
  { label: "Preview", href: "/dashboard/preview", icon: <Eye size={18} />, roles: ["admin", "dosen", "mahasiswa", "kaprodi", "perpustakaan"] },
  { label: "Pengguna", href: "/dashboard/pengguna", icon: <Users size={18} />, roles: ["admin"] },
  { label: "Laporan", href: "/dashboard/laporan", icon: <BarChart3 size={18} />, roles: ["admin", "kaprodi"] },
  { label: "Notifikasi", href: "/dashboard/notifikasi", icon: <Bell size={18} />, roles: ["admin", "dosen", "mahasiswa", "kaprodi", "perpustakaan"] },
  { label: "Profil", href: "/dashboard/profil", icon: <User size={18} />, roles: ["admin", "dosen", "mahasiswa", "kaprodi", "perpustakaan"] },
  { label: "Pengaturan", href: "/dashboard/pengaturan", icon: <Settings size={18} />, roles: ["admin"] },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield size={14} />,
  dosen: <BookOpen size={14} />,
  mahasiswa: <User size={14} />,
  kaprodi: <BarChart3 size={14} />,
  perpustakaan: <Library size={14} />,
};

export default function Sidebar({ profile }: { profile: UserProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(profile.role));

  async function handleLogout() {
    setLoggingOut(true);
    await signOut();
    router.push("/auth/login");
  }

  const dashboardHref = `/dashboard/${profile.role}`;

  return (
    <aside
      className="relative flex flex-col h-screen sticky top-0 transition-all duration-300 flex-shrink-0"
      style={{
        width: collapsed ? "72px" : "240px",
        background: "var(--color-bg-secondary)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-brand)" }}>
          <BookOpen size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-display text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
            ArsipKu
          </span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all"
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Profile mini */}
      <div
        className="px-3 py-3 border-b mx-2 mt-3 rounded-xl"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "rgba(37, 163, 104, 0.2)", color: "var(--color-brand)" }}>
            {getInitials(profile.full_name)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                {profile.full_name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span style={{ color: "var(--color-brand)" }}>{ROLE_ICONS[profile.role]}</span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {getRoleLabel(profile.role)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredNav.map((item) => {
          const href = item.href === "/dashboard" ? dashboardHref : item.href;
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={item.href}
              href={href}
              title={collapsed ? item.label : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
              style={{
                background: isActive ? "rgba(37, 163, 104, 0.12)" : "transparent",
                color: isActive ? "var(--color-brand-light)" : "var(--color-text-secondary)",
                borderLeft: isActive ? "2px solid var(--color-brand)" : "2px solid transparent",
              }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Keluar" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent-red)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{loggingOut ? "Keluar..." : "Keluar"}</span>}
        </button>
      </div>
    </aside>
  );
}
