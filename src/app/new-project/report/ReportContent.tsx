"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconDownload, IconArrowRight } from "@tabler/icons-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tip } from "@/components/ui/tip";
import { ButtonSpinner } from "@/components/ButtonSpinner";
import PromptDetailModal, { type PromptDetail } from "@/components/PromptDetailModal";
import { Button } from "@/components/ui/button";

const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";

/* ── Types ── */

interface ReportData {
  brandName: string;
  brandUrl: string;
  faviconUrl: string | null;
  date: string;
  score: number;
  level: string;
  mentionedCount: number;
  totalPrompts: number;
  competitors: string[];
  results: PromptResult[];
}

interface PromptResult {
  prompt: string;
  mentioned: boolean;
  demand_tier?: string;
  ai_response?: string;
}

interface Problem {
  severity: string;
  title: string;
}

/* ── Constants ── */

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  high:   { label: "Tinggi", className: "text-brand" },
  medium: { label: "Sedang", className: "text-warning" },
  low:    { label: "Rendah", className: "text-text-muted" },
};

const SEVERITY_CONFIG: Record<string, { label: string }> = {
  high:   { label: "Kritis" },
  medium: { label: "Penting" },
  low:    { label: "Normal" },
};

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const SCROLL_THRESHOLD = 100;

/* ── Helpers ── */

function truncateUrlMiddle(url: string, maxLen = 60, tailLen = 10): string {
  if (url.length <= maxLen) return url;
  const head = url.slice(0, maxLen - tailLen - 3);
  const tail = url.slice(-tailLen);
  return `${head}...${tail}`;
}

function getVisibilityLevel(score: number): string {
  if (score >= 80) return "Visibilitas Tinggi";
  if (score >= 50) return "Visibilitas Sedang";
  if (score >= 20) return "Visibilitas Rendah";
  return "Tidak Terlihat";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

function buildReport(): ReportData {
  const auditRaw = sessionStorage.getItem("nuave_audit_result");
  const projectRaw = sessionStorage.getItem("nuave_new_project");

  const project = projectRaw ? JSON.parse(projectRaw) : {};
  const audit = auditRaw ? JSON.parse(auditRaw) : {};

  const score = audit.visibility_score ?? 0;
  const savedPromptsRaw = sessionStorage.getItem("nuave_new_project_prompts");
  const savedPrompts: { prompt: string; demand_tier?: string }[] = savedPromptsRaw ? JSON.parse(savedPromptsRaw) : [];

  const results: PromptResult[] = (audit.results || []).map((r: { prompt_text: string; brand_mentioned: boolean; ai_response?: string }) => {
    const match = savedPrompts.find((sp) => sp.prompt === r.prompt_text);
    return {
      prompt: r.prompt_text,
      mentioned: r.brand_mentioned,
      demand_tier: match?.demand_tier || undefined,
      ai_response: r.ai_response || "",
    };
  });
  const mentionedCount = results.filter((r) => r.mentioned).length;

  const competitorSet = new Set<string>();
  (audit.results || []).forEach((r: { competitor_mentions?: string[] }) => {
    (r.competitor_mentions || []).forEach((c: string) => competitorSet.add(c));
  });

  return {
    brandName: project.brandName || "Brand",
    brandUrl: project.url || "",
    faviconUrl: project.faviconUrl || null,
    date: new Date().toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "shortOffset",
    }),
    score,
    level: getVisibilityLevel(score),
    mentionedCount,
    totalPrompts: audit.total_prompts || results.length,
    competitors: Array.from(competitorSet).slice(0, 6),
    results,
  };
}

/* ── Sub-components ── */

function ScoreRing({ score }: { score: number }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative w-[120px] h-[120px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border-default)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-600 ease-in-out"
          />
        </g>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center type-heading-md text-text-heading">
        {score}
      </span>
    </div>
  );
}

function TierIcon({ tier }: { tier: string }) {
  if (tier === "high") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect x="4" y="7" width="16" height="2" rx="1" fill="#533AFD" />
        <rect x="6" y="11" width="12" height="2" rx="1" fill="#533AFD" />
        <rect x="9" y="15" width="6" height="2" rx="1" fill="#533AFD" />
      </svg>
    );
  }
  if (tier === "medium") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect x="4" y="7" width="16" height="2" rx="1" fill="#CCCCCC" />
        <rect x="6" y="11" width="12" height="2" rx="1" fill="#E17100" />
        <rect x="9" y="15" width="6" height="2" rx="1" fill="#E17100" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="4" y="7" width="16" height="2" rx="1" fill="#CCCCCC" />
      <rect x="6" y="11" width="12" height="2" rx="1" fill="#CCCCCC" />
      <rect x="9" y="15" width="6" height="2" rx="1" fill="#4A5565" />
    </svg>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "high") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect x="16" y="4" width="4" height="16" rx="2" fill="#FB2C36" />
        <rect x="10" y="8" width="4" height="12" rx="2" fill="#FB2C36" />
        <rect x="4" y="12" width="4" height="8" rx="2" fill="#FB2C36" />
      </svg>
    );
  }
  if (severity === "medium") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect x="16" y="4" width="4" height="16" rx="2" fill="#CCCCCC" />
        <rect x="10" y="8" width="4" height="12" rx="2" fill="#FF6900" />
        <rect x="4" y="12" width="4" height="8" rx="2" fill="#FF6900" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="16" y="4" width="4" height="16" rx="2" fill="#CCCCCC" />
      <rect x="10" y="8" width="4" height="12" rx="2" fill="#CCCCCC" />
      <rect x="4" y="12" width="4" height="8" rx="2" fill="#F0B100" />
    </svg>
  );
}

function MentionedIcon({ mentioned }: { mentioned: boolean }) {
  if (mentioned) {
    return (
      <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-error flex items-center justify-center shrink-0">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function CTAButtons({
  onDownload,
  downloading,
  onViewRecs,
}: {
  onDownload: () => void;
  downloading: boolean;
  onViewRecs: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="default" onClick={onDownload} disabled={downloading}>
        {downloading ? <ButtonSpinner size={14} color="var(--purple)" /> : <IconDownload size={16} stroke={1.5} />}
        {downloading ? "Mengunduh..." : "Unduh laporan"}
      </Button>
      <Button variant="brand" onClick={onViewRecs}>
        Lihat rekomendasi
        <IconArrowRight size={16} stroke={1.5} />
      </Button>
    </div>
  );
}

function BrandLogo({ name, faviconUrl }: { name: string; faviconUrl: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!faviconUrl || failed) {
    return (
      <div className="w-10 h-10 rounded-sm bg-surface-raised flex items-center justify-center type-body-lg font-semibold text-brand shrink-0">
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt={name}
      width={40}
      height={40}
      className="rounded-sm object-contain bg-surface-raised shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

/* ── Main Component ── */

export default function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ReportData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptDetail | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [bottomBarTranslate, setBottomBarTranslate] = useState(100);
  const reportRef = useRef<HTMLDivElement>(null);

  /* ── Scroll-driven bottom bar ── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y >= SCROLL_THRESHOLD) {
        setBottomBarTranslate(0);
      } else {
        setBottomBarTranslate(((SCROLL_THRESHOLD - y) / SCROLL_THRESHOLD) * 100);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigateToRecs = useCallback(() => {
    const projectRaw = sessionStorage.getItem("nuave_new_project");
    if (projectRaw) {
      const project = JSON.parse(projectRaw);
      if (project.projectId) localStorage.setItem("nuave_active_project", project.projectId);
      if (project.workspaceId) localStorage.setItem("nuave_active_workspace", project.workspaceId);
    }
    router.push("/content");
  }, [router]);

  const handleDownload = useCallback(async () => {
    if (!reportRef.current || !report || downloading) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const el = reportRef.current;
      const origStyle = { border: el.style.border, borderRadius: el.style.borderRadius };
      el.style.border = "none";
      el.style.borderRadius = "0";

      const paddedEls = el.querySelectorAll<HTMLElement>("[data-pdf-pad]");
      const origPads: string[] = [];
      paddedEls.forEach((child, i) => {
        origPads[i] = child.style.padding || "";
        let newPad = child.style.padding.replace(/32px/g, "0");
        if (i === 0) newPad = newPad.replace(/^32px/, "16px");
        child.style.padding = newPad;
      });

      const dividers = el.querySelectorAll<HTMLElement>("[data-pdf-divider]");
      const origMargins: string[] = [];
      dividers.forEach((d, i) => {
        origMargins[i] = d.style.margin;
        d.style.margin = "0";
      });

      const footerEl = el.querySelector<HTMLElement>("[data-pdf-footer]");
      const origFooterBorder = footerEl?.style.borderTop || "";
      if (footerEl) footerEl.style.borderTop = "none";

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });

      // Restore styles
      el.style.border = origStyle.border;
      el.style.borderRadius = origStyle.borderRadius;
      paddedEls.forEach((child, i) => { child.style.padding = origPads[i]; });
      dividers.forEach((d, i) => { d.style.margin = origMargins[i]; });
      if (footerEl) footerEl.style.borderTop = origFooterBorder;

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 5;
      const contentWidth = imgWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      if (imgHeight + margin * 2 <= pageHeight) {
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
      } else {
        const footerSpace = 16;
        const pageContentHeight = pageHeight - margin * 2 - footerSpace;
        const totalPages = Math.ceil(imgHeight / pageContentHeight);
        const srcPageHeightPx = (pageContentHeight / imgHeight) * canvas.height;

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();
          const srcY = page * srcPageHeightPx;
          const srcH = Math.min(srcPageHeightPx, canvas.height - srcY);
          const destH = (srcH / canvas.width) * contentWidth;

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = srcH;
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
          }
          pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", margin, margin, contentWidth, destH);
        }

        for (let p = 0; p < totalPages; p++) {
          pdf.setPage(p + 1);
          pdf.setDrawColor(229, 231, 235);
          pdf.setLineWidth(0.3);
          pdf.line(margin, pageHeight - 14, imgWidth - margin, pageHeight - 14);
          pdf.setFontSize(9);
          pdf.setTextColor(156, 163, 175);
          const pageText = `Halaman ${p + 1} dari ${totalPages}`;
          const textWidth = pdf.getTextWidth(pageText);
          pdf.text(pageText, (imgWidth - textWidth) / 2, pageHeight - 8);
        }
      }

      const fileName = `Laporan-Visibilitas-AI-${report.brandName.replace(/\s+/g, "-")}.pdf`;
      pdf.save(fileName);
    } catch {
      // PDF generation failed silently
    }
    setDownloading(false);
  }, [report, downloading]);

  /* ── Load report data ── */
  useEffect(() => {
    const auditId = searchParams.get("audit_id");
    const auditRaw = sessionStorage.getItem("nuave_audit_result");

    if (!auditRaw && !auditId) {
      router.replace("/new-project");
      return;
    }

    const activateWorkspace = () => {
      const projectRaw = sessionStorage.getItem("nuave_new_project");
      if (projectRaw) {
        const project = JSON.parse(projectRaw);
        if (project.workspaceId) localStorage.setItem("nuave_active_workspace", project.workspaceId);
      }
    };

    if (auditRaw) {
      setReport(buildReport());
      activateWorkspace();
      return;
    }

    if (auditId) {
      (async () => {
        const res = await fetch(`/api/audit/${auditId}/status`);
        const data = await res.json();
        if (data.status === "complete") {
          sessionStorage.setItem("nuave_audit_result", JSON.stringify(data));
          setReport(buildReport());
          activateWorkspace();
        }
      })();
    }
  }, [searchParams, router]);

  /* ── Fetch problems ── */
  useEffect(() => {
    const auditId = searchParams.get("audit_id");
    if (!auditId) return;
    let cancelled = false;
    let pollInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchProblems = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createSupabaseBrowserClient();
        const { data } = await supabase
          .from("audit_problems")
          .select("severity, title")
          .eq("audit_id", auditId)
          .order("created_at", { ascending: true });

        if (cancelled) return;

        if (data && data.length > 0) {
          const sorted = [...data].sort(
            (a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2)
          );
          setProblems(sorted);
          setProblemsLoading(false);
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch {
        // Will retry on next poll
      }
    };

    fetchProblems();
    pollInterval = setInterval(fetchProblems, 4000);
    timeoutId = setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
      if (!cancelled) setProblemsLoading(false);
    }, 60000);

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams]);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="type-body text-text-muted">Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-raised">
      {/* ── Page header ── */}
      <div className="max-w-[800px] mx-auto pt-10">
        <div className="flex items-center justify-between mb-6">
          <span className="type-report-title text-text-heading">
            Laporan Visibilitas AI
          </span>
          <CTAButtons
            onDownload={handleDownload}
            downloading={downloading}
            onViewRecs={navigateToRecs}
          />
        </div>
      </div>

      {/* ── Report card ── */}
      <main className="max-w-[800px] mx-auto pb-24">
        <TooltipProvider delayDuration={300}>
        <div ref={reportRef} className="bg-white rounded-sm border border-border-default overflow-hidden">

          {/* Section A — Brand header */}
          <div data-pdf-pad className="flex items-center gap-3 px-8 py-8">
            <BrandLogo name={report.brandName} faviconUrl={report.faviconUrl} />
            <div className="min-w-0">
              <p className="type-body font-semibold text-text-heading m-0">
                {report.brandName}
              </p>
              <a
                href={report.brandUrl.startsWith("http") ? report.brandUrl : `https://${report.brandUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="type-caption text-text-muted m-0 block no-underline cursor-pointer hover:underline"
              >
                {truncateUrlMiddle(report.brandUrl)}
              </a>
            </div>
          </div>

          <div data-pdf-divider className="h-px bg-border-default" />

          {/* Section B — AI Visibility Score */}
          <div data-pdf-pad className="flex flex-col items-center py-10 px-8">
            <p className="type-caption text-text-muted m-0 mb-4">
              Skor Visibilitas AI
            </p>
            <ScoreRing score={report.score} />
            <p className="type-heading-sm text-text-heading mt-4 mb-1 m-0">
              {report.level}
            </p>
            <p className="type-body text-text-muted m-0">
              Brand Anda disebutkan AI dalam {report.mentionedCount} dari {report.totalPrompts} pertanyaan
            </p>
          </div>

          <div data-pdf-divider className="h-px bg-border-default" />

          {/* Section C — Prompt Test Results */}
          <div data-pdf-pad className="pt-6 px-8 pb-8">
            <p className="type-body font-semibold text-text-heading mb-1">
              Hasil Pengujian
            </p>
            <p className="type-body text-text-muted mb-4">
              Kami mengirimkan pertanyaan ini ke AI untuk melihat apakah brand Anda disebutkan
            </p>

            {/* Column headers */}
            <div className="flex items-center py-3 border-b border-border-default">
              <span className="type-col-header flex-1">Pertanyaan</span>
              <span className="w-[100px] flex justify-start">
                <Tip label="Estimasi volume pencarian berdasarkan data Google Search">
                  <span className="type-col-header type-col-header--hint cursor-default">Volume</span>
                </Tip>
              </span>
              <span className="w-[80px] flex justify-center">
                <Tip label="Apakah brand Anda disebutkan dalam jawaban AI">
                  <span className="type-col-header type-col-header--hint cursor-default">Disebutkan</span>
                </Tip>
              </span>
            </div>

            {/* Result rows */}
            <div className="flex flex-col">
              {report.results.map((r, i) => {
                const tier = TIER_CONFIG[r.demand_tier || ""];
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedPrompt({
                      prompt_text: r.prompt,
                      ai_response: r.ai_response || "",
                      brand_mentioned: r.mentioned,
                    })}
                    className={`flex items-center py-3 cursor-pointer transition-colors hover:bg-surface ${i < report.results.length - 1 ? "border-b border-border-default" : ""}`}
                  >
                    <span className="type-body text-text-heading flex-1 pr-4">
                      {r.prompt}
                    </span>
                    <span className="w-[100px] flex items-center justify-start gap-1.5">
                      {tier && (
                        <>
                          <TierIcon tier={r.demand_tier!} />
                          <span className={`type-caption font-medium ${tier.className}`}>
                            {tier.label}
                          </span>
                        </>
                      )}
                    </span>
                    <span className="w-[80px] flex justify-center">
                      <MentionedIcon mentioned={r.mentioned} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div data-pdf-divider className="h-px bg-border-default" />

          {/* Section D — Competitors */}
          {report.competitors.length > 0 && (
            <>
              <div data-pdf-pad className="py-6 px-8">
                <p className="type-body font-semibold text-text-heading mb-1">
                  Kompetitor
                </p>
                <p className="type-body text-text-muted mb-3">
                  Brand berikut disebutkan oleh AI
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.competitors.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center h-8 px-4 rounded-full border border-border-default type-body text-text-body"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div data-pdf-divider className="h-px bg-border-default" />
            </>
          )}

          {/* Section E — Findings */}
          {(() => {
            if (problemsLoading) {
              return (
                <div data-pdf-pad className="pt-6 px-8 pb-6">
                  <p className="type-body font-semibold text-text-heading mb-4">Temuan</p>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-4 animate-pulse">
                      <div className="w-16 h-5 rounded-full bg-border-default shrink-0" />
                      <div className="flex-1 h-4 rounded bg-border-default" />
                    </div>
                  ))}
                </div>
              );
            }

            if (problems.length === 0) return null;

            return (
              <div data-pdf-pad className="pt-6 px-8 pb-6">
                <p className="type-body font-semibold text-text-heading mb-4">Temuan</p>

                <div className="flex items-center py-3 border-b border-border-default">
                  <span className="type-col-header w-[140px]">Prioritas</span>
                  <span className="type-col-header flex-1">Isu</span>
                </div>

                <div className="flex flex-col">
                  {problems.map((problem, i) => {
                    const config = SEVERITY_CONFIG[problem.severity] ?? SEVERITY_CONFIG.low;
                    return (
                      <div key={i} className="flex items-center py-4">
                        <span className="w-[140px] flex items-center gap-2">
                          <SeverityIcon severity={problem.severity} />
                          <span className="type-caption font-medium text-[#4A5565]">{config.label}</span>
                        </span>
                        <span className="type-body text-text-heading flex-1 line-clamp-1">
                          {problem.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Section F — Footer */}
          <div data-pdf-pad data-pdf-footer className="flex items-center justify-between py-4 px-8 border-t border-border-default bg-surface">
            <div className="flex items-center gap-1.5">
              <img src={LOGO_SVG} alt="Nuave" width={18} height={18} className="object-contain" />
              <span className="type-title text-text-heading">Nuave</span>
              <span className="type-caption text-text-muted ml-1">Dibuat dengan nuave.ai</span>
            </div>
            <span className="type-caption text-text-muted">{report.date}</span>
          </div>
        </div>
        </TooltipProvider>
      </main>

      {/* ── Bottom sticky bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-[8px] border-t border-border-default"
        style={{ transform: `translateY(${bottomBarTranslate}%)` }}
      >
        <div className="max-w-[800px] mx-auto h-16 flex items-center justify-between">
          <span className="type-report-title-sm text-text-heading">
            Laporan Visibilitas AI
          </span>
          <CTAButtons
            onDownload={handleDownload}
            downloading={downloading}
            onViewRecs={navigateToRecs}
          />
        </div>
      </div>

      {/* Prompt detail sidebar */}
      {selectedPrompt && (
        <PromptDetailModal
          result={selectedPrompt}
          brandName={report.brandName}
          onClose={() => setSelectedPrompt(null)}
        />
      )}
    </div>
  );
}
