"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IconSparkles,
  IconCopy,
  IconCheck,
  IconCircleCheckFilled,
  IconX,
  IconChevronDown,
  IconFilter,
} from "@tabler/icons-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";

/* ── Types ── */

type Recommendation = {
  id: string;
  audit_id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  suggested_copy: string | null;
  is_applied: boolean;
  created_at: string;
  _brandName: string;
  _wsId: string;
};

type TypeGroup = "web_copy" | "content_gap" | "meta_structure" | "all";

/* ── Helpers ── */

const TYPE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  web_copy: { label: "Web Copy", bg: "#EDE9FF", color: "#533AFD" },
  content_gap: { label: "Konten", bg: "#DCFCE7", color: "#16A34A" },
  meta_structure: { label: "Meta & Struktur", bg: "#DBEAFE", color: "#2563EB" },
  structure: { label: "Meta & Struktur", bg: "#DBEAFE", color: "#2563EB" },
  meta: { label: "Meta & Struktur", bg: "#DBEAFE", color: "#2563EB" },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  high: { label: "Tinggi", bg: "#FEE2E2", color: "#DC2626" },
  medium: { label: "Sedang", bg: "#FEF3C7", color: "#D97706" },
  low: { label: "Rendah", bg: "#F3F4F6", color: "#6B7280" },
};

function normalizeType(type: string): string {
  if (type === "structure" || type === "meta") return "meta_structure";
  return type;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.match(/^#{1,3}\s/)) {
      const content = line.replace(/^#{1,3}\s/, "");
      return (
        <p key={i} style={{ fontWeight: 600, marginTop: "12px", marginBottom: "4px" }}>
          {renderBold(content)}
        </p>
      );
    }
    if (line.match(/^[\-\*•]\s/)) {
      const content = line.replace(/^[\-\*•]\s/, "");
      return (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "3px", fontSize: "14px" }}>
          <span style={{ color: "#533AFD", flexShrink: 0 }}>•</span>
          <span>{renderBold(content)}</span>
        </div>
      );
    }
    if (line.trim() === "") return <div key={i} style={{ height: "6px" }} />;
    return (
      <p key={i} style={{ lineHeight: "1.7", marginBottom: "4px" }}>
        {renderBold(line)}
      </p>
    );
  });
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ── Constants ── */

const PANEL_ANIM_MS = 280;

/* ── Component ── */

export default function KontenPage() {
  const { workspaces, activeWorkspaceId, activeWorkspace, loading: wsLoading } = useActiveWorkspace();

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeGroup>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked" | "applied">("all");
  const [workspaceFilter, setWorkspaceFilter] = useState<string>("all");
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  // Panel state
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Data fetching ── */

  useEffect(() => {
    if (wsLoading) return;
    const supabase = createSupabaseBrowserClient();

    async function fetchData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch credits
      fetch("/api/user/credits").then((r) => r.json()).then((d) => {
        if (d.credits !== null) setCredits(d.credits);
      });

      // Get workspaces
      const { data: userWorkspaces } = await supabase
        .from("workspaces")
        .select("id, brand_name")
        .eq("user_id", user.id);

      if (!userWorkspaces || userWorkspaces.length === 0) {
        setRecs([]);
        setLoading(false);
        return;
      }

      const wsIds = userWorkspaces.map((w) => w.id);
      const wsMap = Object.fromEntries(userWorkspaces.map((w) => [w.id, w.brand_name]));

      // Get complete audits
      const { data: audits } = await supabase
        .from("audits")
        .select("id, workspace_id")
        .in("workspace_id", wsIds)
        .eq("status", "complete")
        .order("completed_at", { ascending: false });

      if (!audits || audits.length === 0) {
        setRecs([]);
        setLoading(false);
        return;
      }

      const auditIds = audits.map((a) => a.id);
      const auditWsMap = Object.fromEntries(audits.map((a) => [a.id, a.workspace_id]));

      // Get recommendations
      const { data: recommendations } = await supabase
        .from("recommendations")
        .select("*")
        .in("audit_id", auditIds)
        .order("created_at", { ascending: true });

      if (!recommendations) {
        setRecs([]);
        setLoading(false);
        return;
      }

      const enriched: Recommendation[] = recommendations.map((r) => {
        const wsId = auditWsMap[r.audit_id] ?? "";
        return {
          ...r,
          is_applied: r.is_applied ?? false,
          _brandName: wsMap[wsId] ?? "",
          _wsId: wsId,
        };
      });

      setRecs(enriched);
      setLoading(false);
    }

    fetchData();
  }, [wsLoading]);

  /* ── Handlers ── */

  async function handleReveal(recId: string) {
    setRevealingId(recId);
    try {
      const res = await fetch("/api/recommendations/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation_id: recId }),
      });
      const data = await res.json();
      if (data.suggested_copy) {
        setRecs((prev) =>
          prev.map((r) => r.id === recId ? { ...r, suggested_copy: data.suggested_copy } : r)
        );
        if (typeof credits === "number") setCredits(Math.max(0, credits - 1));
      }
    } catch (err) {
      console.error("Reveal error:", err);
    } finally {
      setRevealingId(null);
    }
  }

  async function handleToggleApplied(recId: string, current: boolean) {
    const newVal = !current;
    // Optimistic update
    setRecs((prev) => prev.map((r) => r.id === recId ? { ...r, is_applied: newVal } : r));
    if (selectedRec?.id === recId) setSelectedRec((prev) => prev ? { ...prev, is_applied: newVal } : prev);

    await fetch("/api/recommendations/toggle-applied", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendation_id: recId, is_applied: newVal }),
    });
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const closePanel = useCallback(() => {
    setPanelClosing(true);
    setTimeout(() => {
      setSelectedRec(null);
      setPanelClosing(false);
    }, PANEL_ANIM_MS);
  }, []);

  function openPanel(rec: Recommendation) {
    if (selectedRec?.id === rec.id) {
      closePanel();
      return;
    }
    setPanelClosing(false);
    setSelectedRec(rec);
    setCopied(false);
  }

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedRec) closePanel();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedRec, closePanel]);

  /* ── Derived data ── */

  const filtered = recs.filter((r) => {
    if (workspaceFilter !== "all" && r._wsId !== workspaceFilter) return false;
    if (typeFilter !== "all" && normalizeType(r.type) !== typeFilter) return false;
    if (statusFilter === "unlocked" && !r.suggested_copy) return false;
    if (statusFilter === "locked" && r.suggested_copy) return false;
    if (statusFilter === "applied" && !r.is_applied) return false;
    return true;
  });

  const totalCount = recs.filter((r) => workspaceFilter === "all" || r._wsId === workspaceFilter).length;
  const appliedCount = recs.filter((r) => (workspaceFilter === "all" || r._wsId === workspaceFilter) && r.is_applied).length;
  const unlockedCount = recs.filter((r) => (workspaceFilter === "all" || r._wsId === workspaceFilter) && r.suggested_copy).length;
  const progressPct = totalCount > 0 ? Math.round((appliedCount / totalCount) * 100) : 0;

  const uniqueWorkspaces = Array.from(
    new Map(recs.map((r) => [r._wsId, r._brandName])).entries()
  ).filter(([id]) => id);

  // Group by type
  const grouped: Record<string, Recommendation[]> = {};
  for (const r of filtered) {
    const t = normalizeType(r.type);
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(r);
  }

  const groupOrder = ["web_copy", "content_gap", "meta_structure"];

  /* ── Render ── */

  if (loading || wsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
        <p style={{ color: "var(--text-muted)" }}>Memuat rekomendasi konten...</p>
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "12px" }}>
        <p style={{ fontSize: "16px", fontWeight: 600 }}>Belum ada rekomendasi</p>
        <p style={{ color: "var(--text-muted)" }}>Jalankan audit untuk mendapatkan rekomendasi konten.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes kontenPanelIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes kontenPanelOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
        @keyframes kontenOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes kontenOverlayOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0, maxWidth: "100%" }}>

        {/* ── Header ── */}
        <div>
          <h1 style={{ fontSize: "20px", margin: "0 0 4px 0" }}>
            Konten
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Rekomendasi konten untuk meningkatkan visibilitas AI brand Anda.
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div style={{
          padding: "20px", borderRadius: 'var(--radius-md)',
          border: "1px solid var(--border-default)", background: "#ffffff",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-heading)" }}>
              Progress
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {appliedCount} dari {totalCount} diterapkan
              {unlockedCount > 0 && ` · ${unlockedCount} dibuka`}
            </span>
          </div>
          <div style={{
            height: "6px", borderRadius: 'var(--radius-xs)', background: "var(--border-default)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 'var(--radius-xs)',
              background: progressPct === 100 ? "#22C55E" : "var(--purple)",
              width: `${progressPct}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>

          {/* Type tabs */}
          <div style={{
            display: "flex", background: "var(--surface)",
            border: "1px solid var(--border-default)", borderRadius: 'var(--radius-md)', overflow: "hidden",
          }}>
            {([
              { key: "all", label: "Semua" },
              { key: "web_copy", label: "Web Copy" },
              { key: "content_gap", label: "Konten" },
              { key: "meta_structure", label: "Meta & Struktur" },
            ] as { key: TypeGroup; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                style={{
                  padding: "8px 14px", fontSize: "13px", fontWeight: 500,
                  border: "none", cursor: "pointer",
                  background: typeFilter === tab.key ? "#ffffff" : "transparent",
                  color: typeFilter === tab.key ? "var(--text-heading)" : "var(--text-muted)",
                  boxShadow: typeFilter === tab.key ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  borderRadius: typeFilter === tab.key ? 'var(--radius-sm)' : "0",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <IconFilter size={14} stroke={1.5} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              style={{
                padding: "7px 28px 7px 10px", fontSize: "13px",
                border: "1px solid var(--border-default)", borderRadius: 'var(--radius-sm)',
                background: "#ffffff", color: "var(--text-body)",
                cursor: "pointer", outline: "none", appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "12px 9px",
              }}
            >
              <option value="all">Semua status</option>
              <option value="unlocked">Sudah dibuka</option>
              <option value="locked">Belum dibuka</option>
              <option value="applied">Sudah diterapkan</option>
            </select>
          </div>

          {/* Workspace filter */}
          {uniqueWorkspaces.length > 1 && (
            <select
              value={workspaceFilter}
              onChange={(e) => setWorkspaceFilter(e.target.value)}
              style={{
                padding: "7px 28px 7px 10px", fontSize: "13px",
                border: "1px solid var(--border-default)", borderRadius: 'var(--radius-sm)',
                background: "#ffffff", color: "var(--text-body)",
                cursor: "pointer", outline: "none", appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "12px 9px",
              }}
            >
              <option value="all">Semua brand</option>
              {uniqueWorkspaces.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          {/* Credits indicator */}
          <div style={{ marginLeft: "auto", fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
            {credits !== null ? `${credits} kredit tersisa` : ""}
          </div>
        </div>

        {/* ── Grouped recommendation cards ── */}
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>Tidak ada rekomendasi yang cocok dengan filter.</p>
          </div>
        ) : typeFilter !== "all" ? (
          /* Flat list when type is selected */
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((rec) => (
              <RecCard key={rec.id} rec={rec} revealingId={revealingId} onReveal={handleReveal} onOpen={openPanel} onToggleApplied={handleToggleApplied} selectedId={selectedRec?.id ?? null} />
            ))}
          </div>
        ) : (
          /* Grouped by type */
          groupOrder.filter((t) => grouped[t]?.length).map((type) => {
            const items = grouped[type]!;
            const typeInfo = TYPE_CONFIG[type] ?? { label: type, bg: "#F3F4F6", color: "#374151" };
            const appliedInGroup = items.filter((r) => r.is_applied).length;
            return (
              <div key={type}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "var(--radius-xs)",
                    background: typeInfo.bg, color: typeInfo.color, textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {typeInfo.label}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {appliedInGroup} dari {items.length} selesai
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                  {items.map((rec) => (
                    <RecCard key={rec.id} rec={rec} revealingId={revealingId} onReveal={handleReveal} onOpen={openPanel} onToggleApplied={handleToggleApplied} selectedId={selectedRec?.id ?? null} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Floating sidebar panel ── */}
      {selectedRec && (
        <>
          {/* Overlay */}
          <div
            onClick={closePanel}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 49,
              animation: `${panelClosing ? "kontenOverlayOut" : "kontenOverlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          />

          {/* Panel */}
          <div
            style={{
              display: "flex", flexDirection: "column",
              position: "fixed", top: "24px", right: "24px", bottom: "24px",
              width: "480px", background: "#ffffff", borderRadius: 'var(--radius-sm)',
              border: "1px solid #E5E7EB", boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
              overflow: "hidden", zIndex: 50,
              animation: `${panelClosing ? "kontenPanelOut" : "kontenPanelIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          >
            {/* Panel header */}
            <div style={{
              flexShrink: 0, padding: "20px 24px 16px", borderBottom: "1px solid #E5E7EB",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-xs)",
                    background: (PRIORITY_CONFIG[selectedRec.priority] ?? PRIORITY_CONFIG.low).bg,
                    color: (PRIORITY_CONFIG[selectedRec.priority] ?? PRIORITY_CONFIG.low).color,
                  }}>
                    Prioritas {(PRIORITY_CONFIG[selectedRec.priority] ?? PRIORITY_CONFIG.low).label}
                  </span>
                  <span style={{
                    fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-xs)",
                    background: (TYPE_CONFIG[selectedRec.type] ?? TYPE_CONFIG.web_copy).bg,
                    color: (TYPE_CONFIG[selectedRec.type] ?? TYPE_CONFIG.web_copy).color,
                  }}>
                    {(TYPE_CONFIG[selectedRec.type] ?? TYPE_CONFIG.web_copy).label}
                  </span>
                </div>
                <h2 style={{ fontSize: "16px", margin: 0 }}>
                  {selectedRec.title}
                </h2>
              </div>
              <button
                onClick={closePanel}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "4px",
                  color: "var(--text-muted)", flexShrink: 0,
                }}
              >
                <IconX size={18} stroke={1.5} />
              </button>
            </div>

            {/* Panel body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {/* Description */}
              <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6, margin: "0 0 20px 0" }}>
                {selectedRec.description}
              </p>

              {selectedRec.suggested_copy ? (
                <>
                  {/* Suggested copy header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--purple)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Saran Perbaikan
                    </span>
                    <button
                      onClick={() => handleCopy(selectedRec.suggested_copy!)}
                      style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "12px", color: copied ? "#22C55E" : "#6B7280",
                        transition: "color 0.15s ease",
                      }}
                    >
                      {copied ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} />}
                      {copied ? "Tersalin" : "Salin"}
                    </button>
                  </div>

                  {/* Content */}
                  <div style={{
                    background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 'var(--radius-md)',
                    padding: "16px",
                  }}>
                    {renderMarkdown(selectedRec.suggested_copy)}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                    Konten belum dibuka. Buka konten ini untuk melihat saran perbaikan.
                  </p>
                  <button
                    onClick={() => handleReveal(selectedRec.id)}
                    disabled={revealingId === selectedRec.id}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "var(--purple)", color: "#ffffff", border: "none", borderRadius: 'var(--radius-md)',
                      padding: "10px 20px", fontSize: "13px", fontWeight: 600,
                      cursor: revealingId === selectedRec.id ? "not-allowed" : "pointer",
                      opacity: revealingId === selectedRec.id ? 0.7 : 1,
                    }}
                  >
                    {revealingId === selectedRec.id ? (
                      <>
                        <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        Membuat konten...
                      </>
                    ) : (
                      <>
                        <IconSparkles size={14} /> Buat Konten · 1 kredit
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Panel footer */}
            {selectedRec.suggested_copy && (
              <div style={{
                flexShrink: 0, padding: "16px 24px", borderTop: "1px solid #E5E7EB",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <button
                  onClick={() => handleToggleApplied(selectedRec.id, selectedRec.is_applied)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: selectedRec.is_applied ? "#F0FDF4" : "var(--surface)",
                    border: `1px solid ${selectedRec.is_applied ? "#BBF7D0" : "var(--border-default)"}`,
                    borderRadius: 'var(--radius-md)', padding: "8px 16px",
                    fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    color: selectedRec.is_applied ? "#16A34A" : "var(--text-body)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {selectedRec.is_applied ? (
                    <><IconCircleCheckFilled size={16} style={{ color: "#22C55E" }} /> Sudah diterapkan</>
                  ) : (
                    "Tandai sudah diterapkan"
                  )}
                </button>

                {selectedRec._brandName && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {selectedRec._brandName}
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

/* ── Recommendation Card ── */

function RecCard({
  rec,
  revealingId,
  onReveal,
  onOpen,
  onToggleApplied,
  selectedId,
}: {
  rec: Recommendation;
  revealingId: string | null;
  onReveal: (id: string) => void;
  onOpen: (rec: Recommendation) => void;
  onToggleApplied: (id: string, current: boolean) => void;
  selectedId: string | null;
}) {
  const typeInfo = TYPE_CONFIG[rec.type] ?? { label: rec.type, bg: "#F3F4F6", color: "#374151" };
  const priorityInfo = PRIORITY_CONFIG[rec.priority] ?? PRIORITY_CONFIG.low;
  const isUnlocked = !!rec.suggested_copy;
  const isRevealing = revealingId === rec.id;
  const isSelected = selectedId === rec.id;

  return (
    <div
      style={{
        padding: "16px 20px", borderRadius: 'var(--radius-md)',
        border: `1px solid ${isSelected ? "var(--purple)" : rec.is_applied ? "#BBF7D0" : "var(--border-default)"}`,
        background: rec.is_applied ? "#FAFFF9" : "#ffffff",
        display: "flex", alignItems: "center", gap: "16px",
        cursor: isUnlocked ? "pointer" : "default",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
      onClick={() => isUnlocked && onOpen(rec)}
      onMouseEnter={(e) => {
        if (isUnlocked && !isSelected) e.currentTarget.style.borderColor = "#C4B5FD";
      }}
      onMouseLeave={(e) => {
        if (isUnlocked && !isSelected) {
          e.currentTarget.style.borderColor = rec.is_applied ? "#BBF7D0" : "var(--border-default)";
        }
      }}
    >
      {/* Applied indicator */}
      <div style={{ flexShrink: 0 }}>
        {rec.is_applied ? (
          <IconCircleCheckFilled size={20} style={{ color: "#22C55E" }} />
        ) : (
          <div style={{
            width: "20px", height: "20px", borderRadius: "50%",
            border: `2px solid ${isUnlocked ? "var(--border-default)" : "#E5E7EB"}`,
            background: "transparent",
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600, padding: "1px 6px", borderRadius: 'var(--radius-xs)',
            background: priorityInfo.bg, color: priorityInfo.color,
          }}>
            {priorityInfo.label}
          </span>
          <span style={{
            fontSize: "11px", fontWeight: 600, padding: "1px 6px", borderRadius: 'var(--radius-xs)',
            background: typeInfo.bg, color: typeInfo.color,
          }}>
            {typeInfo.label}
          </span>
          {rec._brandName && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>
              {rec._brandName}
            </span>
          )}
        </div>
        <h3 style={{ fontSize: "14px", margin: "0 0 2px 0" }}>
          {rec.title}
        </h3>
        <p style={{
          fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {rec.description}
        </p>
      </div>

      {/* Action */}
      <div style={{ flexShrink: 0 }}>
        {isUnlocked ? (
          <span style={{ fontSize: "12px", color: "var(--purple)", fontWeight: 500 }}>
            Lihat →
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onReveal(rec.id); }}
            disabled={isRevealing}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: "var(--purple)", color: "#ffffff", border: "none", borderRadius: 'var(--radius-sm)',
              padding: "7px 12px", fontSize: "12px", fontWeight: 600,
              cursor: isRevealing ? "not-allowed" : "pointer",
              opacity: isRevealing ? 0.7 : 1, whiteSpace: "nowrap",
            }}
          >
            {isRevealing ? (
              <>
                <span style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                Membuat...
              </>
            ) : (
              <>
                <IconSparkles size={12} /> Buat Konten · 1 kredit
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
