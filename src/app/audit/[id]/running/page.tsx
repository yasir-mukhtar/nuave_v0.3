"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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

  // 1. Initial check and redirect
  useEffect(() => {
    const checkAudit = () => {
      const stored = sessionStorage.getItem("nuave_audit");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.audit_id) {
            router.push(`/audit/${data.audit_id}/results`);
            return true;
          }
        } catch (err) {
          console.error("Failed to parse audit data", err);
        }
      }
      return false;
    };

    if (checkAudit()) return;

    // 2. Polling for results every 2 seconds
    const pollInterval = setInterval(() => {
      if (checkAudit()) {
        clearInterval(pollInterval);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [router]);

  // 3. Cycling status messages every 3 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  // 4. Progress dots every 3 seconds (matching 30s total estimate for 10 dots)
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
              fontSize: "64px",
            }}
          >
            🧠
          </div>

          {/* MIDDLE SECTION - Status text */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Asking ChatGPT your questions...
              </h1>
              <p style={{ fontSize: "16px", color: "#6B7280", margin: 0 }}>
                This takes about 30 seconds
              </p>
            </div>
            
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
          </div>

          {/* BOTTOM SECTION - Progress dots */}
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
        </div>
      </div>
    </>
  );
}
