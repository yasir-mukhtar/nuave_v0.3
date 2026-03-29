"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import PlanUpgradeBanner from "@/components/PlanUpgradeBanner";
import { useOrgPlan } from "@/hooks/useOrgPlan";
import { getPlanLabel } from "@/lib/plan-gate-client";
import { ActiveWorkspaceProvider, useActiveWorkspace } from "@/hooks/useActiveWorkspace";
import { ActiveProjectProvider, useActiveProject } from "@/hooks/useActiveProject";
import { Toaster } from "@/components/ui/sonner";

type DashboardLayoutProps = {
  children: ReactNode;
};

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const { plan } = useOrgPlan();
  const planLabel = getPlanLabel(plan);
  const { activeWorkspace } = useActiveWorkspace();
  const { activeProject, projects } = useActiveProject();
  const workspaceName = activeWorkspace?.name ?? "Select Workspace";
  const projectName = activeProject?.name ?? "Select Project";
  // Workspace favicon: use the first brand's website (stable), not the active project's
  const workspaceWebsiteUrl = projects[projects.length - 1]?.website_url ?? undefined;
  const projectWebsiteUrl = activeProject?.website_url ?? undefined;
  const pathname = usePathname();
  const hideTopbar = pathname?.startsWith("/settings");

  useEffect(() => {
    localStorage.removeItem('nuave_credits');

    const supabase = createSupabaseBrowserClient();

    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? "");

        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (userData) {
          setUserName(userData.full_name ?? "User");
        }
      }
    }

    fetchUser();
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden" data-lenis-prevent>
      <PlanUpgradeBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          planLabel={planLabel}
          userName={userName}
          userEmail={userEmail}
          workspaceName={workspaceName}
          projectName={projectName}
          websiteUrl={workspaceWebsiteUrl}
        />
        <div className="ml-64 flex min-h-0 min-w-0 flex-1 flex-col bg-page">
          {!hideTopbar && <Topbar />}
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
    <>
      <ActiveWorkspaceProvider>
        <ActiveProjectProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </ActiveProjectProvider>
      </ActiveWorkspaceProvider>
      <Toaster />
    </>
  );
}
