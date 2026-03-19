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

    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id, brand_name, website_url, company_overview, differentiators, competitors, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!workspaces || workspaces.length === 0) {
      setBrands([]);
      setLoading(false);
      return;
    }

    const wsIds = workspaces.map((w) => w.id);

    // Fetch audits for all workspaces
    const { data: audits } = await supabase
      .from("audits")
      .select("id, workspace_id, visibility_score, status, brand_mention_count, total_prompts")
      .in("workspace_id", wsIds)
      .eq("status", "complete")
      .order("completed_at", { ascending: false });

    // Fetch recommendations for all audits
    const auditIds = audits?.map((a) => a.id) ?? [];
    let recs: { audit_id: string; is_applied: boolean }[] = [];
    if (auditIds.length > 0) {
      const { data } = await supabase
        .from("recommendations")
        .select("audit_id, is_applied")
        .in("audit_id", auditIds);
      recs = data ?? [];
    }

    // Build per-workspace stats
    const enriched: BrandWorkspace[] = workspaces.map((ws) => {
      const wsAudits = audits?.filter((a) => a.workspace_id === ws.id) ?? [];
      const latestAudit = wsAudits[0] ?? null;
      const wsAuditIds = wsAudits.map((a) => a.id);
      const wsRecs = recs.filter((r) => wsAuditIds.includes(r.audit_id));

      let mentionRate: number | null = null;
      if (latestAudit && latestAudit.total_prompts > 0) {
        mentionRate = Math.round((latestAudit.brand_mention_count / latestAudit.total_prompts) * 100);
      }

      return {
        ...ws,
        differentiators: ws.differentiators ?? [],
        competitors: ws.competitors ?? [],
        _totalAudits: wsAudits.length,
        _latestScore: latestAudit?.visibility_score ?? null,
        _mentionRate: mentionRate,
        _appliedCount: wsRecs.filter((r) => r.is_applied).length,
        _totalRecs: wsRecs.length,
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

    const res = await fetch(`/api/workspaces/${editingBrand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
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

    const res = await fetch(`/api/workspaces/${deletingId}`, { method: "DELETE" });
    if (res.ok) {
      setBrands((prev) => prev.filter((b) => b.id !== deletingId));
      closeDelete();
    }
    setDeleting(false);
  }

  async function handleRescrape(id: string) {
    setRescrapingId(id);
    try {
      const res = await fetch(`/api/workspaces/${id}/rescrape`, { method: "POST" });
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
        <p style={{ color: "var(--text-muted)" }}>Memuat data brand...</p>
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

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0, maxWidth: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "20px", margin: "0 0 4px 0" }}>
              Brand
            </h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              Kelola profil brand yang Anda audit di Nuave.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "var(--purple)", color: "#ffffff", border: "none", borderRadius: 'var(--radius-md)',
              padding: "9px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            <IconPlus size={15} stroke={2} />
            Tambah Brand
          </button>
        </div>

        {/* Empty state */}
        {brands.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "320px", gap: "12px",
            border: "1px dashed var(--border-default)", borderRadius: 'var(--radius-md)', background: "#ffffff",
          }}>
            <p style={{ fontSize: "16px", fontWeight: 600 }}>
              Belum ada brand
            </p>
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
              Tambahkan brand pertama Anda untuk mulai audit visibilitas AI.
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "var(--purple)", color: "#ffffff", border: "none", borderRadius: 'var(--radius-md)',
                padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                marginTop: "8px",
              }}
            >
              <IconPlus size={15} stroke={2} />
              Tambah Brand
            </button>
          </div>
        ) : (
          /* Brand cards */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 49,
              animation: `${editClosing ? "brandOverlayOut" : "brandOverlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          />
          <div
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "560px", maxWidth: "calc(100vw - 48px)",
              maxHeight: "calc(100vh - 80px)",
              background: "#ffffff", borderRadius: 'var(--radius-lg)',
              border: "1px solid var(--border-default)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
              display: "flex", flexDirection: "column",
              overflow: "hidden", zIndex: 50,
              animation: `${editClosing ? "brandModalOut" : "brandModalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          >
            {/* Modal header */}
            <div style={{
              flexShrink: 0, padding: "20px 24px", borderBottom: "1px solid var(--border-default)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h2 style={{ fontSize: "16px", margin: 0 }}>
                Edit Brand
              </h2>
              <button onClick={closeEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <IconX size={18} stroke={1.5} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: editForm.differentiators.length > 0 ? "8px" : 0 }}>
                    {editForm.differentiators.map((d, i) => (
                      <span key={i} style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 10px", borderRadius: "var(--radius-xs)",
                        background: "#EDE9FF", color: "#533AFD", fontSize: "12px", fontWeight: 500,
                      }}>
                        {d}
                        <button
                          onClick={() => removeChip("differentiators", i)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#533AFD", padding: 0, display: "flex" }}
                        >
                          <IconX size={12} stroke={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={newDiff}
                      onChange={(e) => setNewDiff(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("differentiators", newDiff); } }}
                      placeholder="Tambah keunggulan, tekan Enter"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                {/* Competitors */}
                <div className="form-field">
                  <label>Kompetitor</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: editForm.competitors.length > 0 ? "8px" : 0 }}>
                    {editForm.competitors.map((c, i) => (
                      <span key={i} style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 10px", borderRadius: "var(--radius-xs)",
                        background: "#F3F4F6", color: "#374151", fontSize: "12px", fontWeight: 500,
                      }}>
                        {c}
                        <button
                          onClick={() => removeChip("competitors", i)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 0, display: "flex" }}
                        >
                          <IconX size={12} stroke={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={newComp}
                      onChange={(e) => setNewComp(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("competitors", newComp); } }}
                      placeholder="Tambah kompetitor, tekan Enter"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              flexShrink: 0, padding: "16px 24px", borderTop: "1px solid var(--border-default)",
              display: "flex", justifyContent: "flex-end", gap: "10px",
            }}>
              <button
                onClick={closeEdit}
                style={{
                  padding: "8px 16px", fontSize: "13px", fontWeight: 500,
                  background: "var(--surface)", border: "1px solid var(--border-default)",
                  borderRadius: 'var(--radius-md)', cursor: "pointer", color: "var(--text-body)",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.brand_name.trim()}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 20px", fontSize: "13px", fontWeight: 600,
                  background: "var(--purple)", color: "#ffffff", border: "none",
                  borderRadius: 'var(--radius-md)', cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving || !editForm.brand_name.trim() ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <>
                    <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
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
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 49,
              animation: `${deleteClosing ? "brandOverlayOut" : "brandOverlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          />
          <div
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "420px", maxWidth: "calc(100vw - 48px)",
              background: "#ffffff", borderRadius: 'var(--radius-lg)',
              border: "1px solid var(--border-default)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
              padding: "24px", zIndex: 50,
              animation: `${deleteClosing ? "brandModalOut" : "brandModalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <IconAlertTriangle size={20} stroke={1.5} style={{ color: "#DC2626" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "15px", margin: 0 }}>
                  Hapus Brand
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  Semua data audit, prompt, dan rekomendasi untuk brand <strong>{brands.find((b) => b.id === deletingId)?.brand_name}</strong> akan dihapus permanen.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={closeDelete}
                style={{
                  padding: "8px 16px", fontSize: "13px", fontWeight: 500,
                  background: "var(--surface)", border: "1px solid var(--border-default)",
                  borderRadius: 'var(--radius-md)', cursor: "pointer", color: "var(--text-body)",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 20px", fontSize: "13px", fontWeight: 600,
                  background: "#DC2626", color: "#ffffff", border: "none",
                  borderRadius: 'var(--radius-md)', cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                }}
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
    <div
      style={{
        padding: "24px", borderRadius: 'var(--radius-md)',
        border: "1px solid var(--border-default)",
        background: "#ffffff",
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C4B5FD"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
    >
      {/* Top row: avatar + name + URL + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
        {/* Avatar */}
        <div style={{
          width: "40px", height: "40px", borderRadius: "var(--radius-md)",
          background: "var(--purple)", color: "#ffffff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", fontWeight: 700, flexShrink: 0,
        }}>
          {getInitial(brand.brand_name)}
        </div>

        {/* Name + URL */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            onClick={onSelect}
            style={{
              fontSize: "15px",
              margin: 0, cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--purple)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-heading)"; }}
          >
            {brand.brand_name}
          </h3>
          <a
            href={brand.website_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12px", color: "var(--text-muted)",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--purple)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            {brand.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            <IconExternalLink size={11} stroke={1.5} />
          </a>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          <ActionButton
            icon={<IconRefresh size={15} stroke={1.5} style={isRescraping ? { animation: "spin 1s linear infinite" } : undefined} />}
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
        <p style={{
          fontSize: "13px", color: "var(--text-body)", lineHeight: 1.6,
          margin: "0 0 16px 0",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {brand.company_overview}
        </p>
      )}

      {/* Chips: differentiators + competitors */}
      {(brand.differentiators.length > 0 || brand.competitors.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "16px" }}>
          {brand.differentiators.map((d, i) => (
            <span key={`d-${i}`} style={{
              padding: "3px 8px", borderRadius: "var(--radius-xs)", fontSize: "11px", fontWeight: 500,
              background: "#EDE9FF", color: "#533AFD",
            }}>
              {d}
            </span>
          ))}
          {brand.competitors.map((c, i) => (
            <span key={`c-${i}`} style={{
              padding: "3px 8px", borderRadius: "var(--radius-xs)", fontSize: "11px", fontWeight: 500,
              background: "#F3F4F6", color: "#6B7280",
            }}>
              vs {c}
            </span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div style={{
        display: "flex", gap: "24px", paddingTop: "14px",
        borderTop: "1px solid var(--border-default)",
      }}>
        <StatItem
          label="Skor"
          value={hasStats && brand._latestScore !== null ? `${brand._latestScore}%` : "—"}
          color={hasStats && brand._latestScore !== null
            ? (brand._latestScore >= 60 ? "#22C55E" : brand._latestScore >= 30 ? "#F59E0B" : "#EF4444")
            : undefined
          }
        />
        <StatItem label="Audit" value={hasStats ? `${brand._totalAudits}` : "—"} />
        <StatItem
          label="Tingkat Sebutan"
          value={hasStats && brand._mentionRate !== null ? `${brand._mentionRate}%` : "—"}
        />
        <StatItem
          label="Rekomendasi"
          value={hasStats ? `${brand._appliedCount}/${brand._totalRecs} selesai` : "—"}
        />
      </div>
    </div>
  );
}

/* ── Small helpers ── */

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: color ?? "var(--text-heading)" }}>{value}</div>
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
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "32px", borderRadius: 'var(--radius-sm)',
        background: "transparent", border: "1px solid transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        color: danger ? "#DC2626" : "var(--text-muted)",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = danger ? "#FEF2F2" : "var(--surface)";
          e.currentTarget.style.borderColor = danger ? "#FECACA" : "var(--border-default)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {icon}
    </button>
  );
}
