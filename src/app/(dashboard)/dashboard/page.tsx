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
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import VisibilityChart from "@/components/dashboard/VisibilityChart";
import CompetitorPanel from "@/components/dashboard/CompetitorPanel";
import MentionPanel from "@/components/dashboard/MentionPanel";
import ActionItemPanel from "@/components/dashboard/ActionItemPanel";
import { PlanGate } from "@/components/PlanGate";
import { useOrgPlan } from "@/hooks/useOrgPlan";
import { getPlanLabel } from "@/lib/plan-gate-client";
import { cn } from "@/lib/utils";

type DashboardData = {
  firstName: string;
  brandName: string;
  brandWebsiteUrl: string | null;
  chartData: { date: string; score: number; competitors: Record<string, number> }[];
  latestScore: number;
  competitors: { name: string; score: number; website_url?: string | null }[];
  mentions: { promptText: string; brandMentioned: boolean; aiResponse: string; createdAt?: string }[];
  actionItems: { title: string; description: string; severity: "high" | "medium" | "low"; problem_type: string }[];
  latestAuditId?: string;
  totalAudits: number;
  avgScore: number;
  planLabel: string;
  completeAudits: { id: string; visibility_score: number; completed_at: string | null; status: string; audit_type: string }[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { activeProjectId, activeProject, loading: wsLoading } = useActiveProject();
  const { plan, loading: planLoading } = useOrgPlan();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wsLoading || !activeProjectId) return;

    const supabase = createSupabaseBrowserClient();

    async function fetchDashboardData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const firstName = userData?.full_name?.split(" ")[0] ?? "User";
      const brandName = activeProject?.name ?? "—";

      const { data: audits } = await supabase
        .from("audits")
        .select("id, visibility_score, completed_at, status, audit_type")
        .eq("brand_id", activeProjectId)
        .order("completed_at", { ascending: false });

      const completeAudits = audits?.filter((a) => a.status === "complete") || [];
      const totalAudits = completeAudits.length;
      const avgScore =
        totalAudits > 0
          ? Math.round(completeAudits.reduce((acc, a) => acc + (a.visibility_score || 0), 0) / totalAudits)
          : 0;

      // Fetch competitor snapshots for all completed audits to build trend lines
      const completeAuditIds = completeAudits.map((a) => a.id);
      let competitorSnapshotsByAudit: Record<string, Record<string, number>> = {};

      if (completeAuditIds.length > 0) {
        const { data: snapshots } = await supabase
          .from("competitor_snapshots")
          .select("audit_id, competitor_name, mention_frequency")
          .in("audit_id", completeAuditIds);

        if (snapshots) {
          for (const snap of snapshots) {
            if (!competitorSnapshotsByAudit[snap.audit_id]) {
              competitorSnapshotsByAudit[snap.audit_id] = {};
            }
            const freq = (snap.mention_frequency ?? 0) * 100;
            competitorSnapshotsByAudit[snap.audit_id][snap.competitor_name] = freq;
          }
        }
      }

      // Pick top 10 competitors from the latest audit only
      const latestAuditCompetitors = completeAudits[0]
        ? competitorSnapshotsByAudit[completeAudits[0].id] ?? {}
        : {};
      const top10Names = Object.entries(latestAuditCompetitors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);

      // Only include top 10 competitors in chart data
      const chartData = completeAudits
        .filter((a) => a.completed_at)
        .map((a) => {
          const allComps = competitorSnapshotsByAudit[a.id] ?? {};
          const filtered: Record<string, number> = {};
          for (const name of top10Names) {
            if (name in allComps) filtered[name] = allComps[name];
          }
          return {
            date: a.completed_at as string,
            score: a.visibility_score ?? 0,
            competitors: filtered,
          };
        });

      const latestScore = completeAudits[0]?.visibility_score ?? 0;
      const latestAuditId = completeAudits[0]?.id;

      // Fetch competitor URLs from brand_competitors (shared by panel + chart)
      const { data: brandCompetitors } = await supabase
        .from("brand_competitors")
        .select("name, website_url")
        .eq("brand_id", activeProjectId);

      const competitorUrlMap: Record<string, string | null> = {};
      (brandCompetitors || []).forEach((c) => {
        competitorUrlMap[c.name] = c.website_url;
      });

      // Derive competitors list from the same snapshot data used by the chart
      const competitors = top10Names.map((name) => ({
        name,
        score: latestAuditCompetitors[name] ?? 0,
        website_url: competitorUrlMap[name] ?? null,
      }));

      let mentions: DashboardData["mentions"] = [];

      if (latestAuditId) {
        const { data: auditResults } = await supabase
          .from("audit_results")
          .select("prompt_text, brand_mentioned, ai_response, created_at")
          .eq("audit_id", latestAuditId);

        if (auditResults && auditResults.length > 0) {
          mentions = auditResults.map((r) => ({
            promptText: r.prompt_text ?? "",
            brandMentioned: r.brand_mentioned ?? false,
            aiResponse: r.ai_response ?? "",
            createdAt: r.created_at ?? undefined,
          }));
        }
      }

      let actionItems: DashboardData["actionItems"] = [];

      // v3: problems are brand-level, ordered by severity
      const { data: problemItems } = await supabase
        .from("audit_problems")
        .select("title, description, severity, problem_type")
        .eq("brand_id", activeProjectId)
        .eq("status", "unresolved")
        .order("created_at", { ascending: true });

      if (problemItems) {
        // Sort by severity: high → medium → low
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const sorted = [...problemItems].sort(
          (a, b) => (order[a.severity ?? "low"] ?? 2) - (order[b.severity ?? "low"] ?? 2)
        );
        actionItems = sorted.map((p) => ({
          title: p.title ?? "",
          description: p.description ?? "",
          severity: (p.severity as "high" | "medium" | "low") ?? "low",
          problem_type: p.problem_type ?? "",
        }));
      }

      // Plan label for stats display
      const planLabel = getPlanLabel(plan);

      setData({
        firstName,
        brandName,
        brandWebsiteUrl: activeProject?.website_url ?? null,
        chartData,
        latestScore,
        competitors,
        mentions,
        actionItems,
        latestAuditId,
        totalAudits,
        avgScore,
        planLabel,
        completeAudits: completeAudits as DashboardData["completeAudits"],
      });
      setLoading(false);
    }

    fetchDashboardData();
  }, [activeProjectId, wsLoading, activeProject]);

  if (wsLoading || loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="type-body text-text-muted">Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting + action */}
      <div>
        <h1 className="type-heading-sm m-0 whitespace-nowrap">
          Selamat datang, {data.firstName}
        </h1>
        <p className="type-body text-text-muted m-0">
          Berikut performa AI visibility{" "}
          <span className="text-text-heading font-medium">{data.brandName}</span>
        </p>
      </div>

      {/* Chart + Competitors row */}
      <div className="grid grid-cols-[1fr_320px] gap-5 items-stretch">
        <PlanGate plan={plan} feature="trend_chart" loading={planLoading}>
          <VisibilityChart
            data={data.chartData}
            latestScore={data.latestScore}
            brandName={data.brandName}
            brandWebsiteUrl={data.brandWebsiteUrl}
            competitors={data.competitors}
          />
        </PlanGate>
        <PlanGate plan={plan} feature="competitor_data" loading={planLoading}>
          <CompetitorPanel competitors={data.competitors} />
        </PlanGate>
      </div>

      {/* Mention + Action Item row */}
      <div className="grid grid-cols-2 gap-5 auto-rows-[480px]">
        <MentionPanel mentions={data.mentions} auditId={data.latestAuditId} brandName={data.brandName} />
        <PlanGate plan={plan} feature="recommendations" loading={planLoading}>
          <ActionItemPanel items={data.actionItems} auditId={data.latestAuditId} />
        </PlanGate>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Total Audit"
          value={data.totalAudits}
          icon={<IconClipboardCheck size={20} className="text-brand" />}
        />
        <StatCard
          label="Rata-rata Skor"
          value={`${data.avgScore}%`}
          icon={<IconChartBar size={20} className="text-brand" />}
        />
        <StatCard
          label="Paket"
          value={data.planLabel}
          icon={<IconWallet size={20} className="text-brand" />}
        />
      </div>

      {/* Audit Terbaru */}
      <div>
        <h2 className="mb-4">
          Audit Terbaru
        </h2>

        {data.completeAudits.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="type-body text-text-muted">
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
      <div className="type-caption flex items-center gap-2 text-text-muted font-medium">
        {icon}
        {label}
      </div>
      <div className="type-heading-sm font-bold text-text-heading">{value}</div>
    </div>
  );
}

function AuditRow({ audit, brandName }: { audit: DashboardData["completeAudits"][number]; brandName: string }) {
  const score = audit.visibility_score || 0;
  const scoreColor = score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-error";
  const isMonitoring = audit.audit_type === "monitoring";

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
        <div className="w-10 h-10 rounded-sm bg-brand-light text-brand flex items-center justify-center type-body-lg font-bold">
          {brandName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="type-title text-text-heading">
              {brandName}
            </span>
            {isMonitoring && (
              <span className="type-caption px-1.5 py-0.5 rounded-sm bg-brand-light text-brand font-medium">
                Monitoring
              </span>
            )}
          </div>
          <span className="type-caption text-text-muted">
            {isMonitoring ? "Checked on" : "Audited on"} {date}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end gap-0.5">
          <span className="type-caption text-text-muted font-medium">
            Visibility Score
          </span>
          <span className={cn("type-body-lg font-bold", scoreColor)}>{score}%</span>
        </div>

        <Link href={`/audit/${audit.id}/results`} className="no-underline">
          <Button variant="default">
            View Results <IconArrowRight size={16} stroke={2} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
