"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconAlertTriangle } from '@tabler/icons-react';
import AuditRunningLoader from "@/components/AuditRunningLoader";

export default function AuditRunningPage() {
  const router = useRouter();
  const params = useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let auditId = params.id as string;
    
    // Polling function to get audit_id if missing or poll status
    const pollStatus = async (id: string) => {
      try {
        const res = await fetch(`/api/audit/${id}/status`);
        const data = await res.json();
        
        if (data.status === 'complete') {
          // Save full results to sessionStorage for results page
          sessionStorage.setItem('nuave_audit', JSON.stringify(data));
          router.push(`/audit/${id}/results`);
          return true; // Stop polling
        }
        
        if (data.status === 'failed') {
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
      }, 3000);
    };

    // 1. Resolve auditId
    if (auditId === 'temp') {
      const checkPendingId = () => {
        const pendingId = sessionStorage.getItem('nuave_pending_audit_id');
        if (pendingId) {
          startPolling(pendingId);
        } else {
          // Retry in 2 seconds if not found yet
          setTimeout(checkPendingId, 2000);
        }
      };
      checkPendingId();
    } else if (auditId) {
      startPolling(auditId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
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
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
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
            borderRadius: "8px", 
            fontWeight: 600, 
            textDecoration: "none" 
          }}
        >
          Coba lagi
        </a>
      </div>
    );
  }

  return <AuditRunningLoader />;
}
