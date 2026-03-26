"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen flex items-center justify-center bg-page">
        <p className="type-body text-text-muted">Memuat hasil...</p>
      </div>
    );
  }

  if (error || !auditData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-page gap-4">
        <p className="text-error">{error || "Audit tidak ditemukan."}</p>
        <Button variant="default" className="text-brand border-brand hover:text-brand" onClick={() => window.location.reload()}>
          Coba lagi
        </Button>
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
        <mark key={i} className="bg-[#EDE9FF] text-brand font-medium rounded-[var(--radius-xs)] px-0.5 not-italic">{part}</mark>
      ) : <span key={i}>{part}</span>
    );
  }

  function renderInline(text: string) {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold">
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
          <p key={i} className="type-body font-semibold text-text-heading mt-3 mb-1">
            {renderInline(content)}
          </p>
        );
      }
      // Bullet points
      if (line.match(/^[\-\*•]\s/)) {
        const content = line.replace(/^[\-\*•]\s/, '');
        return (
          <div key={i} className="flex gap-2 mb-1">
            <span className="text-brand shrink-0">•</span>
            <span>{renderInline(content)}</span>
          </div>
        );
      }
      // Horizontal rule
      if (line.match(/^---/)) {
        return <hr key={i} className="border-none border-t border-[#E5E7EB] my-3" />;
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Normal paragraph
      return (
        <p key={i} className="type-body leading-[1.7] mb-1">
          {renderInline(line)}
        </p>
      );
    });
  }

  return (
    <div className="min-h-screen bg-page px-6 py-12">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%) }
          to { transform: translateY(0) }
        }
        .animate-modal-in { animation: fadeIn 0.2s ease-out; }
        .result-row:hover { background: #F9FAFB !important; cursor: pointer; }
        @media (max-width: 768px) {
          .modal-panel {
            width: 100vw !important; height: 85vh !important;
            bottom: 0 !important; top: auto !important;
            right: 0 !important; left: 0 !important;
            transform: none !important;
            border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
            padding: 24px !important;
            animation: slideUp 0.3s ease-out !important;
          }
        }
      `}</style>

      <div className="max-w-[800px] mx-auto">

        <h1 className="text-[length:var(--text-3xl)] text-center mb-8 mt-0">
          Visibility Score AI Kamu
        </h1>

        {/* 1. Score hero card */}
        <div className="bg-white border border-border-default rounded-[var(--radius-xl)] p-10 flex flex-col items-center gap-4 mb-6">
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
          <p className="type-body text-text-muted text-center m-0">
            {auditData.brand_mention_count} dari {auditData.total_prompts} prompt menyebutkan brand kamu
          </p>

          {/* Competitor strip */}
          <div className="border-t border-border-default pt-4 mt-2 w-full text-center">
            <p className="type-sm text-text-muted mb-2.5 mt-0">
              ChatGPT lebih banyak menyebutkan kompetitor ini:
            </p>
            <span className="inline-flex bg-surface text-text-muted rounded-[var(--radius-md)] px-3.5 py-1.5 type-caption italic">
              Lihat rekomendasi untuk detailnya
            </span>
          </div>
        </div>

        {/* 2. Prompt results card */}
        <div className="bg-white border border-border-default rounded-[var(--radius-lg)] overflow-hidden mb-6">
          {/* Card header */}
          <div className="px-5 py-4 border-b border-border-default flex justify-between items-center">
            <span className="type-body font-semibold text-text-heading">Hasil Prompt</span>
            <span className="type-sm text-text-muted">{auditData.total_prompts} diuji</span>
          </div>

          {/* Result rows */}
          {auditData.results.map((result, i) => (
            <div
              key={i}
              onClick={() => setSelectedResult(result)}
              className={cn(
                "result-row flex items-center gap-3.5 px-5 py-3.5 transition-colors",
                i < (auditData.results?.length || 0) - 1 && "border-b border-[#F3F4F6]"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-6 h-6 rounded-full shrink-0 flex items-center justify-center",
                result.brand_mentioned ? "bg-[#DCFCE7]" : "bg-[#FEE2E2]"
              )}>
                {result.brand_mentioned ? (
                  <IconCheck size={14} stroke={2.5} color="#22C55E" />
                ) : (
                  <IconX size={14} stroke={2.5} color="#EF4444" />
                )}
              </div>

              {/* Prompt text */}
              <span className="type-sm text-text-body flex-1 leading-snug line-clamp-2">
                {result.prompt_text}
              </span>

              {/* Badge */}
              <span className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 type-caption font-medium whitespace-nowrap",
                result.brand_mentioned
                  ? "bg-[#DCFCE7] text-success"
                  : "bg-[#FEE2E2] text-error"
              )}>
                {result.brand_mentioned ? "Disebut" : "Tidak disebut"}
              </span>
            </div>
          ))}
        </div>

        {/* 3. CTA bar */}
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="default">Simpan laporan</Button>
          <Button variant="brand" onClick={() => router.push(`/audit/${auditId}/recommendations`)}>
            Lihat Rekomendasi <IconArrowRight size={18} stroke={1.5} />
          </Button>
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
