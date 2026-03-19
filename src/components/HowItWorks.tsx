"use client";

import { useRef, useEffect, useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import Image from "next/image";

/* ── Card data ── */
const CARDS = [
  {
    step: "1",
    label: "Langkah 1",
    title: "Tentukan Prompt",
    desc: "Pilih dan tentukan prompt yang relevan dengan brand Anda. Nuave akan menggunakannya untuk menguji seberapa sering brand Anda muncul dalam jawaban AI.",
    checks: [
      "Pilih kategori industri Anda",
      "Buat prompt yang relevan",
      "Tentukan target audiens",
    ],
    rightBg: "url('/bg-step-1.png')",
    preview: "/preview-step-1.png",
  },
  {
    step: "2",
    label: "Langkah 2",
    title: "Optimalkan Konten Web Anda",
    desc: "Dapatkan rekomendasi konten spesifik berdasarkan analisis AI. Nuave menunjukkan persis apa yang perlu dioptimalkan agar brand Anda lebih sering disebut.",
    checks: [
      "Rekomendasi konten berbasis data",
      "Panduan optimasi halaman",
      "Template konten siap pakai",
    ],
    rightBg: "url('/bg-step-2.png')",
    preview: "/preview-step-2.png",
    flip: true,
  },
  {
    step: "3",
    label: "Langkah 3",
    title: "Monitor Visibilitas Brand Anda",
    desc: "Pantau perkembangan visibilitas brand Anda dari waktu ke waktu. Lihat apakah optimasi Anda berhasil meningkatkan kemunculan di jawaban AI.",
    checks: [
      "Dashboard real-time",
      "Tren visibilitas mingguan",
      "Benchmark vs kompetitor",
    ],
    rightBg: "url('/bg-step-3.png')",
    preview: "/preview-step-3.png",
  },
];


/* ── Main component ── */
export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number[]>([0, 0, 0]);
  const [headingOpacity, setHeadingOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top + window.scrollY;
      const sectionHeight = sectionRef.current.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // Each card gets 24px of scroll space before the next appears
      const cardStep = 24;
      const newProgress = CARDS.map((_, i) => {
        const cardStart = sectionTop + 200 + i * cardStep;
        const cardEnd = cardStart + cardStep;
        const raw = (scrollY - cardStart) / (cardEnd - cardStart);
        return Math.max(0, Math.min(1, raw));
      });
      setScrollProgress(newProgress);

      // Fade heading as section scrolls off screen
      const fadeStart = sectionBottom - vh - 200;
      const fadeEnd = sectionBottom - vh;
      const alpha = 1 - Math.max(0, Math.min(1, (scrollY - fadeStart) / (fadeEnd - fadeStart)));
      setHeadingOpacity(alpha);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div id="cara-kerja" ref={sectionRef} className="lp-hiw-section" style={{ position: "relative", background: "var(--lp-bg)", paddingTop: 120 }}>
      {/* Sticky heading */}
      <div className="lp-hiw-sticky-heading" style={{
        position: "sticky",
        top: 80,
        zIndex: 10,
        paddingTop: 0,
        paddingBottom: 40,
        paddingLeft: 32,
        paddingRight: 32,
        pointerEvents: "none",
        opacity: headingOpacity,
        transition: "opacity 0.1s linear",
      }}>
        <div style={{ maxWidth: 868, margin: "0 auto", textAlign: "center" }}>
          <h2 className="lp-hiw-heading">
            Nuave membantu brand Anda muncul dalam jawaban ChatGPT
          </h2>
        </div>
      </div>

      {/* Cards scroll area */}
      <div style={{ paddingBottom: 120 }}>
        {CARDS.map((card, i) => {
          const isLast = i === CARDS.length - 1;
          const scale = 1;
          const opacity = 1;

          return (
            <div
              key={i}
              className="lp-hiw-card-wrapper"
              style={{
                position: "sticky",
                top: 232,
                zIndex: 20 + i,
                paddingLeft: 32,
                paddingRight: 32,
                paddingBottom: 24,
                marginBottom: 24,
              }}
            >
              <div className="lp-hiw-card-grid" style={{
                maxWidth: 868,
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderRadius: 20,
                overflow: "hidden",
                background: "#ffffff",
                border: "1px solid #E5E7EB",
                boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
                transform: `scale(${scale})`,
                opacity,
                transition: "transform 0.05s linear, opacity 0.05s linear",
                transformOrigin: "top center",
                minHeight: 360,
              }}>
                {/* Left panel — white */}
                <div className="lp-hiw-left-panel" style={{
                  background: "#ffffff",
                  padding: 40,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  order: card.flip ? 2 : 1,
                }}>
                  <div>
                    {/* Step circle */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--lp-purple)",
                      color: "#fff",
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: "-0.5px",
                      lineHeight: 1.4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 24,
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {card.step}
                    </div>
                    <h3 style={{ marginBottom: 12 }}>
                      {card.title}
                    </h3>
                    <p style={{
                      fontSize: 16,
                      lineHeight: "28px",
                      color: "#858585",
                      marginBottom: 24,
                    }}>
                      {card.desc}
                    </p>
                  </div>
                  {/* Checklist */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {card.checks.map((check, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <IconCheck size={16} color="var(--lp-text-primary)" stroke={2} style={{ flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 400, lineHeight: "28px", color: "var(--lp-text-primary)" }}>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right panel — image bg with preview */}
                <div className="lp-hiw-right-panel" style={{
                  backgroundImage: card.rightBg,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  order: card.flip ? 1 : 2,
                }}>
                  <Image
                    src={card.preview}
                    alt={card.title}
                    width={480}
                    height={360}
                    style={{ width: "75%", height: "auto", objectFit: "contain", borderRadius: "8px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
