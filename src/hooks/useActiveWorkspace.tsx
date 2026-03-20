'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Workspace } from '@/types';

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

    const { data } = await supabase
      .from('workspaces')
      .select('id, name, slug, plan, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setWorkspaces(data as Workspace[]);
      // Restore previously selected workspace, or default to latest
      const saved = localStorage.getItem('nuave_active_workspace');
      const valid = saved && data.some(w => w.id === saved);
      setActiveWorkspaceId(valid ? saved : data[0].id);
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
