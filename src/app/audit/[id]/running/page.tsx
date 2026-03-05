"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconBrain, IconAlertTriangle } from '@tabler/icons-react';

const statusMessages = [
  "Testing awareness queries...",
  "Testing consideration queries...",
  "Testing decision queries...",
  "Analyzing brand mentions...",
  "Calculating your visibility score...",
];

export default function AuditRunningPage() {
  const router = useRouter();
  const params = useParams();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progressIndex, setProgressIndex] = useState(0);
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
          setError('Audit failed. Please try again.');
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

  // Cycling status messages every 3 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  // Progress dots every 3 seconds (matching 30s total estimate for 10 dots)
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setProgressIndex((prev) => (prev < 10 ? prev + 1 : prev));
    }, 3000);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .pulsing-circle {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .pulsing-circle {
            width: 150px !important;
            height: 150px !important;
          }
          .status-container {
            padding: 0 24px !important;
          }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#ffffff",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-geist-sans), sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            gap: "40px",
          }}
        >
          {/* TOP SECTION - Animated pulsing circle */}
          <div
            className="pulsing-circle"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              border: "3px solid #6C3FF5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {error ? (
              <IconAlertTriangle size={64} stroke={1.5} color="#EF4444" />
            ) : (
              <IconBrain size={64} stroke={1.5} color="#6C3FF5" />
            )}
          </div>

          {/* MIDDLE SECTION - Status text */}
          <div className="status-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                {error ? "Something went wrong" : "Asking ChatGPT your questions..."}
              </h1>
              <p style={{ fontSize: "16px", color: "#6B7280", margin: 0 }}>
                {error ? "We couldn't complete your audit." : "This takes about 30 seconds"}
              </p>
            </div>
            
            {!error && (
              <p
                key={messageIndex}
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#6C3FF5",
                  margin: 0,
                  height: "20px",
                }}
              >
                {statusMessages[messageIndex]}
              </p>
            )}

            {error && (
              <p style={{ color: '#EF4444', marginTop: '16px', fontSize: '14px' }}>
                {error} <a href="/" style={{ color: '#6C3FF5', fontWeight: 600, textDecoration: 'none' }}>Try again</a>
              </p>
            )}
          </div>

          {/* BOTTOM SECTION - Progress dots */}
          {!error && (
            <div style={{ display: "flex", gap: "8px" }}>
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: i < progressIndex ? "#6C3FF5" : "#E5E7EB",
                    transition: "background 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
