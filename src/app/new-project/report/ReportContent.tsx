"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconDownload, IconArrowRight } from "@tabler/icons-react";
import { ButtonSpinner } from "@/components/ButtonSpinner";
import PromptDetailModal, { type PromptDetail } from "@/components/PromptDetailModal";
import { Button } from "@/components/ui/button";

const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";

interface ReportData {
  brandName: string;
  brandUrl: string;
  faviconUrl: string | null;
  date: string;
  title: string;
  score: number;
  level: string;
  mentionedCount: number;
  totalPrompts: number;
  competitors: string[];
  results: { prompt: string; mentioned: boolean; demand_tier?: string; ai_response?: string }[];
}

const TIER_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: "#EDE9FE", color: "#7C3AED", label: "Volume tinggi" },
  medium: { bg: "#FEF3C7", color: "#D97706", label: "Volume sedang" },
  low: { bg: "#F3F4F6", color: "#374151", label: "Volume rendah" },
};

function getVisibilityLevel(score: number): string {
  if (score >= 80) return "Visibilitas Tinggi";
  if (score >= 50) return "Visibilitas Sedang";
  if (score >= 20) return "Visibilitas Rendah";
  return "Tidak Terlihat";
}

function buildReport(): ReportData {
  const auditRaw = sessionStorage.getItem("nuave_audit_result");
  const projectRaw = sessionStorage.getItem("nuave_new_project");

  const project = projectRaw ? JSON.parse(projectRaw) : {};
  const audit = auditRaw ? JSON.parse(auditRaw) : {};

  const score = audit.visibility_score ?? 0;
  // Load saved prompts data for demand_tier
  const savedPromptsRaw = sessionStorage.getItem("nuave_new_project_prompts");
  const savedPrompts: { prompt: string; demand_tier?: string }[] = savedPromptsRaw ? JSON.parse(savedPromptsRaw) : [];

  const results = (audit.results || []).map((r: { prompt_text: string; brand_mentioned: boolean; ai_response?: string; mention_context?: string }) => {
    const match = savedPrompts.find((sp) => sp.prompt === r.prompt_text);
    return {
      prompt: r.prompt_text,
      mentioned: r.brand_mentioned,
      demand_tier: match?.demand_tier || undefined,
      ai_response: r.ai_response || "",
    };
  });
  const mentionedCount = results.filter((r: { mentioned: boolean }) => r.mentioned).length;

  // Extract unique competitor names from audit results
  const competitorSet = new Set<string>();
  (audit.results || []).forEach((r: { competitor_mentions?: string[] }) => {
    (r.competitor_mentions || []).forEach((c: string) => competitorSet.add(c));
  });

  return {
    brandName: project.brandName || "Brand",
    brandUrl: project.url || "",
    faviconUrl: project.faviconUrl || null,
    date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    title: "Laporan Visibilitas AI",
    score,
    level: getVisibilityLevel(score),
    mentionedCount,
    totalPrompts: audit.total_prompts || results.length,
    competitors: Array.from(competitorSet).slice(0, 6),
    results,
  };
}

/* -- Score ring component -- */
function ScoreRing({ score }: { score: number }) {
  const size = 100;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  let color = "#ef4444"; // red < 40
  if (score >= 40 && score < 70) color = "#f59e0b"; // amber
  if (score >= 70) color = "#22c55e"; // green

  return (
    <div className="relative w-[100px] h-[100px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={stroke}
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </g>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center type-heading-md text-text-heading">
        {score}
      </span>
    </div>
  );
}

export default function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [REPORT, setReport] = useState<ReportData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptDetail | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!reportRef.current || !REPORT || downloading) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      // Temporarily strip border, border-radius, and inner padding for PDF
      const el = reportRef.current;
      const origStyle = {
        border: el.style.border,
        borderRadius: el.style.borderRadius,
      };
      el.style.border = "none";
      el.style.borderRadius = "0";

      // Remove horizontal padding/margin from inner sections
      const paddedEls = el.querySelectorAll<HTMLElement>("[data-pdf-pad]");
      const origPads: string[] = [];
      paddedEls.forEach((child, i) => {
        origPads[i] = child.style.padding || "";
        const p = child.style.padding;
        // Strip left/right padding: "Xpx 32px Ypx" → "Xpx 0 Ypx"
        let newPad = p.replace(/32px/g, "0");
        // Reduce header top padding (first element)
        if (i === 0) newPad = newPad.replace(/^32px/, "16px");
        child.style.padding = newPad;
      });
      const dividers = el.querySelectorAll<HTMLElement>("[data-pdf-divider]");
      const origMargins: string[] = [];
      dividers.forEach((d, i) => {
        origMargins[i] = d.style.margin;
        d.style.margin = "0";
      });

      // Remove footer border-top for PDF
      const footerEl = el.querySelector<HTMLElement>("[data-pdf-footer]");
      const origFooterBorder = footerEl?.style.borderTop || "";
      if (footerEl) footerEl.style.borderTop = "none";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      // Restore original styles
      el.style.border = origStyle.border;
      el.style.borderRadius = origStyle.borderRadius;
      paddedEls.forEach((child, i) => { child.style.padding = origPads[i]; });
      dividers.forEach((d, i) => { d.style.margin = origMargins[i]; });
      if (footerEl) footerEl.style.borderTop = origFooterBorder;

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 5; // margin in mm
      const contentWidth = imgWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      if (imgHeight + margin * 2 <= pageHeight) {
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
      } else {
        // Split canvas into page-sized chunks, reserving space for footer
        const footerSpace = 16; // mm for stroke + page number
        const pageContentHeight = pageHeight - margin - margin - footerSpace;
        const totalPages = Math.ceil(imgHeight / pageContentHeight);
        const srcPageHeightPx = (pageContentHeight / imgHeight) * canvas.height;

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const srcY = page * srcPageHeightPx;
          const srcH = Math.min(srcPageHeightPx, canvas.height - srcY);
          const destH = (srcH / canvas.width) * contentWidth;

          // Create a sub-canvas for this page slice
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

        // Add page footer: stroke + page number
        for (let p = 0; p < totalPages; p++) {
          pdf.setPage(p + 1);
          // Divider stroke
          pdf.setDrawColor(229, 231, 235); // #E5E7EB
          pdf.setLineWidth(0.3);
          pdf.line(margin, pageHeight - 14, imgWidth - margin, pageHeight - 14);
          // Page number
          pdf.setFontSize(9);
          pdf.setTextColor(156, 163, 175);
          const pageText = `Halaman ${p + 1} dari ${totalPages}`;
          const textWidth = pdf.getTextWidth(pageText);
          pdf.text(pageText, (imgWidth - textWidth) / 2, pageHeight - 8);
        }
      }

      const fileName = `Laporan-Visibilitas-AI-${REPORT.brandName.replace(/\s+/g, "-")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
    setDownloading(false);
  }, [REPORT, downloading]);

  useEffect(() => {
    const auditId = searchParams.get("audit_id");
    const auditRaw = sessionStorage.getItem("nuave_audit_result");

    if (!auditRaw && !auditId) {
      router.replace("/new-project");
      return;
    }

    // If we have cached result, use it
    if (auditRaw) {
      setReport(buildReport());
      // Set new workspace as active so dashboard picks it up on navigation
      const projectRaw = sessionStorage.getItem("nuave_new_project");
      if (projectRaw) {
        const project = JSON.parse(projectRaw);
        if (project.workspaceId) {
          localStorage.setItem("nuave_active_workspace", project.workspaceId);
        }
      }
      return;
    }

    // Otherwise fetch from API
    if (auditId) {
      (async () => {
        const res = await fetch(`/api/audit/${auditId}/status`);
        const data = await res.json();
        if (data.status === "complete") {
          sessionStorage.setItem("nuave_audit_result", JSON.stringify(data));
          setReport(buildReport());
          // Set new workspace as active
          const projectRaw = sessionStorage.getItem("nuave_new_project");
          if (projectRaw) {
            const project = JSON.parse(projectRaw);
            if (project.workspaceId) {
              localStorage.setItem("nuave_active_workspace", project.workspaceId);
            }
          }
        }
      })();
    }
  }, [searchParams, router]);

  if (!REPORT) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-text-muted">Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-raised">
      {/* Top bar */}
      <header className="flex items-center justify-between py-4 px-8 bg-white border-b border-border-default">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <img src={LOGO_SVG} alt="Nuave" width={24} height={24} className="object-contain" />
          <span className="type-title text-text-heading">
            Nuave
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="default" onClick={handleDownload} disabled={downloading}>
            {downloading ? <ButtonSpinner size={14} color="var(--purple)" /> : <IconDownload size={16} stroke={1.5} />}
            {downloading ? "Mengunduh..." : "Unduh laporan"}
          </Button>
          <Button variant="brand" onClick={() => router.push("/dashboard")}>
            Dashboard
            <IconArrowRight size={16} stroke={1.5} />
          </Button>
        </div>
      </header>

      {/* Report card */}
      <main className="max-w-[680px] mx-auto mt-10 px-6 pb-20">
        <div ref={reportRef} className="bg-white rounded-lg border border-border-default overflow-hidden">
          {/* Header row — brand + title */}
          <div data-pdf-pad className="flex items-start justify-between pt-8 px-8 pb-6">
            <div className="flex items-center gap-3">
              {/* Brand logo */}
              {REPORT.faviconUrl ? (
                <img
                  src={REPORT.faviconUrl}
                  alt={REPORT.brandName}
                  width={40}
                  height={40}
                  className="rounded-md object-contain bg-surface-raised"
                  onError={(e) => {
                    // Fallback to initial letter if favicon fails to load
                    const el = e.currentTarget;
                    const parent = el.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.textContent = REPORT.brandName.charAt(0);
                      Object.assign(fallback.style, {
                        width: "40px", height: "40px", borderRadius: "8px",
                        background: "var(--bg-surface-raised)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: "18px", fontWeight: "600",
                        color: "var(--purple)", fontFamily: "var(--font-heading)",
                      });
                      parent.replaceChild(fallback, el);
                    }
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-surface-raised flex items-center justify-center type-body-lg font-semibold text-brand">
                  {REPORT.brandName.charAt(0)}
                </div>
              )}
              <div>
                <p className="type-body font-semibold text-text-heading m-0">
                  {REPORT.brandName}
                </p>
                <p className="type-body text-text-muted m-0">
                  {REPORT.brandUrl}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="type-body font-semibold text-text-heading m-0">
                {REPORT.title}
              </p>
              <p className="type-body text-text-muted m-0">
                {REPORT.date}
              </p>
            </div>
          </div>

          {/* Score section */}
          <div data-pdf-pad className="flex flex-col items-center pt-4 px-8 pb-8">
            <ScoreRing score={REPORT.score} />
            <p className="type-caption text-text-muted mt-3 mb-1">
              Skor Visibilitas AI
            </p>
            <p className="type-body-lg font-semibold text-text-heading mb-1">
              {REPORT.level}
            </p>
            <p className="type-body text-text-muted m-0">
              Brand Anda muncul di {REPORT.mentionedCount} dari {REPORT.totalPrompts} pertanyaan
            </p>
          </div>

          {/* Divider */}
          <div data-pdf-divider className="h-px bg-border-default mx-8" />

          {/* Competitors section */}
          <div data-pdf-pad className="py-6 px-8">
            <p className="type-body font-semibold text-text-heading mb-1">
              Kompetitor
            </p>
            <p className="type-body text-text-muted mb-3">
              AI juga merekomendasikan brand berikut:
            </p>
            <div className="flex flex-wrap gap-2">
              {REPORT.competitors.map((name) => (
                <span
                  key={name}
                  className="inline-block py-1.5 px-3.5 rounded-sm bg-surface-raised type-body text-text-body"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div data-pdf-divider className="h-px bg-border-default mx-8" />

          {/* Results section */}
          <div data-pdf-pad className="pt-6 px-8 pb-8">
            <p className="type-body font-semibold text-text-heading mb-1">
              Hasil Uji
            </p>
            <p className="type-body text-text-muted mb-4">
              Berikut hasil setiap pertanyaan:
            </p>

            <div className="flex flex-col">
              {REPORT.results.map((r, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPrompt({
                    prompt_text: r.prompt,
                    ai_response: r.ai_response || "",
                    brand_mentioned: r.mentioned,
                  })}
                  className="flex items-start justify-between gap-4 py-3 cursor-pointer rounded-sm transition-colors duration-100 ease-in-out hover:bg-surface"
                >
                  <span className="type-body text-text-heading flex-1">
                    {r.prompt}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.demand_tier && TIER_STYLES[r.demand_tier] && (
                      <span
                        className="inline-block py-0.5 px-2 rounded-sm type-caption font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: TIER_STYLES[r.demand_tier].bg,
                          color: TIER_STYLES[r.demand_tier].color,
                        }}
                      >
                        {TIER_STYLES[r.demand_tier].label}
                      </span>
                    )}
                    <span className={`type-body font-medium whitespace-nowrap ${r.mentioned ? "text-success" : "text-error"}`}>
                      {r.mentioned ? "Muncul" : "Tidak muncul"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div data-pdf-pad data-pdf-footer className="flex items-center justify-between py-5 px-8 border-t border-border-default bg-surface">
            <div className="flex items-center gap-1.5">
              <img src={LOGO_SVG} alt="Nuave" width={18} height={18} className="object-contain" />
              <span className="type-title text-text-heading">
                Nuave
              </span>
            </div>
            <span className="type-body text-text-muted">
              Dibuat dengan <strong className="text-text-heading">nuave.ai</strong>
            </span>
          </div>
        </div>
      </main>
      {/* NOTE: Embedded @keyframes spin — consider moving to global CSS */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Prompt detail sidebar */}
      {selectedPrompt && (
        <PromptDetailModal
          result={selectedPrompt}
          brandName={REPORT.brandName}
          onClose={() => setSelectedPrompt(null)}
        />
      )}
    </div>
  );
}
