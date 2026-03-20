"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";

export default function RunningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-text-muted">Memuat...</p>
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline mb-12">
        <img src={LOGO_SVG} alt="Nuave" width={28} height={28} className="object-contain" />
        <span className="font-heading font-semibold text-[20px] leading-[28px] text-text-heading">
          Nuave
        </span>
      </Link>

      {status === "failed" ? (
        <>
          <h2 className="font-heading text-[20px] leading-[28px] font-semibold text-text-heading mb-2">
            Audit gagal
          </h2>
          <p className="font-body text-[14px] leading-[20px] text-text-muted mb-6">
            Terjadi kesalahan saat menjalankan audit. Silakan coba lagi.
          </p>
          <button
            onClick={() => router.push("/new-project")}
            className="h-[44px] px-6 rounded-md border-none bg-brand text-white font-body text-[14px] leading-[20px] font-medium cursor-pointer"
          >
            Coba lagi
          </button>
        </>
      ) : (
        <>
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-border-default border-t-brand rounded-full animate-spin mb-6" />

          <h2 className="font-heading text-[20px] leading-[28px] font-semibold text-text-heading mb-2">
            {status === "complete" ? "Audit selesai!" : "Menjalankan audit..."}
          </h2>
          <p className="font-body text-[14px] leading-[20px] text-text-muted mb-8">
            {status === "complete"
              ? "Mengalihkan ke hasil laporan..."
              : `Menganalisis ${completed} dari ${total} pertanyaan`}
          </p>

          {/* Progress bar */}
          <div className="w-[280px] h-1.5 rounded-full bg-border-default overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      {/* NOTE: Embedded @keyframes spin — consider moving to global CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
