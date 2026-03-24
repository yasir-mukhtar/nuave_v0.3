import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useCreditsBalance() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function fetchCredits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // v3: credits live on organizations, not users
      // Join: workspace_members → workspaces → organizations
      const { data, error } = await supabase
        .from('organization_members')
        .select('organizations(credits_balance)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) console.error("useCreditsBalance error:", error);

      const org = data?.organizations as unknown as { credits_balance: number } | null;
      if (org) setCredits(org.credits_balance);
      setLoading(false);
    }

    fetchCredits();
  }, []);

  return { credits, loading };
}
