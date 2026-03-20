'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useActiveWorkspace } from './useActiveWorkspace';
import type { Project } from '@/types';

type ActiveProjectContextValue = {
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
  activeProject: Project | undefined;
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
  const [projects, setProjects] = useState<Project[]>([]);
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

    const { data } = await supabase
      .from('projects')
      .select('id, workspace_id, name, website_url, language, company_overview, differentiators, competitors, industry, target_audience, topics')
      .eq('workspace_id', activeWorkspaceId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setProjects(data as Project[]);
      // Restore previously selected project, or default to latest
      const saved = localStorage.getItem('nuave_active_project');
      const valid = saved && data.some(p => p.id === saved);
      setActiveProjectId(valid ? saved : data[0].id);
    } else {
      setProjects([]);
      setActiveProjectId(null);
    }
    setLoading(false);
  }, [activeWorkspaceId]);

  // Re-fetch when activeWorkspaceId changes
  useEffect(() => {
    // Clear active project when workspace changes
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
