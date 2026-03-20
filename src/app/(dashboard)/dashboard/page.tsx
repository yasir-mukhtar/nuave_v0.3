"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";

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
  const router = useRouter();
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

      const { data: userData } = await supabase
        .from("users")
        .select("credits_balance, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const firstName = userData?.full_name?.split(" ")[0] ?? "User";
      const brandName = activeWorkspace?.brand_name ?? "—";

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
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-label-14 text-text-muted">Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting + action */}
      <div className="flex items-end justify-between">
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 600,
            lineHeight: '40px',
            letterSpacing: '-0.56px',
            color: '#0d0d0d',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            Selamat datang, {data.firstName}
          </h1>
          <p style={{ fontSize: '14px', color: '#8b8b8b', lineHeight: '28px', margin: 0 }}>
            Berikut performa AI visibility{" "}
            <span style={{ color: '#0d0d0d', fontWeight: 500 }}>{data.brandName}</span>
          </p>
        </div>
        <button
          onClick={() => router.push("/new-project")}
          style={{
            background: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Buat laporan
        </button>
      </div>

      {/* Chart + Competitors row */}
      <div className="grid grid-cols-[1fr_320px] gap-5 items-stretch">
        <VisibilityChart data={data.chartData} latestScore={data.latestScore} />
        <CompetitorPanel competitors={data.competitors} />
      </div>

      {/* Mention + Action Item row */}
      <div className="grid grid-cols-2 gap-5 auto-rows-[480px]">
        <MentionPanel mentions={data.mentions} auditId={data.latestAuditId} brandName={data.brandName} />
        <ActionItemPanel items={data.actionItems} auditId={data.latestAuditId} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Total Audits"
          value={data.totalAudits}
          icon={<IconClipboardCheck size={20} className="text-brand" />}
        />
        <StatCard
          label="Average Score"
          value={`${data.avgScore}%`}
          icon={<IconChartBar size={20} className="text-brand" />}
        />
        <StatCard
          label="Credits Remaining"
          value={data.creditsRemaining}
          icon={<IconWallet size={20} className="text-brand" />}
        />
      </div>

      {/* Recent Audits */}
      <div>
        <h2 className="mb-4">
          Recent Audits
        </h2>

        {data.completeAudits.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-label-13 text-text-muted">
              No audits found. Start your first audit to see results here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
    <div className="card p-6 flex flex-col gap-3">
      <div className="text-label-13 flex items-center gap-2 text-text-muted font-medium">
        {icon}
        {label}
      </div>
      <div className="text-[28px] leading-8 font-bold text-text-heading">{value}</div>
    </div>
  );
}

function AuditRow({ audit, brandName }: { audit: any; brandName: string }) {
  const score = audit.visibility_score || 0;
  const scoreColor = score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-error";

  const date = audit.completed_at
    ? new Date(audit.completed_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="card-row flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-sm bg-brand-light text-brand flex items-center justify-center text-[18px] leading-5 font-bold">
          {brandName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-label-16 font-semibold text-text-heading">
            {brandName}
          </span>
          <span className="text-label-13 text-text-muted">
            Audited on {date}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-label-13 text-text-muted font-medium">
            Visibility Score
          </span>
          <span className={cn("text-[16px] leading-5 font-bold", scoreColor)}>{score}%</span>
        </div>

        <Link href={`/audit/${audit.id}/results`} className="no-underline">
          <button className="text-label-13 bg-white border border-border-default rounded-sm px-3.5 py-2 font-semibold text-text-body cursor-pointer flex items-center gap-1.5 transition-all duration-200">
            View Results <IconArrowRight size={16} stroke={2} />
          </button>
        </Link>
      </div>
    </div>
  );
}
