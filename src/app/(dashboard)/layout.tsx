"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import LowCreditsBanner from "@/components/LowCreditsBanner";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [credits, setCredits] = useState(0);
  const [userName, setUserName] = useState("User");
  const [workspaceName, setWorkspaceName] = useState("Select Workspace");

  useEffect(() => {
    // Remove stale credits localStorage key
    localStorage.removeItem('nuave_credits');

    const supabase = createSupabaseBrowserClient();

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, credits_balance')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setCredits(userData.credits_balance ?? 0);
          setUserName(userData.full_name ?? "User");
        }

        const { data: workspace } = await supabase
          .from('workspaces')
          .select('brand_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (workspace) {
          setWorkspaceName(workspace.brand_name);
        }
      }
    }

    fetchData();
  }, []);

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
