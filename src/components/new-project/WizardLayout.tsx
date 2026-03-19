"use client";

import Link from "next/link";
import { IconX } from "@tabler/icons-react";

const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";

interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onClose?: () => void;
}

export default function WizardLayout({ currentStep, totalSteps, children, onClose }: WizardLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src={LOGO_SVG} alt="Nuave" width={28} height={28} style={{ objectFit: "contain" }} />
          <span style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontWeight: 600,
            fontSize: 20,
            color: "#111827",
          }}>
            Nuave
          </span>
        </Link>

        <button
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 8,
            border: "1px solid var(--border-default)",
            background: "none",
            cursor: "pointer",
            color: "#374151",
            transition: "background-color 0.15s ease, border-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-surface)";
            e.currentTarget.style.borderColor = "#D1D5DB";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "var(--border-default)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = "#E5E7EB";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-surface)";
          }}
          aria-label="Tutup"
        >
          <IconX size={20} stroke={1.5} />
        </button>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: "40px 24px 80px",
      }}>
        {/* Step indicator */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 8,
          }}>
            Langkah {currentStep}/{totalSteps}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i < currentStep ? "var(--purple)" : "#E5E7EB",
                  transition: "background-color 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
