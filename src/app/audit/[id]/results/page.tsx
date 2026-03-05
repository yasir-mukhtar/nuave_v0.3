"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconCheck, IconX, IconArrowRight } from '@tabler/icons-react';

interface AuditResult {
  prompt_text: string;
  ai_response: string;
  brand_mentioned: boolean;
  mention_context: string | null;
  created_at?: string;
}

interface AuditData {
  status?: string;
  success: boolean;
  audit_id: string;
  visibility_score: number;
  brand_mention_count: number;
  total_prompts: number;
  results: AuditResult[];
  brand_name?: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const auditId = params.id as string;
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<AuditResult | null>(null);

  useEffect(() => {
    if (!auditId) {
      router.push("/");
      return;
    }

    async function fetchAuditData() {
      try {
        setLoading(true);
        setError(null);
        
        // Try sessionStorage first
        const cached = sessionStorage.getItem('nuave_audit')
        if (cached) {
          const data = JSON.parse(cached)
          // Only use it if it's the correct ID and status is complete
          if (data.audit_id === auditId && data.status === 'complete') {
            setAuditData(data)
            setLoading(false)
            return
          }
        }
        
        // Fall back to API
        const res = await fetch(`/api/audit/${auditId}/status`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch audit data');
        }
        
        const data = await res.json()
        if (data.status === 'complete') {
          setAuditData(data)
          // Cache full result
          sessionStorage.setItem('nuave_audit', JSON.stringify(data))
        } else if (data.status === 'failed') {
          throw new Error('Audit failed to complete.');
        } else {
          // Still running, redirect back to running screen
          router.push(`/audit/${auditId}/running`);
        }
      } catch (err: any) {
        console.error("Failed to fetch audit data", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchAuditData();
  }, [router, auditId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading results...</p>
      </div>
    );
  }

  if (error || !auditData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", gap: "16px" }}>
        <p style={{ color: "#EF4444" }}>{error || "Audit not found."}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--purple)",
            background: "transparent",
            border: "1px solid var(--purple)",
            borderRadius: "var(--radius-md)",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const score = auditData.visibility_score || 0;
  const circumference = 2 * Math.PI * 68; // ≈ 427.26
  const arc = (score / 100) * circumference;

  let scoreColor = "#EF4444"; // Default Red
  let scoreLabel = "Low Visibility";

  if (score >= 70) {
    scoreColor = "#22C55E";
    scoreLabel = "Strong Visibility";
  } else if (score >= 40) {
    scoreColor = "#F59E0B";
    scoreLabel = "Partially Visible";
  }

  // Get brand name from profile if not in auditData
  const profileStr = typeof window !== 'undefined' ? sessionStorage.getItem("nuave_profile") : null;
  const profile = profileStr ? JSON.parse(profileStr) : null;
  const brandName = auditData.brand_name || profile?.profile?.brand_name || "the brand";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        padding: "48px 24px",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%) }
          to { transform: translateX(0) }
        }
        @keyframes slideUp {
          from { transform: translateY(100%) }
          to { transform: translateY(0) }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
        .result-row:hover {
          background: #F9FAFB !important;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .modal-panel {
            width: 100vw !important;
            height: 85vh !important;
            bottom: 0 !important;
            top: auto !important;
            right: 0 !important;
            left: 0 !important;
            border-radius: 16px 16px 0 0 !important;
            animation: slideUp 0.3s ease-out !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        <h1
          style={{
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
            color: "var(--text-heading)",
            textAlign: "center",
            marginBottom: "32px",
            marginTop: 0,
          }}
        >
          Your AI Visibility Score
        </h1>

        {/* 1. Score hero card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border-default)",
            borderRadius: "16px",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Score circle */}
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="68" fill="none" stroke="#E5E7EB" strokeWidth="10" />
            <circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circumference - arc}`}
              transform="rotate(-90 80 80)"
              style={{ transition: "stroke-dasharray 1s ease-out" }}
            />
            <text x="80" y="75" textAnchor="middle" fontSize="42" fontWeight="700" fill="#111827" fontFamily="inherit">
              {score}
            </text>
            <text x="80" y="98" textAnchor="middle" fontSize="13" fill={scoreColor} fontWeight="600" fontFamily="inherit">
              {scoreLabel}
            </text>
          </svg>

          {/* Caption */}
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
            {auditData.brand_mention_count} of {auditData.total_prompts} prompts mentioned your brand
          </p>

          {/* Competitor strip */}
          <div
            style={{
              borderTop: "1px solid var(--border-default)",
              paddingTop: "16px",
              marginTop: "8px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "10px", marginTop: 0 }}>
              ChatGPT mentioned these competitors instead:
            </p>
            <div>
              <span
                style={{
                  display: "inline-flex",
                  background: "#F9FAFB",
                  color: "var(--text-muted)",
                  borderRadius: "var(--radius-md)",
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontStyle: "italic",
                }}
              >
                See recommendations for details
              </span>
            </div>
          </div>
        </div>

        {/* 2. Prompt results card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-default)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-heading)" }}>
              Prompt Results
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              {auditData.total_prompts} tested
            </span>
          </div>

          {/* Result rows */}
          {auditData.results.map((result, i) => (
            <div
              key={i}
              onClick={() => setSelectedResult(result)}
              className="result-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 20px",
                borderBottom: i < (auditData.results?.length || 0) - 1 ? "1px solid #F3F4F6" : "none",
                transition: "background 0.2s",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: result.brand_mentioned ? "#DCFCE7" : "#FEE2E2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {result.brand_mentioned ? (
                  <IconCheck size={14} stroke={2.5} color="#22C55E" />
                ) : (
                  <IconX size={14} stroke={2.5} color="#EF4444" />
                )}
              </div>

              {/* Prompt text */}
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-body)",
                  flex: 1,
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {result.prompt_text}
              </span>

              {/* Badge */}
              <span
                style={{
                  flexShrink: 0,
                  borderRadius: "var(--radius-full)",
                  padding: "3px 10px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: result.brand_mentioned ? "#DCFCE7" : "#FEE2E2",
                  color: result.brand_mentioned ? "#16A34A" : "#EF4444",
                  whiteSpace: "nowrap",
                }}
              >
                {result.brand_mentioned ? "Mentioned" : "Not mentioned"}
              </span>
            </div>
          ))}
        </div>

        {/* 3. CTA bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
          <button
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--text-body)",
              background: "#ffffff",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Save report
          </button>
          <button
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "#ffffff",
              background: "var(--purple)",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "10px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            See recommendations <IconArrowRight size={18} stroke={1.5} />
          </button>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedResult && (
        <>
          {/* OVERLAY */}
          <div
            onClick={() => setSelectedResult(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 50,
            }}
          />

          {/* PANEL */}
          <div
            className="animate-slide-in modal-panel"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: "480px",
              background: "#FFFFFF",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "32px 32px 20px",
                borderBottom: "1px solid #F3F4F6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>
                Prompt Result
              </h2>
              <button
                onClick={() => setSelectedResult(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconX size={24} stroke={1.5} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* PROMPT SECTION */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ letterSpacing: "0.05em" }}>
                    PROMPT
                  </label>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      fontStyle: "italic",
                      background: "#F9FAFB",
                      padding: "12px",
                      borderRadius: "8px",
                      borderLeft: "3px solid #6C3FF5",
                      lineHeight: 1.5,
                    }}
                  >
                    "{selectedResult.prompt_text}"
                  </div>
                </div>

                {/* RESULT BADGE */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "16px 0",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 20px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: 600,
                      background: selectedResult.brand_mentioned ? "#DCFCE7" : "#FEE2E2",
                      color: selectedResult.brand_mentioned ? "#16A34A" : "#DC2626",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{selectedResult.brand_mentioned ? <IconCheck size={18} stroke={2.5} /> : <IconX size={18} stroke={2.5} />}</span>
                    <span>{brandName} was {selectedResult.brand_mentioned ? "mentioned" : "not mentioned"}</span>
                  </div>
                </div>

                {/* AI RESPONSE SECTION */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ letterSpacing: "0.05em" }}>
                    AI RESPONSE
                  </label>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      lineHeight: 1.6,
                      background: "#F9FAFB",
                      padding: "16px",
                      borderRadius: "8px",
                      maxHeight: "400px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedResult.ai_response}
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div
              style={{
                padding: "24px 32px",
                borderTop: "1px solid #F3F4F6",
                fontSize: "12px",
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              Response generated by GPT-4o with web search · {selectedResult.created_at ? new Date(selectedResult.created_at).toLocaleString() : new Date().toLocaleString()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
