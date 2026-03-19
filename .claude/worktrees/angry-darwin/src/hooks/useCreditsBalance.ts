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

      const { data, error } = await supabase
        .from("users")
        .select("credits_balance")
        .eq("id", user.id)
        .single();

      if (error) console.error("useCreditsBalance error:", error);
      if (data) setCredits(data.credits_balance);
      setLoading(false);
    }

    fetchCredits();
  }, []);

  return { credits, loading };
}
