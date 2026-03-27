"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSparkles,
  IconCopy,
  IconCheck,
  IconChevronDown,
  IconInfoCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tip } from "@/components/ui/tip";
import { useActiveProject } from "@/hooks/useActiveProject";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ButtonSpinner } from "@/components/ButtonSpinner";
import type { AuditProblem, Recommendation } from "@/types";

/* ── Types ── */

type Severity = "high" | "medium" | "low";

interface ProblemWithRecs extends AuditProblem {
  recommendations: Recommendation[];
}

/* ── Config ── */

const SEVERITY: Record<Severity, { label: string; bg: string; color: string }> = {
  high:   { label: "Tinggi",  bg: "#FEE2E2", color: "#DC2626" },
  medium: { label: "Sedang",  bg: "#FEF3C7", color: "#D97706" },
  low:    { label: "Rendah",  bg: "#F3F4F6", color: "#6B7280" },
};

const ACTION_TYPE: Record<string, { label: string }> = {
  technical: { label: "Teknikal" },
  web_copy:  { label: "Web Copy" },
  content:   { label: "Konten" },
};

const STATUS_GROUPS = [
  { key: "unresolved",  label: "Belum Selesai" },
  { key: "in_progress", label: "Sedang Dikerjakan" },
  { key: "resolved",    label: "Selesai" },
] as const;

/* ── Helpers ── */

function renderBodyLine(line: string, i: number) {
  const bold = (text: string) =>
    text.split(/(\*\*.*?\*\*)/).map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={j}>{part}</span>
      )
    );

  if (line.startsWith("- ")) {
    return (
      <div key={i} className="flex gap-2 type-body">
        <span className="shrink-0 text-text-muted">&#8226;</span>
        <span>{bold(line.slice(2))}</span>
      </div>
    );
  }
  if (line.startsWith("**") && line.endsWith("**")) {
    return (
      <p key={i} className="font-semibold mt-3 mb-0.5 type-body">
        {bold(line)}
      </p>
    );
  }
  if (line === "") return <div key={i} className="h-2" />;
  return (
    <p key={i} className="type-body">
      {bold(line)}
    </p>
  );
}

/* ── Sub-components ── */

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY[severity] ?? SEVERITY.low;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function ActionTypeBadge({ type }: { type: string }) {
  const cfg = ACTION_TYPE[type] ?? { label: type };
  return (
    <span className="inline-flex items-center h-[24px] px-2 rounded-[4px] border border-[var(--border-light)] type-caption font-medium text-text-muted whitespace-nowrap">
      {cfg.label}
    </span>
  );
}

function CopyBlock({ label, body, mono = false }: { label: string; body: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const clean = body.replace(/\*\*/g, "");
    navigator.clipboard.writeText(clean).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-5">
      <p className="type-body font-semibold text-text-heading mb-2">{label}</p>
      <div className="rounded-md bg-[var(--bg-neutral)] p-4">
        <div className="flex justify-start mb-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 h-[32px] type-body font-medium text-text-muted hover:text-text-body transition-colors cursor-pointer"
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            {copied ? "Tersalin!" : "Salin"}
          </button>
        </div>
        <div
          className="type-body"
          style={{
            fontFamily: mono ? "ui-monospace, monospace" : "inherit",
            color: "var(--text-body)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {mono ? body : body.split("\n").map((line, i) => renderBodyLine(line, i))}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="mb-5">
      <p className="type-body font-semibold text-text-heading mb-2">{label}</p>
      <div className="rounded-md bg-[var(--bg-surface)] border border-border-default px-4 py-3">
        <p className="type-body text-text-body whitespace-pre-line">{body}</p>
      </div>
    </div>
  );
}

function ProblemItem({
  problem,
  selected,
  onClick,
  dimmed = false,
}: {
  problem: ProblemWithRecs;
  selected: boolean;
  onClick: () => void;
  dimmed?: boolean;
}) {
  const severity = (problem.severity ?? "low") as Severity;
  const recCount = problem.recommendations.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 px-8 py-3.5 border-b border-border-light transition-colors",
        selected ? "bg-[var(--bg-surface-raised)]" : "hover:bg-[var(--bg-surface)]",
        dimmed && "opacity-45"
      )}
    >
      <SeverityBadge severity={severity} />
      <span
        className={cn(
          "flex-1 min-w-0 type-body leading-snug truncate",
          selected ? "font-semibold text-text-heading" : "text-text-body"
        )}
      >
        {problem.title}
      </span>
      {recCount > 0 && (
        <span className="type-caption text-text-muted shrink-0">
          {recCount} rek
        </span>
      )}
    </button>
  );
}

/* ── Main Page ── */

export default function ContentPage() {
  const { activeProject, loading: projectLoading } = useActiveProject();

  const [problems, setProblems] = useState<ProblemWithRecs[]>([]);
  const [selected, setSelected] = useState<ProblemWithRecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [showResolved, setShowResolved] = useState(false);

  // Override main scroll+padding so this page owns its own layout
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const prevOverflow = main.style.overflow;
    const prevPadding = main.style.padding;
    main.style.overflow = "hidden";
    main.style.padding = "0";
    return () => {
      main.style.overflow = prevOverflow;
      main.style.padding = prevPadding;
    };
  }, []);

  // Fetch problems with linked recommendations
  const fetchProblems = useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    // Fetch problems for this brand
    const { data: problemsData, error } = await supabase
      .from("audit_problems")
      .select("*")
      .eq("brand_id", activeProject.id)
      .order("created_at", { ascending: true });

    if (error || !problemsData) {
      setLoading(false);
      return;
    }

    // Sort by severity: high → medium → low
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sorted = [...problemsData].sort(
      (a, b) => (order[a.severity ?? "low"] ?? 2) - (order[b.severity ?? "low"] ?? 2)
    );

    // Fetch all recommendations for this brand that have a problem_id
    const { data: recsData } = await supabase
      .from("recommendations")
      .select("*")
      .eq("brand_id", activeProject.id)
      .not("problem_id", "is", null);

    // Group recommendations by problem_id
    const recsByProblem: Record<string, Recommendation[]> = {};
    if (recsData) {
      for (const rec of recsData) {
        if (rec.problem_id) {
          if (!recsByProblem[rec.problem_id]) recsByProblem[rec.problem_id] = [];
          recsByProblem[rec.problem_id].push(rec as Recommendation);
        }
      }
    }

    // Merge
    const merged: ProblemWithRecs[] = sorted.map((p) => ({
      ...p,
      recommendations: recsByProblem[p.id] ?? [],
    }));

    setProblems(merged);
    // Select first unresolved, or first overall
    const firstUnresolved = merged.find((p) => p.status !== "resolved");
    setSelected((prev) => {
      if (prev) {
        const updated = merged.find((p) => p.id === prev.id);
        if (updated) return updated;
      }
      return firstUnresolved ?? merged[0] ?? null;
    });
    setLoading(false);
  }, [activeProject?.id]);

  useEffect(() => {
    if (projectLoading) return;
    if (!activeProject?.id) {
      setProblems([]);
      setLoading(false);
      return;
    }
    fetchProblems();
  }, [activeProject?.id, projectLoading, fetchProblems]);

  // Handle generate recommendations for a problem
  async function handleGenerate(problemId: string) {
    setGenerating(true);
    try {
      const res = await fetch("/api/recommendations/generate-for-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem_id: problemId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast("Kredit tidak cukup. Beli kredit untuk melanjutkan.");
        } else {
          toast(data.error || "Gagal membuat rekomendasi. Coba lagi.");
        }
        setGenerating(false);
        return;
      }

      toast(`${data.recommendations_generated} rekomendasi berhasil dibuat`);
      await fetchProblems(); // Refresh data
    } catch {
      toast("Gagal membuat rekomendasi. Coba lagi.");
    }
    setGenerating(false);
  }

  // Handle mark recommendation as implemented
  async function handleMarkImplemented(recId: string) {
    // Optimistic update
    setProblems((prev) =>
      prev.map((p) => ({
        ...p,
        recommendations: p.recommendations.map((r) =>
          r.id === recId ? { ...r, status: "applied" as const } : r
        ),
      }))
    );
    setSelected((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === recId ? { ...r, status: "applied" as const } : r
        ),
      };
    });
    toast("Rekomendasi ditandai sudah diimplementasi");
    await fetch(`/api/recommendations/${recId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "applied" }),
    });
  }

  async function handleUnmarkImplemented(recId: string) {
    setProblems((prev) =>
      prev.map((p) => ({
        ...p,
        recommendations: p.recommendations.map((r) =>
          r.id === recId ? { ...r, status: "open" as const } : r
        ),
      }))
    );
    setSelected((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === recId ? { ...r, status: "open" as const } : r
        ),
      };
    });
    toast("Rekomendasi ditandai belum diimplementasi");
    await fetch(`/api/recommendations/${recId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "open" }),
    });
  }

  // Handle recheck problem
  async function handleRecheck() {
    if (!selected) return;
    setRecheckLoading(true);
    try {
      const res = await fetch("/api/problems/recheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem_id: selected.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast("Kredit tidak cukup. Beli kredit untuk melanjutkan.");
        } else {
          toast(data.error || "Recheck gagal. Coba lagi.");
        }
        setRecheckLoading(false);
        return;
      }

      await fetchProblems();

      if (data.resolved === "yes") toast.success(data.explanation);
      else if (data.resolved === "partial") toast(data.explanation);
      else toast.error(data.explanation);
    } catch {
      toast("Recheck gagal. Coba lagi.");
    }
    setRecheckLoading(false);
  }

  /* ── Filter problems ── */

  const filtered = problems.filter((p) => {
    if (severityFilter !== "all" && p.severity !== severityFilter) return false;
    return true;
  });

  const unresolved = filtered.filter((p) => p.status === "unresolved");
  const inProgress = filtered.filter((p) => p.status === "in_progress");
  const resolved = filtered.filter((p) => p.status === "resolved");

  /* ── Loading ── */

  if (projectLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="type-body text-text-muted">Memuat masalah...</p>
      </div>
    );
  }

  /* ── No brand ── */

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <p className="type-title text-text-heading mb-2">Pilih brand terlebih dahulu</p>
        <p className="type-body text-text-muted">
          Pilih brand aktif dari topbar untuk melihat masalah dan rekomendasi.
        </p>
      </div>
    );
  }

  /* ── Empty state ── */

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <p className="type-title text-text-heading mb-2">Belum ada masalah terdeteksi</p>
        <p className="type-body text-text-muted mb-6 max-w-sm">
          Jalankan audit untuk {activeProject.name} untuk mendeteksi masalah visibilitas AI.
        </p>
      </div>
    );
  }

  /* ── Check if all recs for selected problem are implemented ── */
  const selectedRecs = selected?.recommendations ?? [];
  const hasRecs = selectedRecs.length > 0;
  const allRecsImplemented = hasRecs && selectedRecs.every((r) => r.status === "applied");

  /* ── Main view ── */

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full w-full">

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col min-h-0 border-r border-border-default shrink-0 bg-white w-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between px-8 h-[52px] border-b border-border-default shrink-0">
            <span className="type-title text-text-heading">Masalah</span>
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1.5 px-8 py-2.5 border-b border-border-default shrink-0">
            {(["all", "high", "medium", "low"] as const).map((sev) => {
              const isActive = severityFilter === sev;
              const label = sev === "all" ? "Semua" : SEVERITY[sev].label;
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "type-caption font-medium rounded-full px-3 py-1 border-none cursor-pointer transition-colors",
                    isActive ? "bg-brand text-white" : "bg-surface-raised text-text-body hover:bg-surface"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Problem list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Unresolved */}
            {unresolved.length > 0 && (
              <>
                <div className="px-8 py-2 type-caption text-text-muted font-medium border-b border-border-light">
                  Belum Selesai ({unresolved.length})
                </div>
                {unresolved.map((p) => (
                  <ProblemItem
                    key={p.id}
                    problem={p}
                    selected={selected?.id === p.id}
                    onClick={() => setSelected(p)}
                  />
                ))}
              </>
            )}

            {/* In Progress */}
            {inProgress.length > 0 && (
              <>
                <div className="px-8 py-2 type-caption text-text-muted font-medium border-b border-border-light">
                  Sedang Dikerjakan ({inProgress.length})
                </div>
                {inProgress.map((p) => (
                  <ProblemItem
                    key={p.id}
                    problem={p}
                    selected={selected?.id === p.id}
                    onClick={() => setSelected(p)}
                  />
                ))}
              </>
            )}

            {/* Resolved */}
            {resolved.length > 0 && (
              <div>
                <button
                  onClick={() => setShowResolved((v) => !v)}
                  className={cn(
                    "flex items-center justify-between w-full px-8 py-2.5 rounded-sm cursor-pointer text-left transition-colors duration-100 border-t border-border-light",
                    showResolved ? "bg-surface-raised" : "bg-transparent hover:bg-surface"
                  )}
                >
                  <span className={cn(
                    "type-body flex items-center gap-1.5",
                    showResolved ? "font-semibold text-text-heading" : "text-text-muted"
                  )}>
                    <IconCheck size={14} stroke={1.5} />
                    Selesai
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={cn(
                      "type-caption shrink-0 tabular-nums",
                      showResolved ? "text-text-heading font-semibold" : "text-text-muted"
                    )}>
                      {resolved.length}
                    </span>
                    <IconChevronDown
                      size={14}
                      className={cn("transition-transform duration-200", showResolved && "rotate-180")}
                    />
                  </span>
                </button>
                {showResolved &&
                  resolved.map((p) => (
                    <ProblemItem
                      key={p.id}
                      problem={p}
                      selected={selected?.id === p.id}
                      onClick={() => setSelected(p)}
                      dimmed
                    />
                  ))}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="type-body py-6 px-8 text-center text-text-muted">
                Tidak ada masalah dengan filter ini.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white">
          {selected ? (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between px-8 h-[52px] border-b border-border-default shrink-0">
                <div className="flex items-center gap-2">
                  <span className="type-title text-text-heading">Detail Masalah</span>
                  <Tip label="Analisis masalah visibilitas AI dan rekomendasi perbaikan.">
                    <IconInfoCircle size={14} className="text-text-muted cursor-default" />
                  </Tip>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto min-h-0 px-8 py-5">
                {/* Problem info */}
                <div className="flex items-center gap-2 mb-3">
                  <SeverityBadge severity={(selected.severity ?? "low") as Severity} />
                  {selected.problem_type && (
                    <span className="type-caption text-text-muted">{selected.problem_type.replace(/_/g, " ")}</span>
                  )}
                </div>
                <p className="type-heading-sm text-text-heading mb-2">{selected.title}</p>
                <p className="type-body text-text-muted mb-6">{selected.description}</p>

                {/* Recommendations section */}
                <div className="border-t border-border-default pt-5">
                  <p className="type-body font-semibold text-text-heading mb-4">
                    Rekomendasi ({selectedRecs.length})
                  </p>

                  {selectedRecs.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRecs.map((rec) => {
                        const isImplemented = rec.status === "applied";
                        return (
                          <div key={rec.id} className="border border-border-default rounded-[var(--radius-md)] p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {rec.type && <ActionTypeBadge type={rec.type} />}
                                {rec.priority && (
                                  <span className={cn(
                                    "type-caption font-medium",
                                    rec.priority === "high" ? "text-error" : rec.priority === "medium" ? "text-warning" : "text-text-muted"
                                  )}>
                                    {rec.priority === "high" ? "Prioritas tinggi" : rec.priority === "medium" ? "Prioritas sedang" : "Prioritas rendah"}
                                  </span>
                                )}
                              </div>
                              {isImplemented ? (
                                <button
                                  onClick={() => handleUnmarkImplemented(rec.id)}
                                  className="flex items-center gap-1 type-caption font-medium text-success hover:opacity-80 transition-opacity cursor-pointer"
                                >
                                  <IconCheck size={14} /> Diimplementasi
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMarkImplemented(rec.id)}
                                  className="flex items-center gap-1 type-caption font-medium text-text-muted hover:text-text-body transition-colors cursor-pointer"
                                >
                                  Tandai selesai
                                </button>
                              )}
                            </div>

                            <p className="type-body font-semibold text-text-heading mb-1">{rec.title}</p>
                            <p className="type-body text-text-muted mb-3">{rec.description}</p>

                            {rec.suggested_copy && (
                              (() => {
                                // Try parsing as JSON blocks (from old generate endpoint)
                                try {
                                  const blocks = JSON.parse(rec.suggested_copy);
                                  if (Array.isArray(blocks)) {
                                    return blocks.map((block: any, i: number) => {
                                      const isMonospace = block.body?.trimStart().startsWith("{") && block.body?.includes('"@');
                                      return block.copyable
                                        ? <CopyBlock key={i} label={block.label} body={block.body} mono={isMonospace} />
                                        : <InfoBlock key={i} label={block.label} body={block.body} />;
                                    });
                                  }
                                } catch { /* not JSON, render as text */ }
                                // Plain text suggested copy
                                return <CopyBlock label="Saran Perbaikan" body={rec.suggested_copy} />;
                              })()
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="type-body text-text-muted mb-4">
                        Belum ada rekomendasi untuk masalah ini.
                      </p>
                      <Button
                        variant="brand"
                        disabled={generating}
                        onClick={() => handleGenerate(selected.id)}
                      >
                        {generating ? (
                          <><ButtonSpinner size={14} /> Membuat rekomendasi...</>
                        ) : (
                          <><IconSparkles size={14} /> Generate Rekomendasi &middot; 5 kredit</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Recheck CTA — visible when all recs are implemented */}
                  {allRecsImplemented && (
                    <div className="mt-6 pt-5 border-t border-border-default text-center">
                      <Button
                        variant="outline"
                        onClick={handleRecheck}
                        disabled={recheckLoading}
                      >
                        <IconRefresh size={14} />
                        {recheckLoading ? "Memeriksa..." : "Periksa Ulang Masalah"}
                      </Button>
                      <p className="type-caption text-text-muted mt-2">Menggunakan 1 kredit</p>
                    </div>
                  )}
                </div>

                <div className="h-2" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <p className="type-body text-text-muted max-w-xs">
                Pilih masalah untuk melihat detail dan rekomendasi perbaikan.
              </p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
