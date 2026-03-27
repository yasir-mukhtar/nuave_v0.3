"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";

const THINKING_MESSAGES = [
  "Mengirim pertanyaan ke ChatGPT...",
  "Mencari informasi di web...",
  "Menganalisis hasil pencarian...",
  "Memeriksa apakah AI menyebut brand Anda...",
  "Membandingkan dengan kompetitor...",
  "Memindai respons dari AI...",
  "Menghitung visibility score...",
  "Menyusun laporan audit...",
  "Hampir selesai...",
];

const MESSAGE_INTERVAL = 2500;

export default function RunningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auditId = searchParams.get("audit_id");
  const [status, setStatus] = useState<"running" | "complete" | "failed">("running");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Thinking message rotation
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, MESSAGE_INTERVAL);

    return () => clearInterval(interval);
  }, [status]);

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
          if (pollRef.current) clearInterval(pollRef.current);

          sessionStorage.setItem("nuave_audit_result", JSON.stringify(data));

          setTimeout(() => router.push(`/new-project/report?audit_id=${auditId}`), 1500);
        } else if (data.status === "failed") {
          setStatus("failed");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Retry on next interval
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [auditId, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline mb-12">
        <img src={LOGO_SVG} alt="Nuave" width={28} height={28} className="object-contain" />
        <span className="type-title text-text-heading">
          Nuave
        </span>
      </Link>

      {status === "failed" ? (
        <>
          <h2 className="type-heading-sm text-error mb-2">
            Audit gagal
          </h2>
          <p className="type-body text-text-muted mb-6">
            Terjadi kesalahan saat menjalankan audit. Silakan coba lagi.
          </p>
          <Button variant="brand" size="lg" onClick={() => router.push("/new-project")}>
            Coba lagi
          </Button>
        </>
      ) : (
        <>
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-border-default border-t-brand rounded-full mb-6" style={{ animation: "spin 0.8s linear infinite" }} />

          <h2 className="type-heading-sm text-text-heading mb-2">
            {status === "complete" ? "Audit selesai!" : "Menjalankan audit\u2026"}
          </h2>

          {/* Thinking message with fade */}
          <p
            className="type-body text-text-muted mb-8 h-[20px] text-center"
            style={{
              opacity: status === "complete" ? 1 : visible ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
            {status === "complete"
              ? "Mengalihkan ke hasil laporan\u2026"
              : THINKING_MESSAGES[msgIndex]}
          </p>

          {/* Indeterminate shimmer progress bar */}
          {status !== "complete" && (
            <div className="w-[280px] h-[3px] rounded-full bg-border-default overflow-hidden relative">
              <div
                className="absolute top-0 left-0 w-1/2 h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, var(--purple), transparent)",
                  animation: "shimmer 1.8s ease-in-out infinite",
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
