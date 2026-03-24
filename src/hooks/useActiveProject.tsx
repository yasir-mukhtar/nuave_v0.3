'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useActiveWorkspace } from './useActiveWorkspace';
import type { Brand } from '@/types';

// Context still exported as "Project" names for backward compat with existing UI consumers
// Internally operates on the `brands` table (v3)
type ActiveProjectContextValue = {
  projects: Brand[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
  activeProject: Brand | undefined;
  loading: boolean;
  refreshProjects: () => Promise<void>;
};

const ActiveProjectContext = createContext<ActiveProjectContextValue>({
  projects: [],
  activeProjectId: null,
  setActiveProjectId: () => {},
  activeProject: undefined,
  loading: true,
  refreshProjects: async () => {},
});

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const { activeWorkspaceId } = useActiveWorkspace();
  const [projects, setProjects] = useState<Brand[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!activeWorkspaceId) {
      setProjects([]);
      setActiveProjectId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    // v3: query brands table (was projects)
    const { data } = await supabase
      .from('brands')
      .select('id, workspace_id, created_by, name, website_url, language, company_overview, differentiators, industry, target_audience, onboarding_completed_at, created_at, updated_at')
      .eq('workspace_id', activeWorkspaceId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setProjects(data as Brand[]);
      const saved = localStorage.getItem('nuave_active_project');
      const valid = saved && data.some(p => p.id === saved);
      setActiveProjectId(valid ? saved : data[0].id);
    } else {
      setProjects([]);
      setActiveProjectId(null);
    }
    setLoading(false);
  }, [activeWorkspaceId]);

  useEffect(() => {
    setActiveProjectId(null);
    localStorage.removeItem('nuave_active_project');
    fetchProjects();
  }, [fetchProjects]);

  const handleSetActiveProject = useCallback((id: string) => {
    setActiveProjectId(id);
    localStorage.setItem('nuave_active_project', id);
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <ActiveProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        setActiveProjectId: handleSetActiveProject,
        activeProject,
        loading,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ActiveProjectContext.Provider>
  );
}

export function useActiveProject() {
  return useContext(ActiveProjectContext);
}
