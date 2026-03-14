"use client";

import { useEffect, useState } from "react";
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";
import PromptDetailModal, { type PromptDetail } from "@/components/PromptDetailModal";

/* ── Types ── */

type PromptRow = {
  id: string;
  prompt_text: string;
  ai_response: string;
  brand_mentioned: boolean;
  mention_context: string | null;
  created_at: string;
  audit_id: string;
  audit_date: string;
  stage: string | null;
};

type FilterTab = "all" | "mentioned" | "not_mentioned";

/* ── Component ── */

export default function PromptsPage() {
  const { workspaces, activeWorkspaceId, activeWorkspace, loading: wsLoading } = useActiveWorkspace();

  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [workspaceFilter, setWorkspaceFilter] = useState<string>("all");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptDetail | null>(null);

  useEffect(() => {
    if (wsLoading) return;

    const supabase = createSupabaseBrowserClient();

    async function fetchPrompts() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all workspaces for this user
      const { data: userWorkspaces } = await supabase
        .from("workspaces")
        .select("id, brand_name")
        .eq("user_id", user.id);

      if (!userWorkspaces || userWorkspaces.length === 0) {
        setPrompts([]);
        setLoading(false);
        return;
      }

      const wsIds = userWorkspaces.map((w) => w.id);
      const wsMap = Object.fromEntries(userWorkspaces.map((w) => [w.id, w.brand_name]));

      // Get all complete audits for these workspaces
      const { data: audits } = await supabase
        .from("audits")
        .select("id, workspace_id, completed_at")
        .in("workspace_id", wsIds)
        .eq("status", "complete")
        .order("completed_at", { ascending: false });

      if (!audits || audits.length === 0) {
        setPrompts([]);
        setLoading(false);
        return;
      }

      const auditIds = audits.map((a) => a.id);
      const auditMap = Object.fromEntries(
        audits.map((a) => [a.id, { date: a.completed_at, wsId: a.workspace_id }])
      );

      // Get all audit results
      const { data: results } = await supabase
        .from("audit_results")
        .select("id, audit_id, prompt_text, ai_response, brand_mentioned, mention_context, created_at")
        .in("audit_id", auditIds)
        .order("created_at", { ascending: true });

      // Get prompts table for stage info
      const { data: promptRecords } = await supabase
        .from("prompts")
        .select("id, prompt_text, stage")
        .in("workspace_id", wsIds);

      const stageMap = new Map<string, string>();
      if (promptRecords) {
        for (const p of promptRecords) {
          stageMap.set(p.prompt_text, p.stage ?? "");
        }
      }

      if (!results) {
        setPrompts([]);
        setLoading(false);
        return;
      }

      const rows: PromptRow[] = results.map((r) => {
        const audit = auditMap[r.audit_id];
        return {
          id: r.id,
          prompt_text: r.prompt_text ?? "",
          ai_response: r.ai_response ?? "",
          brand_mentioned: r.brand_mentioned ?? false,
          mention_context: r.mention_context ?? null,
          created_at: r.created_at ?? "",
          audit_id: r.audit_id,
          audit_date: audit?.date ?? "",
          stage: stageMap.get(r.prompt_text ?? "") || null,
          // attach workspace info via audit
          ...({ _wsId: audit?.wsId } as Record<string, unknown>),
        };
      });

      // Attach workspace name
      const enriched: PromptRow[] = rows.map((r) => ({
        ...r,
        _brandName: wsMap[(r as unknown as { _wsId: string })._wsId] ?? "",
        _wsId: (r as unknown as { _wsId: string })._wsId,
      })) as unknown as PromptRow[];

      setPrompts(enriched);
      setLoading(false);
    }

    fetchPrompts();
  }, [wsLoading]);

  /* ── Derived data ── */

  const getBrandName = (row: PromptRow) =>
    (row as unknown as { _brandName: string })._brandName ?? "";
  const getWsId = (row: PromptRow) =>
    (row as unknown as { _wsId: string })._wsId ?? "";

  // Apply filters
  const filtered = prompts.filter((p) => {
    if (workspaceFilter !== "all" && getWsId(p) !== workspaceFilter) return false;
    if (filterTab === "mentioned" && !p.brand_mentioned) return false;
    if (filterTab === "not_mentioned" && p.brand_mentioned) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.prompt_text.toLowerCase().includes(q) && !getBrandName(p).toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalCount = prompts.length;
  const mentionedCount = prompts.filter((p) => p.brand_mentioned).length;
  const mentionRate = totalCount > 0 ? Math.round((mentionedCount / totalCount) * 100) : 0;

  // Filtered stats for active workspace filter
  const filteredByWs = workspaceFilter === "all" ? prompts : prompts.filter((p) => getWsId(p) === workspaceFilter);
  const filteredTotal = filteredByWs.length;
  const filteredMentioned = filteredByWs.filter((p) => p.brand_mentioned).length;
  const filteredRate = filteredTotal > 0 ? Math.round((filteredMentioned / filteredTotal) * 100) : 0;

  // Stage breakdown for filtered set
  const stageStats = { awareness: { total: 0, mentioned: 0 }, consideration: { total: 0, mentioned: 0 }, decision: { total: 0, mentioned: 0 } };
  for (const p of filteredByWs) {
    const s = p.stage as keyof typeof stageStats;
    if (s && stageStats[s]) {
      stageStats[s].total++;
      if (p.brand_mentioned) stageStats[s].mentioned++;
    }
  }

  // Unique workspaces from data
  const uniqueWorkspaces = Array.from(
    new Map(prompts.map((p) => [getWsId(p), getBrandName(p)])).entries()
  ).filter(([id]) => id);

  const brandName = activeWorkspace?.brand_name ?? "";

  /* ── Tab config ── */

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: filtered.length },
    { key: "mentioned", label: "Disebut", count: filtered.filter((p) => p.brand_mentioned).length },
    { key: "not_mentioned", label: "Tidak disebut", count: filtered.filter((p) => !p.brand_mentioned).length },
  ];

  /* ── Render ── */

  if (loading || wsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
        <p style={{ color: "var(--text-muted)" }}>Memuat data prompt...</p>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "12px" }}>
        <p style={{ fontSize: "16px", fontWeight: 600 }}>Belum ada prompt</p>
        <p style={{ color: "var(--text-muted)" }}>Jalankan audit pertama Anda untuk melihat data di sini.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: "20px", margin: "0 0 4px 0" }}>
          Prompt
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Semua pertanyaan yang diajukan AI saat mengaudit brand Anda.
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>

        {/* Total prompts */}
        <div style={{
          padding: "20px", borderRadius: "8px",
          border: "1px solid var(--border-default)", background: "#ffffff",
        }}>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Prompt
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
            {filteredTotal}
          </p>
        </div>

        {/* Mention rate */}
        <div style={{
          padding: "20px", borderRadius: "8px",
          border: "1px solid var(--border-default)", background: "#ffffff",
        }}>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Tingkat Sebutan
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: filteredRate >= 70 ? "#22C55E" : filteredRate >= 40 ? "#F59E0B" : "#EF4444" }}>
            {filteredRate}%
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            {filteredMentioned} dari {filteredTotal} disebut
          </p>
        </div>

        {/* Stage: Awareness */}
        <div style={{
          padding: "20px", borderRadius: "8px",
          border: "1px solid var(--border-default)", background: "#ffffff",
        }}>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Awareness
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
            {stageStats.awareness.total > 0 ? `${Math.round((stageStats.awareness.mentioned / stageStats.awareness.total) * 100)}%` : "—"}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            {stageStats.awareness.mentioned}/{stageStats.awareness.total} disebut
          </p>
        </div>

        {/* Stage: Decision */}
        <div style={{
          padding: "20px", borderRadius: "8px",
          border: "1px solid var(--border-default)", background: "#ffffff",
        }}>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Decision
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
            {stageStats.decision.total > 0 ? `${Math.round((stageStats.decision.mentioned / stageStats.decision.total) * 100)}%` : "—"}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            {stageStats.decision.mentioned}/{stageStats.decision.total} disebut
          </p>
        </div>
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "var(--surface)",
          border: "1px solid var(--border-default)", borderRadius: "8px",
          overflow: "hidden",
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              style={{
                padding: "8px 14px", fontSize: "13px", fontWeight: 500,
                border: "none", cursor: "pointer",
                background: filterTab === tab.key ? "#ffffff" : "transparent",
                color: filterTab === tab.key ? "var(--text-heading)" : "var(--text-muted)",
                boxShadow: filterTab === tab.key ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                borderRadius: filterTab === tab.key ? "6px" : "0",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: "6px", fontSize: "11px", fontWeight: 600,
                background: filterTab === tab.key ? "var(--purple-light)" : "var(--surface)",
                color: filterTab === tab.key ? "var(--purple)" : "var(--text-muted)",
                padding: "2px 6px", borderRadius: "4px",
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Workspace filter */}
        {uniqueWorkspaces.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <IconFilter size={14} stroke={1.5} color="var(--text-muted)" />
            <select
              value={workspaceFilter}
              onChange={(e) => setWorkspaceFilter(e.target.value)}
              style={{
                padding: "7px 28px 7px 10px", fontSize: "13px",
                border: "1px solid var(--border-default)", borderRadius: "6px",
                background: "#ffffff", color: "var(--text-body)",
                cursor: "pointer", outline: "none",
                appearance: "none",
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
          </div>
        )}

        {/* Search */}
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <IconSearch size={14} stroke={1.5} style={{
            position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", pointerEvents: "none",
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari prompt..."
            style={{
              padding: "7px 12px 7px 30px", fontSize: "13px", width: "220px",
              border: "1px solid var(--border-default)", borderRadius: "6px",
              background: "#ffffff", color: "var(--text-body)", outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        border: "1px solid var(--border-default)", borderRadius: "8px",
        background: "#ffffff", overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 120px 100px 140px",
          gap: "0",
          padding: "10px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-default)",
          fontSize: "11px", fontWeight: 600, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          <span />
          <span>Prompt</span>
          <span>Brand</span>
          <span>Stage</span>
          <span>Tanggal Audit</span>
        </div>

        {/* Table rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>
              Tidak ada prompt yang cocok dengan filter.
            </p>
          </div>
        ) : (
          filtered.map((row, i) => (
            <div
              key={row.id}
              onClick={() => setSelectedPrompt({
                prompt_text: row.prompt_text,
                ai_response: row.ai_response,
                brand_mentioned: row.brand_mentioned,
                mention_context: row.mention_context,
                created_at: row.created_at,
              })}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 120px 100px 140px",
                gap: "0",
                padding: "12px 16px",
                alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border-default)" : "none",
                cursor: "pointer",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {/* Status icon */}
              <span>
                {row.brand_mentioned ? (
                  <IconCircleCheckFilled size={18} style={{ color: "#22C55E" }} />
                ) : (
                  <IconCircleXFilled size={18} style={{ color: "#EF4444" }} />
                )}
              </span>

              {/* Prompt text */}
              <span style={{
                fontSize: "13px", color: "var(--text-body)", lineHeight: 1.5,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                paddingRight: "16px",
              }}>
                {row.prompt_text}
              </span>

              {/* Brand name */}
              <span style={{
                fontSize: "12px", color: "var(--text-muted)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {getBrandName(row)}
              </span>

              {/* Stage badge */}
              <span>
                {row.stage ? (
                  <span style={{
                    fontSize: "11px", fontWeight: 500,
                    padding: "2px 8px", borderRadius: "4px",
                    background: row.stage === "awareness" ? "#DBEAFE" : row.stage === "consideration" ? "#FEF3C7" : "#DCFCE7",
                    color: row.stage === "awareness" ? "#2563EB" : row.stage === "consideration" ? "#D97706" : "#16A34A",
                  }}>
                    {row.stage.charAt(0).toUpperCase() + row.stage.slice(1)}
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>—</span>
                )}
              </span>

              {/* Audit date */}
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {row.audit_date
                  ? new Date(row.audit_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                  : "—"
                }
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedPrompt && (
        <PromptDetailModal
          result={selectedPrompt}
          brandName={brandName}
          onClose={() => setSelectedPrompt(null)}
        />
      )}
    </div>
  );
}
