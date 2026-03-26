"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import LowCreditsBanner from "@/components/LowCreditsBanner";
import { ActiveWorkspaceProvider, useActiveWorkspace } from "@/hooks/useActiveWorkspace";
import { ActiveProjectProvider, useActiveProject } from "@/hooks/useActiveProject";

type DashboardLayoutProps = {
  children: ReactNode;
};

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const [credits, setCredits] = useState(0);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const { activeWorkspace } = useActiveWorkspace();
  const { activeProject, projects } = useActiveProject();
  const workspaceName = activeWorkspace?.name ?? "Select Workspace";
  const projectName = activeProject?.name ?? "Select Project";
  // Workspace favicon: use the first brand's website (stable), not the active project's
  const workspaceWebsiteUrl = projects[projects.length - 1]?.website_url ?? undefined;
  const projectWebsiteUrl = activeProject?.website_url ?? undefined;

  useEffect(() => {
    localStorage.removeItem('nuave_credits');

    const supabase = createSupabaseBrowserClient();

    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? "");

        // v3: user name from users table; credits from organizations via membership
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (userData) {
          setUserName(userData.full_name ?? "User");
        }

        // v3: credits live on organizations, not users
        const { data: omData } = await supabase
          .from('organization_members')
          .select('organizations(credits_balance)')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        const org = omData?.organizations as unknown as { credits_balance: number } | null;
        if (org) setCredits(org.credits_balance ?? 0);
      }
    }

    fetchUser();
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden" data-lenis-prevent>
      <LowCreditsBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          credits={credits}
          userName={userName}
          userEmail={userEmail}
          workspaceName={workspaceName}
          projectName={projectName}
          websiteUrl={workspaceWebsiteUrl}
        />
        <div className="ml-64 flex min-h-0 min-w-0 flex-1 flex-col bg-page">
          <Topbar />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-8">
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
      <ActiveProjectProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </ActiveProjectProvider>
    </ActiveWorkspaceProvider>
  );
}
