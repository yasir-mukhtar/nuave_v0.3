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
  const [userEmail, setUserEmail] = useState("");
  const { activeWorkspace } = useActiveWorkspace();
  const workspaceName = activeWorkspace?.brand_name ?? "Select Workspace";

  useEffect(() => {
    localStorage.removeItem('nuave_credits');

    const supabase = createSupabaseBrowserClient();

    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? "");
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
    <div className="flex min-h-screen flex-col">
      <LowCreditsBanner />
      <div className="flex flex-1">
        <Sidebar
          credits={credits}
          userName={userName}
          userEmail={userEmail}
          workspaceName={workspaceName}
        />
        <div className="ml-64 flex min-w-0 flex-1 flex-col bg-page">
          <Topbar />
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-8">
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
