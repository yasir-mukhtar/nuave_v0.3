"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function LowCreditsBanner() {
  const [credits, setCredits] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("users")
        .select("credits_balance")
        .eq("id", data.user.id)
        .single()
        .then(({ data: userData }) => {
          if (userData) setCredits(userData.credits_balance);
        });
    });
  }, []);

  // Only show when credits are 10 or below, and not dismissed
  if (credits === null || credits > 10 || dismissed) return null;

  const isEmpty = credits === 0;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      padding: "12px 24px",
      background: isEmpty ? "#FEF2F2" : "#FFFBEB",
      borderBottom: `1px solid ${isEmpty ? "#FECACA" : "#FDE68A"}`,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "16px" }}>{isEmpty ? "⚠️" : "🪙"}</span>
        <p style={{ fontSize: "14px", color: isEmpty ? "#991B1B" : "#92400E", margin: 0 }}>
          {isEmpty
            ? "Kredit kamu sudah habis. Beli kredit untuk melanjutkan audit dan fitur lainnya."
            : `Kredit kamu hampir habis — tersisa ${credits} kredit.`}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <Link
          href="/dashboard/credits"
          style={{
            fontSize: "13px", fontWeight: 600,
            color: "#ffffff",
            background: isEmpty ? "#EF4444" : "#D97706",
            padding: "6px 16px", borderRadius: "6px",
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          Beli kredit →
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: "none", border: "none",
            cursor: "pointer", padding: "4px",
            color: isEmpty ? "#EF4444" : "#D97706",
            fontSize: "16px", lineHeight: 1,
          }}
          aria-label="Tutup"
        >
          ×
        </button>
      </div>
    </div>
  );
}
