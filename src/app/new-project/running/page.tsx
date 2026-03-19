"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";

export default function RunningPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Memuat...</p>
      </div>
    }>
      <RunningPageContent />
    </Suspense>
  );
}

function RunningPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auditId = searchParams.get("audit_id");
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(10);
  const [status, setStatus] = useState<"running" | "complete" | "failed">("running");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!auditId) {
      router.replace("/new-project");
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/audit/${auditId}/status`);
        const data = await res.json();

        if (data.status === "complete") {
          setStatus("complete");
          setCompleted(data.total_prompts);
          setTotal(data.total_prompts);
          if (pollRef.current) clearInterval(pollRef.current);

          // Store results for report page
          sessionStorage.setItem("nuave_audit_result", JSON.stringify(data));
          setTimeout(() => router.push(`/new-project/report?audit_id=${auditId}`), 1000);
        } else if (data.status === "failed") {
          setStatus("failed");
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setCompleted(data.completed_prompts || 0);
          setTotal(data.total_prompts || 10);
        }
      } catch {
        // Retry on next interval
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [auditId, router]);

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#ffffff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 48 }}>
        <img src={LOGO_SVG} alt="Nuave" width={28} height={28} style={{ objectFit: "contain" }} />
        <span style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          fontSize: 20,
          color: "#111827",
        }}>
          Nuave
        </span>
      </Link>

      {status === "failed" ? (
        <>
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: 20,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 8,
          }}>
            Audit gagal
          </h2>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--text-muted)",
            marginBottom: 24,
          }}>
            Terjadi kesalahan saat menjalankan audit. Silakan coba lagi.
          </p>
          <button
            onClick={() => router.push("/new-project")}
            style={{
              height: 44,
              padding: "0 24px",
              borderRadius: 8,
              border: "none",
              background: "var(--purple)",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </>
      ) : (
        <>
          {/* Spinner */}
          <div style={{
            width: 48,
            height: 48,
            border: "4px solid #E5E7EB",
            borderTop: "4px solid var(--purple)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: 24,
          }} />

          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: 20,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 8,
          }}>
            {status === "complete" ? "Audit selesai!" : "Menjalankan audit..."}
          </h2>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--text-muted)",
            marginBottom: 32,
          }}>
            {status === "complete"
              ? "Mengalihkan ke hasil laporan..."
              : `Menganalisis ${completed} dari ${total} pertanyaan`}
          </p>

          {/* Progress bar */}
          <div style={{
            width: 280,
            height: 6,
            borderRadius: 3,
            background: "#E5E7EB",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 3,
              background: "var(--purple)",
              transition: "width 0.5s ease",
            }} />
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
