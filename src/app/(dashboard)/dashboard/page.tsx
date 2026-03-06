import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { 
  IconPlus, 
  IconArrowRight, 
  IconChartBar, 
  IconClipboardCheck, 
  IconWallet 
} from "@tabler/icons-react";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // 1. Fetch user credits
  const { data: userData } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .maybeSingle();

  // 2. Fetch audits for all user's workspaces
  const { data: audits, error } = await supabase
    .from("audits")
    .select(`
      id,
      visibility_score,
      completed_at,
      status,
      workspaces!inner (
        brand_name,
        user_id
      )
    `)
    .eq("workspaces.user_id", user.id)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("Dashboard data fetch error:", error);
  }

  const completeAudits = audits?.filter(a => a.status === 'complete') || [];
  const totalAudits = completeAudits.length;
  const avgScore = totalAudits > 0 
    ? Math.round(completeAudits.reduce((acc, a) => acc + (a.visibility_score || 0), 0) / totalAudits)
    : 0;
  const creditsRemaining = userData?.credits_balance ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
          Dashboard
        </h1>
        <Link href="/" style={{ textDecoration: "none" }}>
          <button
            style={{
              background: "var(--purple)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IconPlus size={18} stroke={2.5} /> New Audit
          </button>
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <StatCard 
          label="Total Audits" 
          value={totalAudits} 
          icon={<IconClipboardCheck size={20} color="var(--purple)" />} 
        />
        <StatCard 
          label="Average Score" 
          value={`${avgScore}%`} 
          icon={<IconChartBar size={20} color="var(--purple)" />} 
        />
        <StatCard 
          label="Credits Remaining" 
          value={creditsRemaining} 
          icon={<IconWallet size={20} color="var(--purple)" />} 
        />
      </div>

      {/* Recent Audits */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "16px" }}>
          Recent Audits
        </h2>
        
        {completeAudits.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            No audits found. Start your first audit to see results here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {completeAudits.map((audit) => (
              <AuditRow key={audit.id} audit={audit} />
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
      <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-heading)" }}>
        {value}
      </div>
    </div>
  );
}

function AuditRow({ audit }: { audit: any }) {
  const score = audit.visibility_score || 0;
  let scoreColor = "#EF4444"; // Red
  if (score >= 70) scoreColor = "#22C55E"; // Green
  else if (score >= 40) scoreColor = "#F59E0B"; // Amber

  const brandName = (audit.workspaces as any)?.brand_name || "Unknown Brand";
  const date = audit.completed_at ? new Date(audit.completed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : "—";

  return (
    <div className="card-row" style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between",
      padding: "16px 20px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          background: "var(--purple-light)",
          color: "var(--purple)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: 700
        }}>
          {brandName.charAt(0).toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-heading)" }}>
            {brandName}
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Audited on {date}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
            Visibility Score
          </span>
          <span style={{ fontSize: "16px", fontWeight: 700, color: scoreColor }}>
            {score}%
          </span>
        </div>
        
        <Link href={`/audit/${audit.id}/results`} style={{ textDecoration: "none" }}>
          <button style={{
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
            transition: "all 0.2s"
          }}>
            View Results <IconArrowRight size={16} stroke={2} />
          </button>
        </Link>
      </div>
    </div>
  );
}
