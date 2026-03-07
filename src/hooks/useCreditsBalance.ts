import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export function useCreditsBalance() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchCredits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("users")
        .select("credits_balance")
        .eq("id", user.id)
        .single();

      if (data) setCredits(data.credits_balance);
      setLoading(false);
    }

    fetchCredits();
  }, []);

  return { credits, loading };
}
