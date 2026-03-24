'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Workspace, WorkspaceWithOrg } from '@/types';

type ActiveWorkspaceContextValue = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  activeWorkspace: Workspace | undefined;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
};

const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextValue>({
  workspaces: [],
  activeWorkspaceId: null,
  setActiveWorkspaceId: () => {},
  activeWorkspace: undefined,
  loading: true,
  refreshWorkspaces: async () => {},
});

export function ActiveWorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // v3: workspaces resolved via workspace_members join (not user_id on workspaces)
    const { data } = await supabase
      .from('workspace_members')
      .select('workspaces(id, org_id, name, slug, created_at, updated_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const ws: Workspace[] = (data || [])
      .map(row => (row as unknown as { workspaces: Workspace | null }).workspaces)
      .filter((w): w is Workspace => w !== null);

    if (ws.length > 0) {
      setWorkspaces(ws);
      const saved = localStorage.getItem('nuave_active_workspace');
      const valid = saved && ws.some(w => w.id === saved);
      setActiveWorkspaceId(valid ? saved : ws[0].id);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSetActiveWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('nuave_active_workspace', id);
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <ActiveWorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        setActiveWorkspaceId: handleSetActiveWorkspace,
        activeWorkspace,
        loading,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </ActiveWorkspaceContext.Provider>
  );
}

export function useActiveWorkspace() {
  return useContext(ActiveWorkspaceContext);
}
