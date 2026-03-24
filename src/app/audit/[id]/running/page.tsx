"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconAlertTriangle } from '@tabler/icons-react';
import AuditRunningLoader from "@/components/AuditRunningLoader";

export default function AuditRunningPage() {
  const router = useRouter();
  const params = useParams();
  const [error, setError] = useState<string | null>(null);
  const [completedPrompts, setCompletedPrompts] = useState(0);
  const [totalPrompts, setTotalPrompts] = useState(10);
  const [auditStatus, setAuditStatus] = useState<"running" | "complete" | "failed">("running");
  const redirectTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let auditId = params.id as string;

    const pollStatus = async (id: string) => {
      try {
        const res = await fetch(`/api/audit/${id}/status`);
        const data = await res.json();

        if (data.status === 'running') {
          // Update real progress from API
          setCompletedPrompts(data.completed_prompts ?? 0);
          setTotalPrompts(data.total_prompts ?? 10);
          return false; // Continue polling
        }

        if (data.status === 'complete') {
          // Update progress to full
          setCompletedPrompts(data.total_prompts ?? 10);
          setTotalPrompts(data.total_prompts ?? 10);
          setAuditStatus("complete");

          // Save full results to sessionStorage for results page
          sessionStorage.setItem('nuave_audit', JSON.stringify(data));

          // Let the loader finish its animation before redirecting
          redirectTimer.current = setTimeout(() => {
            router.push(`/audit/${id}/results`);
          }, 1500);

          return true; // Stop polling
        }

        if (data.status === 'failed') {
          setAuditStatus("failed");
          setError('Audit gagal. Silakan coba lagi.');
          return true; // Stop polling
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
      return false; // Continue polling
    };

    let intervalId: NodeJS.Timeout;

    const startPolling = (id: string) => {
      intervalId = setInterval(async () => {
        const shouldStop = await pollStatus(id);
        if (shouldStop) clearInterval(intervalId);
      }, 2000);
    };

    // Resolve auditId
    if (auditId === 'temp') {
      const checkPendingId = () => {
        const pendingId = sessionStorage.getItem('nuave_pending_audit_id');
        if (pendingId) {
          startPolling(pendingId);
        } else {
          setTimeout(checkPendingId, 2000);
        }
      };
      checkPendingId();
    } else if (auditId) {
      startPolling(auditId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [router, params.id]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          textAlign: "center",
          padding: "24px",
          fontFamily: "var(--font-geist-sans), sans-serif",
        }}
      >
        <div style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "#FEF2F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px"
        }}>
          <IconAlertTriangle size={48} stroke={1.5} color="#EF4444" />
        </div>
        <h1 style={{ fontSize: "24px", margin: "0 0 8px 0" }}>
          Terjadi kesalahan
        </h1>
        <p style={{ fontSize: "16px", color: "#6B7280", margin: "0 0 24px 0" }}>
          {error}
        </p>
        <a
          href="/"
          style={{
            background: "#533AFD",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            textDecoration: "none"
          }}
        >
          Coba lagi
        </a>
      </div>
    );
  }

  return (
    <AuditRunningLoader
      completedPrompts={completedPrompts}
      totalPrompts={totalPrompts}
      status={auditStatus}
    />
  );
}
