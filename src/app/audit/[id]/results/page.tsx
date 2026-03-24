"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconCheck,
  IconX,
  IconArrowRight,
  IconCircleCheck,
  IconCircleX,
  IconCircleCheckFilled,
  IconCircleXFilled
} from '@tabler/icons-react';
import PromptDetailModal from '@/components/PromptDetailModal';

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
          throw new Error(errorData.error || 'Gagal mengambil data audit');
        }
        
        const data = await res.json()
        if (data.status === 'complete') {
          setAuditData(data)
          // Cache full result
          sessionStorage.setItem('nuave_audit', JSON.stringify(data))
        } else if (data.status === 'failed') {
          throw new Error('Audit gagal diselesaikan.');
        } else {
          // Still running, redirect back to running screen
          router.push(`/audit/${auditId}/running`);
        }
      } catch (err: any) {
        console.error("Failed to fetch audit data", err);
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    }

    fetchAuditData();

    // Clear new-project session so /new-project starts fresh
    sessionStorage.removeItem("nuave_new_project");
    sessionStorage.removeItem("nuave_new_project_topics");
    sessionStorage.removeItem("nuave_new_project_prompts");
    sessionStorage.removeItem("nuave_audit_result");
    sessionStorage.removeItem("nuave_pending_audit_id");
    // Clear any cached topic/prompt data (keys like nuave_topics_<id>, nuave_prompts_<id>)
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("nuave_topics_") || key.startsWith("nuave_prompts_")) {
        sessionStorage.removeItem(key);
      }
    }
  }, [router, auditId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)" }}>
        <p style={{ color: "var(--text-muted)" }}>Memuat hasil...</p>
      </div>
    );
  }

  if (error || !auditData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", gap: "16px" }}>
        <p style={{ color: "#EF4444" }}>{error || "Audit tidak ditemukan."}</p>
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
          Coba lagi
        </button>
      </div>
    );
  }

  const score = auditData.visibility_score || 0;
  const circumference = 2 * Math.PI * 68; // ≈ 427.26
  const arc = (score / 100) * circumference;

  let scoreColor = "#EF4444"; // Default Red
  let scoreLabel = "Visibilitas Rendah";

  if (score >= 70) {
    scoreColor = "#22C55E";
    scoreLabel = "Visibilitas Kuat";
  } else if (score >= 40) {
    scoreColor = "#F59E0B";
    scoreLabel = "Visibilitas Sedang";
  }

  // Get brand name from profile if not in auditData
  const profileStr = typeof window !== 'undefined' ? sessionStorage.getItem("nuave_profile") : null;
  const profile = profileStr ? JSON.parse(profileStr) : null;
  const brandName = auditData.brand_name || profile?.profile?.brand_name || "brand";

  function highlightBrand(text: string, brand: string) {
    if (!brand || !text) return [<span key={0}>{text}</span>];
    const regex = new RegExp(`(${brand})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{
          background: '#EDE9FF',
          color: '#533AFD',
          fontWeight: 500,
          borderRadius: 'var(--radius-xs)',
          padding: '0 2px',
          fontStyle: 'normal'
        }}>{part}</mark>
      ) : <span key={i}>{part}</span>
    );
  }

  function renderInline(text: string) {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ fontWeight: 600 }}>
            {highlightBrand(part.slice(2, -2), brandName)}
          </strong>
        );
      }
      return <span key={i}>{highlightBrand(part, brandName)}</span>;
    });
  }

  function renderMarkdown(text: string) {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // H3 headings (### or ##)
      if (line.match(/^#{1,3}\s/)) {
        const content = line.replace(/^#{1,3}\s/, '');
        return (
          <p key={i} style={{
            fontWeight: 600,
            fontSize: '14px',
            color: '#111827',
            marginTop: '12px',
            marginBottom: '4px'
          }}>
            {renderInline(content)}
          </p>
        );
      }
      // Bullet points
      if (line.match(/^[\-\*•]\s/)) {
        const content = line.replace(/^[\-\*•]\s/, '');
        return (
          <div key={i} style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '4px',
          }}>
            <span style={{ color: '#533AFD', flexShrink: 0 }}>•</span>
            <span>{renderInline(content)}</span>
          </div>
        );
      }
      // Horizontal rule
      if (line.match(/^---/)) {
        return (
          <hr key={i} style={{
            border: 'none',
            borderTop: '1px solid #E5E7EB',
            margin: '12px 0'
          }} />
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={i} style={{ height: '8px' }} />;
      }
      // Normal paragraph
      return (
        <p key={i} style={{
          lineHeight: '1.7',
          marginBottom: '4px'
        }}>
          {renderInline(line)}
        </p>
      );
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        padding: "48px 24px",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%) }
          to { transform: translateY(0) }
        }
        .animate-modal-in {
          animation: fadeIn 0.2s ease-out;
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
            transform: none !important;
            border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
            padding: 24px !important;
            animation: slideUp 0.3s ease-out !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        <h1
          style={{
            fontSize: "var(--text-3xl)",
            textAlign: "center",
            marginBottom: "32px",
            marginTop: 0,
          }}
        >
          Visibility Score AI Kamu
        </h1>

        {/* 1. Score hero card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-xl)",
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
            {auditData.brand_mention_count} dari {auditData.total_prompts} prompt menyebutkan brand kamu
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
              ChatGPT lebih banyak menyebutkan kompetitor ini:
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
                Lihat rekomendasi untuk detailnya
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
              Hasil Prompt
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              {auditData.total_prompts} diuji
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
                {result.brand_mentioned ? "Disebut" : "Tidak disebut"}
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
            Simpan laporan
          </button>
          <button
            onClick={() => router.push(`/audit/${auditId}/recommendations`)}
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
            Lihat Rekomendasi <IconArrowRight size={18} stroke={1.5} />
          </button>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedResult && (
        <PromptDetailModal
          result={selectedResult}
          brandName={brandName}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}
