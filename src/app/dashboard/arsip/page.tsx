"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, RefreshCw, FolderOpen, Grid, List, Download, X } from "lucide-react";
import { ArsipFile, Category, UserProfile } from "@/types";
import { FILE_TYPE_CONFIG, formatFileSize } from "@/lib/upload";
import FileCard from "@/components/files/FileCard";
import { EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import FilePreviewModal from "@/components/files/FilePreviewModal";

const FILE_TYPES = ["pdf", "docx", "xlsx", "pptx", "zip", "jpg", "png"];

export default function ArsipPage() {
  const [files, setFiles] = useState<ArsipFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [myFilesOnly, setMyFilesOnly] = useState(false);

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Fetch profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data.data))
      .catch(() => {});
  }, []);

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(search && { search }),
        ...(filterType && { file_type: filterType }),
        ...(filterCategory && { category_id: filterCategory }),
        ...(myFilesOnly && { my_files: "true" }),
      });

      const res = await fetch(`/api/files?${params}`);
      const data = await res.json();
      setFiles(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterCategory, myFilesOnly, offset]);

  useEffect(() => {
    const timer = setTimeout(fetchFiles, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchFiles]);

  // Download file
  const handleDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/files/${id}`);
      const data = await res.json();
      if (data.signed_url) {
        const link = document.createElement("a");
        link.href = data.signed_url;
        link.download = data.data?.original_name || "file";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      alert("Gagal mengunduh file");
    }
  };

  // Preview file
  const handlePreview = (id: string) => setPreviewId(id);

  // Delete file
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setTotal((prev) => prev - 1);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus file");
      }
    } catch {
      alert("Gagal menghapus file");
    }
  };

  const hasFilters = search || filterType || filterCategory || myFilesOnly;

  const clearFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterCategory("");
    setMyFilesOnly(false);
    setOffset(0);
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display mb-1" style={{ color: "var(--color-text-primary)" }}>
            Arsip Dokumen
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {loading ? "Memuat..." : `${total} dokumen ditemukan`}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--color-bg-elevated)" }}>
          <button
            onClick={() => setViewMode("grid")}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: viewMode === "grid" ? "var(--color-bg-card)" : "transparent",
              color: viewMode === "grid" ? "var(--color-brand)" : "var(--color-text-muted)",
            }}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: viewMode === "list" ? "var(--color-bg-card)" : "transparent",
              color: viewMode === "list" ? "var(--color-brand)" : "var(--color-text-muted)",
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-4 mb-6 space-y-3" style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}>
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="Cari nama file..."
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm border focus:outline-none transition-colors"
            style={{
              background: "var(--color-bg-elevated)",
              borderColor: "var(--color-border-light)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* File type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              <Filter size={12} className="inline mr-1" />
              Tipe:
            </span>
            {FILE_TYPES.map((type) => {
              const cfg = FILE_TYPE_CONFIG[type];
              const active = filterType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(active ? "" : type);
                    setOffset(0);
                  }}
                  className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                  style={{
                    background: active ? cfg.bg : "var(--color-bg-elevated)",
                    color: active ? cfg.color : "var(--color-text-muted)",
                    border: `1px solid ${active ? cfg.color + "40" : "var(--color-border)"}`,
                  }}
                >
                  .{type}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* My files toggle */}
          <button
            onClick={() => {
              setMyFilesOnly(!myFilesOnly);
              setOffset(0);
            }}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all border"
            style={{
              background: myFilesOnly ? "rgba(37,163,104,0.1)" : "var(--color-bg-elevated)",
              color: myFilesOnly ? "var(--color-brand)" : "var(--color-text-muted)",
              borderColor: myFilesOnly ? "var(--color-brand-dim)" : "var(--color-border)",
            }}
          >
            File saya
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all" style={{ color: "var(--color-accent-red)", background: "rgba(224,82,82,0.08)" }}>
              <X size={11} />
              Reset filter
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: "var(--color-text-muted)",
              background: "var(--color-bg-elevated)",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        /* Skeleton */
        <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: viewMode === "grid" ? "200px" : "72px" }} />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState icon={<FolderOpen size={28} />} title={hasFilters ? "Tidak ada file sesuai filter" : "Belum ada arsip"} desc={hasFilters ? "Coba ubah filter pencarian kamu" : "Upload dokumen pertama kamu di menu Upload"} />
      ) : viewMode === "grid" ? (
        /* Grid view */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} currentUserId={profile?.id} currentUserRole={profile?.role} onDelete={handleDelete} onDownload={handleDownload} onPreview={handlePreview} />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border)" }}>
                {["Nama File", "Tipe", "Ukuran", "Diupload Oleh", "Tanggal", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((file, i) => {
                const cfg = FILE_TYPE_CONFIG[file.file_type] || FILE_TYPE_CONFIG["pdf"];
                return (
                  <tr
                    key={file.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderBottom: i < files.length - 1 ? "1px solid var(--color-border)" : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cfg.icon}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {file.original_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                        .{file.file_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {file.uploader?.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {formatDate(file.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDownload(file.id)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--color-text-muted)" }} title="Download">
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Menampilkan {offset + 1}–{Math.min(offset + limit, total)} dari {total} file
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "var(--color-bg-elevated)",
                color: offset === 0 ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                opacity: offset === 0 ? 0.5 : 1,
              }}
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "var(--color-bg-elevated)",
                color: offset + limit >= total ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                opacity: offset + limit >= total ? 0.5 : 1,
              }}
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
      <FilePreviewModal fileId={previewId} onClose={() => setPreviewId(null)} />
    </div>
  );
}
