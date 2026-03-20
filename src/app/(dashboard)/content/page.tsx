"use client";

import { useEffect, useState, useCallback } from "react";
import { ButtonSpinner } from "@/components/ButtonSpinner";
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
import { cn } from "@/lib/utils";

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
        <p key={i} className="font-semibold mt-3 mb-1">
          {renderBold(content)}
        </p>
      );
    }
    if (line.match(/^[\-\*\u2022]\s/)) {
      const content = line.replace(/^[\-\*\u2022]\s/, "");
      return (
        <div key={i} className="flex gap-2 mb-[3px] text-[14px] leading-6">
          <span className="text-brand shrink-0">&#8226;</span>
          <span>{renderBold(content)}</span>
        </div>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    return (
      <p key={i} className="leading-[1.7] mb-1 mt-0">
        {renderBold(line)}
      </p>
    );
  });
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
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
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-text-muted">Memuat rekomendasi konten...</p>
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <p className="text-[16px] leading-6 font-semibold">Belum ada rekomendasi</p>
        <p className="text-text-muted">Jalankan audit untuk mendapatkan rekomendasi konten.</p>
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

      <div className="flex flex-col gap-6 min-w-0 max-w-full">

        {/* ── Header ── */}
        <div>
          <h1 className="text-[20px] leading-7 mb-1 mt-0">
            Konten
          </h1>
          <p className="text-text-muted m-0">
            Rekomendasi konten untuk meningkatkan visibilitas AI brand Anda.
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div className="p-5 rounded-md border border-border-default bg-white">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[13px] leading-4 font-semibold text-text-heading">
              Progress
            </span>
            <span className="text-[13px] leading-4 text-text-muted">
              {appliedCount} dari {totalCount} diterapkan
              {unlockedCount > 0 && ` \u00b7 ${unlockedCount} dibuka`}
            </span>
          </div>
          <div className="h-1.5 rounded-xs bg-border-default overflow-hidden">
            <div
              className={cn(
                "h-full rounded-xs transition-[width] duration-300 ease-in-out",
                progressPct === 100 ? "bg-success" : "bg-brand"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Type tabs */}
          <div className="flex bg-surface border border-border-default rounded-md overflow-hidden">
            {([
              { key: "all", label: "Semua" },
              { key: "web_copy", label: "Web Copy" },
              { key: "content_gap", label: "Konten" },
              { key: "meta_structure", label: "Meta & Struktur" },
            ] as { key: TypeGroup; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                className={cn(
                  "px-3.5 py-2 text-[13px] leading-4 font-medium border-none cursor-pointer transition-all duration-100",
                  typeFilter === tab.key
                    ? "bg-white text-text-heading shadow-[0_1px_2px_rgba(0,0,0,0.06)] rounded-sm"
                    : "bg-transparent text-text-muted rounded-none"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <IconFilter size={14} stroke={1.5} className="text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="py-[7px] pl-2.5 pr-7 text-[13px] leading-4 border border-border-default rounded-sm bg-white text-text-body cursor-pointer outline-none appearance-none bg-[url('data:image/svg+xml,%3csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2016%2016%27%3e%3cpath%20fill%3D%27none%27%20stroke%3D%27%236B7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%272%27%20d%3D%27m2%205%206%206%206-6%27/%3e%3c/svg%3e')] bg-no-repeat bg-[right_8px_center] bg-[length:12px_9px]"
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
              className="py-[7px] pl-2.5 pr-7 text-[13px] leading-4 border border-border-default rounded-sm bg-white text-text-body cursor-pointer outline-none appearance-none bg-[url('data:image/svg+xml,%3csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2016%2016%27%3e%3cpath%20fill%3D%27none%27%20stroke%3D%27%236B7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%272%27%20d%3D%27m2%205%206%206%206-6%27/%3e%3c/svg%3e')] bg-no-repeat bg-[right_8px_center] bg-[length:12px_9px]"
            >
              <option value="all">Semua brand</option>
              {uniqueWorkspaces.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          {/* Credits indicator */}
          <div className="ml-auto text-[13px] leading-4 text-text-muted font-medium">
            {credits !== null ? `${credits} kredit tersisa` : ""}
          </div>
        </div>

        {/* ── Grouped recommendation cards ── */}
        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-text-muted">Tidak ada rekomendasi yang cocok dengan filter.</p>
          </div>
        ) : typeFilter !== "all" ? (
          /* Flat list when type is selected */
          <div className="flex flex-col gap-2.5">
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
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="text-[11px] leading-4 font-semibold px-2.5 py-[3px] rounded-xs uppercase tracking-wide"
                    style={{ background: typeInfo.bg, color: typeInfo.color }}
                  >
                    {typeInfo.label}
                  </span>
                  <span className="text-[12px] leading-4 text-text-muted">
                    {appliedInGroup} dari {items.length} selesai
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 mb-7">
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
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{
              animation: `${panelClosing ? "kontenOverlayOut" : "kontenOverlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          />

          {/* Panel */}
          <div
            className="flex flex-col fixed top-6 right-6 bottom-6 w-[480px] bg-white rounded-sm border border-border-default shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden z-50"
            style={{
              animation: `${panelClosing ? "kontenPanelOut" : "kontenPanelIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          >
            {/* Panel header */}
            <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border-default flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex gap-1.5 mb-2">
                  <span
                    className="text-[11px] leading-4 font-semibold px-2 py-0.5 rounded-xs"
                    style={{
                      background: (PRIORITY_CONFIG[selectedRec.priority] ?? PRIORITY_CONFIG.low).bg,
                      color: (PRIORITY_CONFIG[selectedRec.priority] ?? PRIORITY_CONFIG.low).color,
                    }}
                  >
                    Prioritas {(PRIORITY_CONFIG[selectedRec.priority] ?? PRIORITY_CONFIG.low).label}
                  </span>
                  <span
                    className="text-[11px] leading-4 font-semibold px-2 py-0.5 rounded-xs"
                    style={{
                      background: (TYPE_CONFIG[selectedRec.type] ?? TYPE_CONFIG.web_copy).bg,
                      color: (TYPE_CONFIG[selectedRec.type] ?? TYPE_CONFIG.web_copy).color,
                    }}
                  >
                    {(TYPE_CONFIG[selectedRec.type] ?? TYPE_CONFIG.web_copy).label}
                  </span>
                </div>
                <h2 className="text-[16px] leading-6 m-0">
                  {selectedRec.title}
                </h2>
              </div>
              <button
                onClick={closePanel}
                className="bg-none border-none cursor-pointer p-1 text-text-muted shrink-0"
              >
                <IconX size={18} stroke={1.5} />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Description */}
              <p className="text-[14px] leading-6 text-text-muted mb-5 mt-0">
                {selectedRec.description}
              </p>

              {selectedRec.suggested_copy ? (
                <>
                  {/* Suggested copy header */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[12px] leading-4 font-semibold text-brand uppercase tracking-wide">
                      Saran Perbaikan
                    </span>
                    <button
                      onClick={() => handleCopy(selectedRec.suggested_copy!)}
                      className={cn(
                        "flex items-center gap-1 bg-none border-none cursor-pointer text-[12px] leading-4 transition-colors duration-100",
                        copied ? "text-success" : "text-text-muted"
                      )}
                    >
                      {copied ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} />}
                      {copied ? "Tersalin" : "Salin"}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="bg-surface border border-border-default rounded-md p-4">
                    {renderMarkdown(selectedRec.suggested_copy)}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-text-muted mb-4">
                    Konten belum dibuka. Buka konten ini untuk melihat saran perbaikan.
                  </p>
                  <button
                    onClick={() => handleReveal(selectedRec.id)}
                    disabled={revealingId === selectedRec.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 bg-brand text-white border-none rounded-md px-5 py-2.5 text-[13px] leading-4 font-semibold",
                      revealingId === selectedRec.id ? "cursor-not-allowed opacity-70" : "cursor-pointer opacity-100"
                    )}
                  >
                    {revealingId === selectedRec.id ? (
                      <>
                        <ButtonSpinner size={14} />
                        Membuat konten...
                      </>
                    ) : (
                      <>
                        <IconSparkles size={14} /> Buat Konten &middot; 1 kredit
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Panel footer */}
            {selectedRec.suggested_copy && (
              <div className="shrink-0 px-6 py-4 border-t border-border-default flex items-center justify-between">
                <button
                  onClick={() => handleToggleApplied(selectedRec.id, selectedRec.is_applied)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-[13px] leading-4 font-medium cursor-pointer transition-all duration-100",
                    selectedRec.is_applied
                      ? "bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]"
                      : "bg-surface border border-border-default text-text-body"
                  )}
                >
                  {selectedRec.is_applied ? (
                    <><IconCircleCheckFilled size={16} className="text-success" /> Sudah diterapkan</>
                  ) : (
                    "Tandai sudah diterapkan"
                  )}
                </button>

                {selectedRec._brandName && (
                  <span className="text-[12px] leading-4 text-text-muted">
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
      className={cn(
        "px-5 py-4 rounded-md flex items-center gap-4 transition-colors duration-100",
        isSelected
          ? "border border-brand"
          : rec.is_applied
            ? "border border-[#BBF7D0]"
            : "border border-border-default",
        rec.is_applied ? "bg-[#FAFFF9]" : "bg-white",
        isUnlocked ? "cursor-pointer" : "cursor-default",
        isUnlocked && !isSelected && "hover:border-[#C4B5FD]"
      )}
      onClick={() => isUnlocked && onOpen(rec)}
    >
      {/* Applied indicator */}
      <div className="shrink-0">
        {rec.is_applied ? (
          <IconCircleCheckFilled size={20} className="text-success" />
        ) : (
          <div className={cn(
            "w-5 h-5 rounded-full border-2 bg-transparent",
            isUnlocked ? "border-border-default" : "border-border-default"
          )} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="text-[11px] leading-4 font-semibold px-1.5 py-px rounded-xs"
            style={{ background: priorityInfo.bg, color: priorityInfo.color }}
          >
            {priorityInfo.label}
          </span>
          <span
            className="text-[11px] leading-4 font-semibold px-1.5 py-px rounded-xs"
            style={{ background: typeInfo.bg, color: typeInfo.color }}
          >
            {typeInfo.label}
          </span>
          {rec._brandName && (
            <span className="text-[11px] leading-4 text-text-muted ml-1">
              {rec._brandName}
            </span>
          )}
        </div>
        <h3 className="text-[14px] leading-5 mb-0.5 mt-0">
          {rec.title}
        </h3>
        <p className="text-[13px] leading-5 text-text-muted m-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {rec.description}
        </p>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {isUnlocked ? (
          <span className="text-[12px] leading-4 text-brand font-medium">
            Lihat &rarr;
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onReveal(rec.id); }}
            disabled={isRevealing}
            className={cn(
              "flex items-center gap-[5px] bg-brand text-white border-none rounded-sm px-3 py-[7px] text-[12px] leading-4 font-semibold whitespace-nowrap",
              isRevealing ? "cursor-not-allowed opacity-70" : "cursor-pointer opacity-100"
            )}
          >
            {isRevealing ? (
              <>
                <ButtonSpinner size={12} />
                Membuat...
              </>
            ) : (
              <>
                <IconSparkles size={12} /> Buat Konten &middot; 1 kredit
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
