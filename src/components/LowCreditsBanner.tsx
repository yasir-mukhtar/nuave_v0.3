"use client";
import Link from "next/link";
import { useState } from "react";
import { useCreditsBalance } from "@/hooks/useCreditsBalance";

export default function LowCreditsBanner() {
  const { credits } = useCreditsBalance();
  const [dismissed, setDismissed] = useState(false);

  if (credits === null || credits > 5 || dismissed) return null;

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
            fontSize: "18px", lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
