"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconDownload, IconArrowRight } from "@tabler/icons-react";
import { ButtonSpinner } from "@/components/ButtonSpinner";
import PromptDetailModal, { type PromptDetail } from "@/components/PromptDetailModal";

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

/* ── Score ring component ── */
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
    <div style={{ position: "relative", width: size, height: size }}>
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
      <span style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-heading)",
        fontSize: 28,
        fontWeight: 700,
        color: "#111827",
      }}>
        {score}
      </span>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Memuat laporan...</p>
      </div>
    }>
      <ReportPageContent />
    </Suspense>
  );
}

function ReportPageContent() {
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
        }
      })();
    }
  }, [searchParams, router]);

  if (!REPORT) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Top bar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        background: "#ffffff",
        borderBottom: "1px solid var(--border-default)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src={LOGO_SVG} alt="Nuave" width={24} height={24} style={{ objectFit: "contain" }} />
          <span style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            fontSize: 18,
            color: "#111827",
          }}>
            Nuave
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "#ffffff",
              color: "#374151",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {downloading ? <ButtonSpinner size={14} color="var(--purple)" /> : <IconDownload size={16} stroke={1.5} />}
            {downloading ? "Mengunduh..." : "Unduh laporan"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--purple)",
              color: "#ffffff",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--purple-dark)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--purple)"; }}
          >
            Dashboard
            <IconArrowRight size={16} stroke={1.5} />
          </button>
        </div>
      </header>

      {/* Report card */}
      <main style={{
        maxWidth: 680,
        margin: "40px auto",
        padding: "0 24px 80px",
      }}>
        <div ref={reportRef} style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid var(--border-default)",
          overflow: "hidden",
        }}>
          {/* Header row — brand + title */}
          <div data-pdf-pad style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "32px 32px 24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Brand logo */}
              {REPORT.faviconUrl ? (
                <img
                  src={REPORT.faviconUrl}
                  alt={REPORT.brandName}
                  width={40}
                  height={40}
                  style={{
                    borderRadius: 8,
                    objectFit: "contain",
                    background: "var(--bg-surface-raised)",
                  }}
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
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "var(--bg-surface-raised)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--purple)",
                  fontFamily: "var(--font-heading)",
                }}>
                  {REPORT.brandName.charAt(0)}
                </div>
              )}
              <div>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                }}>
                  {REPORT.brandName}
                </p>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  margin: 0,
                }}>
                  {REPORT.brandUrl}
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                color: "#111827",
                margin: 0,
              }}>
                {REPORT.title}
              </p>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--text-muted)",
                margin: 0,
              }}>
                {REPORT.date}
              </p>
            </div>
          </div>

          {/* Score section */}
          <div data-pdf-pad style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "16px 32px 32px",
          }}>
            <ScoreRing score={REPORT.score} />
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--text-muted)",
              margin: "12px 0 4px",
            }}>
              Skor Visibilitas AI
            </p>
            <p style={{
              fontFamily: "var(--font-heading)",
              fontSize: 18,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 4px",
            }}>
              {REPORT.level}
            </p>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-muted)",
              margin: 0,
            }}>
              Brand Anda muncul di {REPORT.mentionedCount} dari {REPORT.totalPrompts} pertanyaan
            </p>
          </div>

          {/* Divider */}
          <div data-pdf-divider style={{ height: 1, background: "#E5E7EB", margin: "0 32px" }} />

          {/* Competitors section */}
          <div data-pdf-pad style={{ padding: "24px 32px" }}>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 4px",
            }}>
              Kompetitor
            </p>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-muted)",
              margin: "0 0 12px",
            }}>
              AI juga merekomendasikan brand berikut:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {REPORT.competitors.map((name) => (
                <span
                  key={name}
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: 6,
                    background: "var(--bg-surface-raised)",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "#374151",
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div data-pdf-divider style={{ height: 1, background: "#E5E7EB", margin: "0 32px" }} />

          {/* Results section */}
          <div data-pdf-pad style={{ padding: "24px 32px 32px" }}>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 4px",
            }}>
              Hasil Uji
            </p>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-muted)",
              margin: "0 0 16px",
            }}>
              Berikut hasil setiap pertanyaan:
            </p>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {REPORT.results.map((r, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPrompt({
                    prompt_text: r.prompt,
                    ai_response: r.ai_response || "",
                    brand_mentioned: r.mentioned,
                  })}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "12px 0",
                    borderTop: "none",
                    borderBottom: "none",
                    cursor: "pointer",
                    borderRadius: 6,
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "#111827",
                    flex: 1,
                  }}>
                    {r.prompt}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {r.demand_tier && TIER_STYLES[r.demand_tier] && (
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 6,
                        backgroundColor: TIER_STYLES[r.demand_tier].bg,
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: TIER_STYLES[r.demand_tier].color,
                        lineHeight: "16px",
                        whiteSpace: "nowrap",
                      }}>
                        {TIER_STYLES[r.demand_tier].label}
                      </span>
                    )}
                    <span style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: 500,
                      color: r.mentioned ? "var(--green)" : "var(--red)",
                      whiteSpace: "nowrap",
                    }}>
                      {r.mentioned ? "Muncul" : "Tidak muncul"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div data-pdf-pad data-pdf-footer style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 32px",
            borderTop: "1px solid #E5E7EB",
            background: "var(--bg-surface)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src={LOGO_SVG} alt="Nuave" width={18} height={18} style={{ objectFit: "contain" }} />
              <span style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 14,
                color: "#111827",
              }}>
                Nuave
              </span>
            </div>
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-muted)",
            }}>
              Dibuat dengan <strong style={{ color: "#111827" }}>nuave.ai</strong>
            </span>
          </div>
        </div>
      </main>
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
