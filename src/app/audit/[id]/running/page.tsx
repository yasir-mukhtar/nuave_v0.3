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

          // Fire-and-forget: start generating recommendations early
          fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audit_id: id }),
          }).catch(() => {});

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6">
        <div className="w-[120px] h-[120px] rounded-full bg-[#FEF2F2] flex items-center justify-center mb-6">
          <IconAlertTriangle size={48} stroke={1.5} color="#EF4444" />
        </div>
        <h1 className="text-[24px] m-0 mb-2">Terjadi kesalahan</h1>
        <p className="type-body text-text-muted m-0 mb-6">{error}</p>
        <a href="/" className="bg-brand text-white px-6 py-3 rounded-[var(--radius-md)] font-semibold no-underline">
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
