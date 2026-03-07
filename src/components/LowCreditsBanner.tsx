"use client";
import Link from "next/link";
import { useState } from "react";
import { useCreditsBalance } from "@/hooks/useCreditsBalance";
import { IconCoins } from "@tabler/icons-react";

export default function LowCreditsBanner() {
  const { credits } = useCreditsBalance();
  const [dismissed, setDismissed] = useState(false);

  if (credits === null || credits > 5 || dismissed) return null;

  const isEmpty = credits === 0;

  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      padding: "10px 24px",
      background: isEmpty ? "#FEF2F2" : "#FFFBEB",
      borderBottom: `1px solid ${isEmpty ? "#FECACA" : "#FDE68A"}`,
      position: "relative",
      boxSizing: "border-box",
    }}>
      {/* Centered content */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <IconCoins size={16} color={isEmpty ? "#991B1B" : "#92400E"} />
        <p style={{ fontSize: "14px", color: isEmpty ? "#991B1B" : "#92400E", margin: 0 }}>
          {isEmpty
            ? "Kredit kamu sudah habis. Beli kredit untuk melanjutkan audit dan fitur lainnya."
            : `Kredit kamu hampir habis — tersisa ${credits} kredit.`}
        </p>
        <Link
          href="/dashboard/credits"
          style={{
            fontSize: "13px", fontWeight: 600,
            color: "#ffffff",
            background: isEmpty ? "#EF4444" : "#D97706",
            padding: "5px 14px", borderRadius: "6px",
            textDecoration: "none", whiteSpace: "nowrap",
            marginLeft: "4px",
          }}
        >
          Beli kredit →
        </Link>
      </div>

      {/* Dismiss button — absolute right */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute", right: "16px", top: "50%",
          transform: "translateY(-50%)",
          background: "none", border: "none",
          cursor: "pointer", padding: "4px",
          color: isEmpty ? "#EF4444" : "#D97706",
          fontSize: "18px", lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
