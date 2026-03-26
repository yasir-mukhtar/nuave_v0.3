"use client";

import { useRef, useEffect, useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
    <div id="cara-kerja" ref={sectionRef} className="lp-hiw-section relative pt-[120px]" style={{ background: "var(--lp-bg)" }}>
      {/* Sticky heading */}
      <div
        className="lp-hiw-sticky-heading sticky top-20 z-10 pb-10 px-8 pointer-events-none"
        style={{ opacity: headingOpacity, transition: "opacity 0.1s linear" }}
      >
        <div className="max-w-[868px] mx-auto text-center">
          <h2 className="lp-hiw-heading">
            Nuave membantu brand Anda muncul dalam jawaban ChatGPT
          </h2>
        </div>
      </div>

      {/* Cards scroll area */}
      <div className="pb-[120px]">
        {CARDS.map((card, i) => (
          <div
            key={i}
            className="lp-hiw-card-wrapper sticky px-8 pb-6 mb-6"
            style={{ top: 232, zIndex: 20 + i }}
          >
            <div
              className="lp-hiw-card-grid max-w-[868px] mx-auto grid grid-cols-2 rounded-[12px] overflow-hidden bg-white border border-[#E5E7EB] shadow-[0_8px_40px_rgba(0,0,0,0.10)] min-h-[360px]"
              style={{ transformOrigin: "top center" }}
            >
              {/* Left panel — white */}
              <div className={cn(
                "lp-hiw-left-panel bg-white p-10 flex flex-col justify-between",
                card.flip ? "order-2" : "order-1"
              )}>
                <div>
                  {/* Step circle */}
                  <div className="w-10 h-10 rounded-full bg-[var(--lp-purple)] text-white text-[24px] font-bold tracking-[-0.5px] leading-[1.4] flex items-center justify-center mb-6">
                    {card.step}
                  </div>
                  <h3 className="mb-3">
                    {card.title}
                  </h3>
                  <p className="text-[16px] leading-[28px] text-[#858585] mb-6">
                    {card.desc}
                  </p>
                </div>
                {/* Checklist */}
                <div className="flex flex-col gap-2.5">
                  {card.checks.map((check, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <IconCheck size={16} color="var(--lp-text-primary)" stroke={2} className="shrink-0" />
                      <span className="text-[16px] font-normal leading-[28px] text-[var(--lp-text-primary)]">{check}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel — image bg with preview (desktop) */}
              <div
                className={cn(
                  "lp-hiw-right-panel relative overflow-hidden flex items-center justify-center bg-cover bg-center",
                  card.flip ? "order-1" : "order-2"
                )}
                style={{ backgroundImage: card.rightBg }}
              >
                <Image
                  src={card.preview}
                  alt={card.title}
                  width={480}
                  height={360}
                  className="w-[75%] h-auto object-contain rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
                />
              </div>

              {/* Mobile preview image */}
              <div className="lp-hiw-mobile-preview p-3 order-3">
                <div
                  className="bg-cover bg-center rounded-[8px] p-6 flex justify-center items-center"
                  style={{ backgroundImage: card.rightBg }}
                >
                  <Image
                    src={card.preview}
                    alt={card.title}
                    width={480}
                    height={360}
                    className="w-[80%] h-auto object-contain rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
