"use client";

import { useState } from "react";
import { UserProfile } from "@/types";
import { UserRole } from '@/types'
import { getRoleLabel, formatDateTime, getInitials } from "@/lib/utils";
import { Trash2, Edit2, FileText, MoreVertical, X, Check } from "lucide-react";

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin: { bg: "rgba(224,82,82,0.1)", color: "#e05252" },
  dosen: { bg: "rgba(74,158,255,0.1)", color: "#4a9eff" },
  mahasiswa: { bg: "rgba(37,163,104,0.1)", color: "#25a368" },
  kaprodi: { bg: "rgba(201,168,76,0.1)", color: "#c9a84c" },
  perpustakaan: { bg: "rgba(168,85,247,0.1)", color: "#a855f7" },
};

const ALL_ROLES = ["admin", "dosen", "mahasiswa", "kaprodi", "perpustakaan"];

interface UserCardProps {
  user: UserProfile & { file_count?: number };
  currentUserId: string;
  onDelete: (id: string, name: string) => void;
  onRoleChange: (id: string, newRole: string) => void;
}

export default function UserCard({ user, currentUserId, onDelete, onRoleChange }: UserCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const rc = ROLE_COLORS[user.role] || ROLE_COLORS["mahasiswa"];
  const isSelf = user.id === currentUserId;

  async function saveRole() {
    if (selectedRole === user.role) {
      setEditingRole(false);
      return;
    }
    setSaving(true);
    await onRoleChange(user.id, selectedRole);
    setSaving(false);
    setEditingRole(false);
  }

  return (
    <div className="relative rounded-2xl border p-5 flex items-start gap-4 transition-all hover:border-opacity-80" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
      {/* Avatar */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: rc.bg, color: rc.color }}>
        {getInitials(user.full_name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
              {user.full_name}
              {isSelf && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(37,163,104,0.1)", color: "var(--color-brand)" }}>
                  Anda
                </span>
              )}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
              {user.email}
            </p>
          </div>

          {/* Menu button */}
          {!isSelf && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: showMenu ? "var(--color-bg-elevated)" : "transparent",
                  color: "var(--color-text-muted)",
                }}
              >
                <MoreVertical size={14} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 rounded-xl border overflow-hidden w-44" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-border)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                    <button
                      onClick={() => {
                        setEditingRole(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all hover:bg-white/5"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <Edit2 size={13} /> Ubah Role
                    </button>
                    <button
                      onClick={() => {
                        onDelete(user.id, user.full_name);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all hover:bg-red-500/10"
                      style={{ color: "var(--color-accent-red)" }}
                    >
                      <Trash2 size={13} /> Hapus Pengguna
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Role badge / edit */}
        <div className="mt-2.5">
          {editingRole ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="flex-1 rounded-lg px-2 py-1 text-xs border focus:outline-none"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {getRoleLabel(r)}
                  </option>
                ))}
              </select>
              <button onClick={saveRole} disabled={saving} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(37,163,104,0.15)", color: "var(--color-brand)" }}>
                <Check size={12} />
              </button>
              <button
                onClick={() => {
                  setEditingRole(false);
                  setSelectedRole(user.role);
                }}
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(224,82,82,0.1)", color: "var(--color-accent-red)" }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.color }}>
                {getRoleLabel(user.role)}
              </span>
              {user.prodi && (
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  • {user.prodi}
                </span>
              )}
              {user.angkatan && (
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  '{user.angkatan}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-3 pt-3 flex items-center gap-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-1.5">
            <FileText size={11} style={{ color: "var(--color-text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {user.file_count ?? 0} file
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Bergabung {formatDateTime(user.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
