"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconPencil,
  IconRefresh,
  IconTrash,
  IconX,
  IconExternalLink,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";
import { cn } from "@/lib/utils";

/* ── Types ── */

type BrandWorkspace = {
  id: string;
  brand_name: string;
  website_url: string;
  company_overview: string | null;
  differentiators: string[];
  competitors: string[];
  created_at: string;
  // Computed stats
  _totalAudits: number;
  _latestScore: number | null;
  _mentionRate: number | null;
  _appliedCount: number;
  _totalRecs: number;
  _workspaceId: string;
};

/* ── Helpers ── */

function getInitial(name: string) {
  if (!name) return "B";
  return (name.trim()[0] ?? "B").toUpperCase();
}

const PANEL_ANIM_MS = 280;

/* ── Component ── */

export default function BrandPage() {
  const router = useRouter();
  const { setActiveWorkspaceId } = useActiveWorkspace();
  const [brands, setBrands] = useState<BrandWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingBrand, setEditingBrand] = useState<BrandWorkspace | null>(null);
  const [editClosing, setEditClosing] = useState(false);
  const [editForm, setEditForm] = useState({
    brand_name: "",
    website_url: "",
    company_overview: "",
    differentiators: [] as string[],
    competitors: [] as string[],
  });
  const [newDiff, setNewDiff] = useState("");
  const [newComp, setNewComp] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteClosing, setDeleteClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Re-scrape state
  const [rescrapingId, setRescrapingId] = useState<string | null>(null);

  /* ── Fetch brands with stats ── */

  const fetchBrands = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // v3: get workspace IDs via workspace_members, then fetch brands
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      setBrands([]);
      setLoading(false);
      return;
    }

    const wsIds = memberships.map((m) => m.workspace_id);

    // v3: fetch brands (not workspaces)
    const { data: brandRows } = await supabase
      .from("brands")
      .select("id, workspace_id, name, website_url, company_overview, differentiators, created_at")
      .in("workspace_id", wsIds)
      .order("created_at", { ascending: false });

    if (!brandRows || brandRows.length === 0) {
      setBrands([]);
      setLoading(false);
      return;
    }

    const brandIds = brandRows.map((b) => b.id);

    // v3: fetch competitors from brand_competitors table
    const { data: competitorRows } = await supabase
      .from("brand_competitors")
      .select("brand_id, name")
      .in("brand_id", brandIds);

    const competitorsByBrand: Record<string, string[]> = {};
    for (const c of competitorRows ?? []) {
      if (!competitorsByBrand[c.brand_id]) competitorsByBrand[c.brand_id] = [];
      competitorsByBrand[c.brand_id].push(c.name);
    }

    // v3: audits use brand_id
    const { data: audits } = await supabase
      .from("audits")
      .select("id, brand_id, visibility_score, status, brand_mention_count, total_prompts")
      .in("brand_id", brandIds)
      .eq("status", "complete")
      .order("completed_at", { ascending: false });

    // v3: recommendations are brand-level with status field
    let recs: { brand_id: string; status: string }[] = [];
    if (brandIds.length > 0) {
      const { data } = await supabase
        .from("recommendations")
        .select("brand_id, status")
        .in("brand_id", brandIds);
      recs = data ?? [];
    }

    // Build per-brand stats
    const enriched: BrandWorkspace[] = brandRows.map((b) => {
      const brandAudits = audits?.filter((a) => a.brand_id === b.id) ?? [];
      const latestAudit = brandAudits[0] ?? null;
      const brandRecs = recs.filter((r) => r.brand_id === b.id);

      let mentionRate: number | null = null;
      if (latestAudit && latestAudit.total_prompts > 0) {
        mentionRate = Math.round((latestAudit.brand_mention_count / latestAudit.total_prompts) * 100);
      }

      return {
        id: b.id,
        brand_name: b.name,
        website_url: b.website_url ?? "",
        company_overview: b.company_overview,
        differentiators: b.differentiators ?? [],
        competitors: competitorsByBrand[b.id] ?? [],
        created_at: b.created_at,
        _totalAudits: brandAudits.length,
        _latestScore: latestAudit?.visibility_score ?? null,
        _mentionRate: mentionRate,
        _appliedCount: brandRecs.filter((r) => r.status === "applied" || r.status === "resolved").length,
        _totalRecs: brandRecs.length,
        _workspaceId: b.workspace_id,
      };
    });

    setBrands(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  /* ── Handlers ── */

  function openEdit(brand: BrandWorkspace) {
    setEditClosing(false);
    setEditingBrand(brand);
    setEditForm({
      brand_name: brand.brand_name,
      website_url: brand.website_url,
      company_overview: brand.company_overview ?? "",
      differentiators: [...brand.differentiators],
      competitors: [...brand.competitors],
    });
    setNewDiff("");
    setNewComp("");
  }

  const closeEdit = useCallback(() => {
    setEditClosing(true);
    setTimeout(() => {
      setEditingBrand(null);
      setEditClosing(false);
    }, PANEL_ANIM_MS);
  }, []);

  async function handleSave() {
    if (!editingBrand) return;
    setSaving(true);

    const res = await fetch(`/api/brands/${editingBrand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.brand_name,
        website_url: editForm.website_url,
        company_overview: editForm.company_overview,
        differentiators: editForm.differentiators,
      }),
    });

    if (res.ok) {
      setBrands((prev) =>
        prev.map((b) =>
          b.id === editingBrand.id
            ? { ...b, ...editForm }
            : b
        )
      );
      closeEdit();
    }
    setSaving(false);
  }

  function openDelete(id: string) {
    setDeleteClosing(false);
    setDeletingId(id);
  }

  const closeDelete = useCallback(() => {
    setDeleteClosing(true);
    setTimeout(() => {
      setDeletingId(null);
      setDeleteClosing(false);
    }, PANEL_ANIM_MS);
  }, []);

  async function handleDelete() {
    if (!deletingId) return;
    setDeleting(true);

    const res = await fetch(`/api/brands/${deletingId}`, { method: "DELETE" });
    if (res.ok) {
      setBrands((prev) => prev.filter((b) => b.id !== deletingId));
      closeDelete();
    }
    setDeleting(false);
  }

  async function handleRescrape(id: string) {
    setRescrapingId(id);
    try {
      const res = await fetch(`/api/brands/${id}/rescrape`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.profile) {
        setBrands((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  brand_name: data.profile.brand_name,
                  company_overview: data.profile.company_overview,
                  differentiators: data.profile.differentiators ?? [],
                  competitors: data.profile.competitors ?? [],
                }
              : b
          )
        );
      }
    } catch (err) {
      console.error("Rescrape error:", err);
    } finally {
      setRescrapingId(null);
    }
  }

  function addChip(field: "differentiators" | "competitors", value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (editForm[field].includes(trimmed)) return;
    setEditForm((prev) => ({ ...prev, [field]: [...prev[field], trimmed] }));
    if (field === "differentiators") setNewDiff("");
    else setNewComp("");
  }

  function removeChip(field: "differentiators" | "competitors", index: number) {
    setEditForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  // Close edit modal on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editingBrand) closeEdit();
        if (deletingId) closeDelete();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingBrand, deletingId, closeEdit, closeDelete]);

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-text-muted">Memuat data brand...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes brandModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes brandModalOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(8px); }
        }
        @keyframes brandOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes brandOverlayOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="flex flex-col gap-6 min-w-0 max-w-full">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[20px] leading-7 mb-1 mt-0">
              Brand
            </h1>
            <p className="text-text-muted m-0">
              Kelola profil brand yang Anda audit di Nuave.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 bg-brand text-white border-none rounded-md px-4 py-[9px] text-[13px] leading-4 font-semibold cursor-pointer"
          >
            <IconPlus size={15} stroke={2} />
            Tambah Brand
          </button>
        </div>

        {/* Empty state */}
        {brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[320px] gap-3 border border-dashed border-border-default rounded-md bg-white">
            <p className="text-[16px] leading-6 font-semibold">
              Belum ada brand
            </p>
            <p className="text-text-muted text-center">
              Tambahkan brand pertama Anda untuk mulai audit visibilitas AI.
            </p>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 bg-brand text-white border-none rounded-md px-5 py-2.5 text-[13px] leading-4 font-semibold cursor-pointer mt-2"
            >
              <IconPlus size={15} stroke={2} />
              Tambah Brand
            </button>
          </div>
        ) : (
          /* Brand cards */
          <div className="flex flex-col gap-4">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                rescrapingId={rescrapingId}
                onEdit={() => openEdit(brand)}
                onDelete={() => openDelete(brand.id)}
                onRescrape={() => handleRescrape(brand.id)}
                onSelect={() => {
                  setActiveWorkspaceId(brand.id);
                  router.push("/dashboard");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingBrand && (
        <>
          <div
            onClick={closeEdit}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{
              animation: `${editClosing ? "brandOverlayOut" : "brandOverlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-80px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden z-50"
            style={{
              animation: `${editClosing ? "brandModalOut" : "brandModalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          >
            {/* Modal header */}
            <div className="shrink-0 px-6 py-5 border-b border-border-default flex justify-between items-center">
              <h2 className="text-[16px] leading-6 m-0">
                Edit Brand
              </h2>
              <button onClick={closeEdit} className="bg-none border-none cursor-pointer text-text-muted p-1">
                <IconX size={18} stroke={1.5} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-5">

                {/* Brand name */}
                <div className="form-field">
                  <label>Nama Brand</label>
                  <input
                    value={editForm.brand_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, brand_name: e.target.value }))}
                  />
                </div>

                {/* Website URL */}
                <div className="form-field">
                  <label>Website URL</label>
                  <input
                    value={editForm.website_url}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, website_url: e.target.value }))}
                  />
                </div>

                {/* Overview */}
                <div className="form-field">
                  <label>Deskripsi Brand</label>
                  <textarea
                    value={editForm.company_overview}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, company_overview: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Differentiators */}
                <div className="form-field">
                  <label>Keunggulan</label>
                  <div className={cn("flex flex-wrap gap-1.5", editForm.differentiators.length > 0 ? "mb-2" : "mb-0")}>
                    {editForm.differentiators.map((d, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs bg-brand-light text-brand text-[12px] leading-4 font-medium">
                        {d}
                        <button
                          onClick={() => removeChip("differentiators", i)}
                          className="bg-none border-none cursor-pointer text-brand p-0 flex"
                        >
                          <IconX size={12} stroke={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newDiff}
                      onChange={(e) => setNewDiff(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("differentiators", newDiff); } }}
                      placeholder="Tambah keunggulan, tekan Enter"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Competitors */}
                <div className="form-field">
                  <label>Kompetitor</label>
                  <div className={cn("flex flex-wrap gap-1.5", editForm.competitors.length > 0 ? "mb-2" : "mb-0")}>
                    {editForm.competitors.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs bg-surface-raised text-text-body text-[12px] leading-4 font-medium">
                        {c}
                        <button
                          onClick={() => removeChip("competitors", i)}
                          className="bg-none border-none cursor-pointer text-text-muted p-0 flex"
                        >
                          <IconX size={12} stroke={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newComp}
                      onChange={(e) => setNewComp(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("competitors", newComp); } }}
                      placeholder="Tambah kompetitor, tekan Enter"
                      className="flex-1"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Modal footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border-default flex justify-end gap-2.5">
              <button
                onClick={closeEdit}
                className="px-4 py-2 text-[13px] leading-4 font-medium bg-surface border border-border-default rounded-md cursor-pointer text-text-body"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.brand_name.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-2 text-[13px] leading-4 font-semibold bg-brand text-white border-none rounded-md",
                  saving || !editForm.brand_name.trim() ? "cursor-not-allowed opacity-70" : "cursor-pointer opacity-100"
                )}
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <IconCheck size={14} stroke={2} />
                    Simpan
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Confirmation ── */}
      {deletingId && (
        <>
          <div
            onClick={closeDelete}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{
              animation: `${deleteClosing ? "brandOverlayOut" : "brandOverlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[calc(100vw-48px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6 z-50"
            style={{
              animation: `${deleteClosing ? "brandModalOut" : "brandModalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0">
                <IconAlertTriangle size={20} stroke={1.5} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-[15px] leading-5 m-0">
                  Hapus Brand
                </h3>
                <p className="text-[13px] leading-5 text-text-muted mt-1 mb-0">
                  Semua data audit, prompt, dan rekomendasi untuk brand <strong>{brands.find((b) => b.id === deletingId)?.brand_name}</strong> akan dihapus permanen.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={closeDelete}
                className="px-4 py-2 text-[13px] leading-4 font-medium bg-surface border border-border-default rounded-md cursor-pointer text-text-body"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-2 text-[13px] leading-4 font-semibold bg-red-600 text-white border-none rounded-md",
                  deleting ? "cursor-not-allowed opacity-70" : "cursor-pointer opacity-100"
                )}
              >
                {deleting ? "Menghapus..." : "Hapus Brand"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ── Brand Card ── */

function BrandCard({
  brand,
  rescrapingId,
  onEdit,
  onDelete,
  onRescrape,
  onSelect,
}: {
  brand: BrandWorkspace;
  rescrapingId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onRescrape: () => void;
  onSelect: () => void;
}) {
  const isRescraping = rescrapingId === brand.id;
  const hasStats = brand._totalAudits > 0;

  return (
    <div className="p-6 rounded-md border border-border-default bg-white transition-colors duration-100 hover:border-[#C4B5FD]">
      {/* Top row: avatar + name + URL + actions */}
      <div className="flex items-center gap-3.5 mb-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-md bg-brand text-white flex items-center justify-center text-[16px] leading-5 font-bold shrink-0">
          {getInitial(brand.brand_name)}
        </div>

        {/* Name + URL */}
        <div className="flex-1 min-w-0">
          <h3
            onClick={onSelect}
            className="text-[15px] leading-5 m-0 cursor-pointer hover:text-brand"
          >
            {brand.brand_name}
          </h3>
          <a
            href={brand.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] leading-4 text-text-muted no-underline inline-flex items-center gap-[3px] hover:text-brand"
          >
            {brand.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            <IconExternalLink size={11} stroke={1.5} />
          </a>
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0">
          <ActionButton
            icon={<IconRefresh size={15} stroke={1.5} className={isRescraping ? "animate-spin" : ""} />}
            label="Refresh data"
            onClick={onRescrape}
            disabled={isRescraping}
          />
          <ActionButton
            icon={<IconPencil size={15} stroke={1.5} />}
            label="Edit"
            onClick={onEdit}
          />
          <ActionButton
            icon={<IconTrash size={15} stroke={1.5} />}
            label="Hapus"
            onClick={onDelete}
            danger
          />
        </div>
      </div>

      {/* Overview */}
      {brand.company_overview && (
        <p className="text-[13px] leading-5 text-text-body mb-4 mt-0 line-clamp-2">
          {brand.company_overview}
        </p>
      )}

      {/* Chips: differentiators + competitors */}
      {(brand.differentiators.length > 0 || brand.competitors.length > 0) && (
        <div className="flex flex-wrap gap-[5px] mb-4">
          {brand.differentiators.map((d, i) => (
            <span key={`d-${i}`} className="px-2 py-[3px] rounded-xs text-[11px] leading-4 font-medium bg-brand-light text-brand">
              {d}
            </span>
          ))}
          {brand.competitors.map((c, i) => (
            <span key={`c-${i}`} className="px-2 py-[3px] rounded-xs text-[11px] leading-4 font-medium bg-surface-raised text-text-muted">
              vs {c}
            </span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-6 pt-3.5 border-t border-border-default">
        <StatItem
          label="Skor"
          value={hasStats && brand._latestScore !== null ? `${brand._latestScore}%` : "\u2014"}
          color={hasStats && brand._latestScore !== null
            ? (brand._latestScore >= 60 ? "text-success" : brand._latestScore >= 30 ? "text-warning" : "text-error")
            : undefined
          }
        />
        <StatItem label="Audit" value={hasStats ? `${brand._totalAudits}` : "\u2014"} />
        <StatItem
          label="Tingkat Sebutan"
          value={hasStats && brand._mentionRate !== null ? `${brand._mentionRate}%` : "\u2014"}
        />
        <StatItem
          label="Rekomendasi"
          value={hasStats ? `${brand._appliedCount}/${brand._totalRecs} selesai` : "\u2014"}
        />
      </div>
    </div>
  );
}

/* ── Small helpers ── */

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[11px] leading-4 text-text-muted mb-0.5">{label}</div>
      <div className={cn("text-[14px] leading-5 font-semibold", color ?? "text-text-heading")}>{value}</div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-sm bg-transparent border border-transparent transition-all duration-100",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer opacity-100",
        danger ? "text-red-600" : "text-text-muted",
        !disabled && !danger && "hover:bg-surface hover:border-border-default",
        !disabled && danger && "hover:bg-[#FEF2F2] hover:border-red-200"
      )}
    >
      {icon}
    </button>
  );
}
