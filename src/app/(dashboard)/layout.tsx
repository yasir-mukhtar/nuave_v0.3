"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import LowCreditsBanner from "@/components/LowCreditsBanner";
import { ActiveWorkspaceProvider, useActiveWorkspace } from "@/hooks/useActiveWorkspace";

type DashboardLayoutProps = {
  children: ReactNode;
};

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const [credits, setCredits] = useState(0);
  const [userName, setUserName] = useState("User");
  const { activeWorkspace } = useActiveWorkspace();
  const workspaceName = activeWorkspace?.brand_name ?? "Select Workspace";

  useEffect(() => {
    localStorage.removeItem('nuave_credits');

    const supabase = createSupabaseBrowserClient();

    async function fetchUser() {
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
      }
    }

    fetchUser();
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
        <div
          style={{
            marginLeft: "200px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-page)",
          }}
        >
          <Topbar />
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "32px",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ActiveWorkspaceProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ActiveWorkspaceProvider>
  );
}
