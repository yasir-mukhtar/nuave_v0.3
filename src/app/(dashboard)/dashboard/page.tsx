"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconChartBar,
  IconClipboardCheck,
  IconWallet,
} from "@tabler/icons-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";
import VisibilityChart from "@/components/dashboard/VisibilityChart";
import CompetitorPanel from "@/components/dashboard/CompetitorPanel";
import MentionPanel from "@/components/dashboard/MentionPanel";
import ActionItemPanel from "@/components/dashboard/ActionItemPanel";

type DashboardData = {
  firstName: string;
  brandName: string;
  chartData: { date: string; score: number }[];
  latestScore: number;
  competitors: { name: string; score: number }[];
  mentions: { promptText: string; brandMentioned: boolean; aiResponse: string; createdAt?: string }[];
  actionItems: { title: string; description: string; priority: "high" | "medium" | "low"; type: string }[];
  latestAuditId?: string;
  totalAudits: number;
  avgScore: number;
  creditsRemaining: number;
  completeAudits: any[];
};

export default function DashboardPage() {
  const { activeWorkspaceId, activeWorkspace, loading: wsLoading } = useActiveWorkspace();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wsLoading || !activeWorkspaceId) return;

    const supabase = createSupabaseBrowserClient();

    async function fetchDashboardData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user info
      const { data: userData } = await supabase
        .from("users")
        .select("credits_balance, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const firstName = userData?.full_name?.split(" ")[0] ?? "User";
      const brandName = activeWorkspace?.brand_name ?? "—";

      // Fetch audits for the active workspace
      const { data: audits } = await supabase
        .from("audits")
        .select("id, visibility_score, completed_at, status")
        .eq("workspace_id", activeWorkspaceId)
        .order("completed_at", { ascending: false });

      const completeAudits = audits?.filter((a) => a.status === "complete") || [];
      const totalAudits = completeAudits.length;
      const avgScore =
        totalAudits > 0
          ? Math.round(completeAudits.reduce((acc, a) => acc + (a.visibility_score || 0), 0) / totalAudits)
          : 0;

      const chartData = completeAudits
        .filter((a) => a.completed_at)
        .map((a) => ({
          date: a.completed_at as string,
          score: a.visibility_score ?? 0,
        }));

      const latestScore = completeAudits[0]?.visibility_score ?? 0;
      const latestAuditId = completeAudits[0]?.id;

      // Fetch audit results for competitors + mentions
      let competitors: { name: string; score: number }[] = [];
      let mentions: DashboardData["mentions"] = [];

      if (latestAuditId) {
        const { data: auditResults } = await supabase
          .from("audit_results")
          .select("prompt_text, brand_mentioned, competitor_mentions, ai_response, created_at")
          .eq("audit_id", latestAuditId);

        if (auditResults && auditResults.length > 0) {
          const totalPrompts = auditResults.length;
          const mentionCounts: Record<string, number> = {};

          for (const result of auditResults) {
            const compMentions = result.competitor_mentions ?? [];
            const unique = [...new Set((compMentions as string[]).map((m) => m.trim()))];
            for (const name of unique) {
              if (name) {
                mentionCounts[name] = (mentionCounts[name] || 0) + 1;
              }
            }
          }

          competitors = Object.entries(mentionCounts)
            .map(([name, count]) => ({ name, score: (count / totalPrompts) * 100 }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

          mentions = auditResults.map((r) => ({
            promptText: r.prompt_text ?? "",
            brandMentioned: r.brand_mentioned ?? false,
            aiResponse: r.ai_response ?? "",
            createdAt: r.created_at ?? undefined,
          }));
        }
      }

      // Fetch recommendations
      let actionItems: DashboardData["actionItems"] = [];

      if (latestAuditId) {
        const { data: recs } = await supabase
          .from("recommendations")
          .select("title, description, priority, type")
          .eq("audit_id", latestAuditId)
          .order("created_at", { ascending: true });

        if (recs) {
          actionItems = recs.map((r) => ({
            title: r.title ?? "",
            description: r.description ?? "",
            priority: (r.priority as "high" | "medium" | "low") ?? "low",
            type: r.type ?? "web_copy",
          }));
        }
      }

      setData({
        firstName,
        brandName,
        chartData,
        latestScore,
        competitors,
        mentions,
        actionItems,
        latestAuditId,
        totalAudits,
        avgScore,
        creditsRemaining: userData?.credits_balance ?? 0,
        completeAudits,
      });
      setLoading(false);
    }

    fetchDashboardData();
  }, [activeWorkspaceId, wsLoading, activeWorkspace]);

  if (wsLoading || loading || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <p style={{ color: "var(--text-muted)" }}>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: "28px", margin: 0, lineHeight: 1.3 }}>
          Selamat datang, {data.firstName}
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "4px 0 0", lineHeight: 1.4 }}>
          Berikut performa AI visibility{" "}
          <span style={{ fontWeight: 600, color: "var(--text-heading)" }}>{data.brandName}</span>
        </p>
      </div>

      {/* Chart + Competitors row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "stretch" }}>
        <VisibilityChart data={data.chartData} latestScore={data.latestScore} />
        <CompetitorPanel competitors={data.competitors} />
      </div>

      {/* Mention + Action Item row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", gridAutoRows: "480px" }}>
        <MentionPanel mentions={data.mentions} auditId={data.latestAuditId} brandName={data.brandName} />
        <ActionItemPanel items={data.actionItems} auditId={data.latestAuditId} />
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <StatCard
          label="Total Audits"
          value={data.totalAudits}
          icon={<IconClipboardCheck size={20} color="var(--purple)" />}
        />
        <StatCard
          label="Average Score"
          value={`${data.avgScore}%`}
          icon={<IconChartBar size={20} color="var(--purple)" />}
        />
        <StatCard
          label="Credits Remaining"
          value={data.creditsRemaining}
          icon={<IconWallet size={20} color="var(--purple)" />}
        />
      </div>

      {/* Recent Audits */}
      <div>
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>
          Recent Audits
        </h2>

        {data.completeAudits.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            No audits found. Start your first audit to see results here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.completeAudits.map((audit) => (
              <AuditRow key={audit.id} audit={audit} brandName={data.brandName} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-heading)" }}>{value}</div>
    </div>
  );
}

function AuditRow({ audit, brandName }: { audit: any; brandName: string }) {
  const score = audit.visibility_score || 0;
  let scoreColor = "#EF4444";
  if (score >= 70) scoreColor = "#22C55E";
  else if (score >= 40) scoreColor = "#F59E0B";

  const date = audit.completed_at
    ? new Date(audit.completed_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div
      className="card-row"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "6px",
            background: "var(--purple-light)",
            color: "var(--purple)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          {brandName.charAt(0).toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-heading)" }}>{brandName}</span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Audited on {date}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Visibility Score</span>
          <span style={{ fontSize: "16px", fontWeight: 700, color: scoreColor }}>{score}%</span>
        </div>

        <Link href={`/audit/${audit.id}/results`} style={{ textDecoration: "none" }}>
          <button
            style={{
              background: "white",
              border: "1px solid var(--border-default)",
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-body)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
          >
            View Results <IconArrowRight size={16} stroke={2} />
          </button>
        </Link>
      </div>
    </div>
  );
}
