import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LowCreditsBanner from "@/components/LowCreditsBanner";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let credits = 0;
  let userName = "User";
  let workspaceName = "Select Workspace";

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, credits_balance')
      .eq('id', user.id)
      .single();
    
    if (userData) {
      credits = userData.credits_balance ?? 0;
      userName = userData.full_name ?? "User";
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('brand_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (workspace) {
      workspaceName = workspace.brand_name;
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <LowCreditsBanner />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar
          credits={credits}
          userName={userName}
          workspaceName={workspaceName}
        />
        <main
          style={{
            marginLeft: "240px",
            flex: 1,
            overflowY: "auto",
            background: "var(--bg-page)",
            padding: "32px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
