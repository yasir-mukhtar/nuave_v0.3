"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCheck, IconX, IconArrowRight, IconChevronDown, IconBrandOpenai, IconTarget, IconMessageChatbot, IconFileText, IconCpu, IconCreditCard } from '@tabler/icons-react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Footer from "@/components/Footer";

/* ───── Data ───── */

const STATS = [
  { value: "17%", label: "rata-rata respons AI yang menyebut sebuah brand" },
  { value: "3×", label: "keunggulan brand teratas vs rata-rata industri" },
  { value: "50%+", label: "penurunan traffic Google sejak AI mengambil alih" },
  { value: "~15%", label: "respons AI yang mengutip domain brand" },
];

const FEATURES = [
  { icon: IconTarget, title: "Visibility Score 0–100", desc: "Skor yang jelas dan terukur untuk menilai seberapa terlihat brand Anda di jawaban AI." },
  { icon: IconBrandOpenai, title: "Analisis Kompetitor", desc: "Lihat apakah kompetitor Anda disebut di jawaban ChatGPT — dan berapa sering." },
  { icon: IconMessageChatbot, title: "10 Prompt Realistis", desc: "Pertanyaan nyata yang diajukan konsumen ke ChatGPT tentang industri Anda." },
  { icon: IconFileText, title: "Rekomendasi Konten AI", desc: "Dapatkan saran konten spesifik untuk meningkatkan visibilitas brand di AI." },
  { icon: IconCpu, title: "Dual-AI Engine", desc: "Ditenagai Claude + GPT-4o untuk analisis yang lebih akurat dan komprehensif." },
  { icon: IconCreditCard, title: "Pay Per Audit", desc: "Sistem kredit tanpa langganan. 10 kredit gratis saat mendaftar, cukup untuk 1 audit." },
];

const PRICING = [
  {
    name: "Starter",
    credits: 50,
    price: "Rp 75.000",
    popular: false,
  },
  {
    name: "Growth",
    credits: 150,
    price: "Rp 199.000",
    popular: true,
  },
  {
    name: "Agency",
    credits: 500,
    price: "Rp 599.000",
    popular: false,
  },
];

const FAQS = [
  {
    q: "Apa itu AEO?",
    a: "AEO (Answer Engine Optimization) adalah proses mengoptimalkan konten agar brand Anda muncul di jawaban mesin AI seperti ChatGPT, bukan hanya di hasil pencarian Google tradisional.",
  },
  {
    q: "Apakah Nuave gratis?",
    a: "Ya, Anda mendapat 10 kredit gratis saat mendaftar — cukup untuk 1 audit lengkap. Tidak perlu kartu kredit.",
  },
  {
    q: "Berapa lama proses audit?",
    a: "Sekitar 60 detik. Nuave mengirim 10 pertanyaan realistis ke ChatGPT, menganalisis jawabannya, dan menghasilkan laporan lengkap.",
  },
  {
    q: "Bagaimana cara meningkatkan skor saya?",
    a: "Setelah audit, Nuave memberikan rekomendasi konten spesifik yang bisa Anda terapkan di website untuk meningkatkan visibilitas brand Anda di jawaban AI.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Ya, Nuave hanya menganalisis konten publik dari website Anda. Kami tidak mengakses data internal atau informasi sensitif.",
  },
];

const MOCK_PROMPTS = [
  { prompt: "Apa platform terbaik untuk audit AI di Indonesia?", mentioned: false },
  { prompt: "Rekomendasi tool SEO untuk bisnis kecil", mentioned: true },
  { prompt: "Bagaimana cara meningkatkan visibilitas online?", mentioned: false },
  { prompt: "Tool apa yang bisa cek brand visibility di ChatGPT?", mentioned: false },
  { prompt: "Apa itu AEO dan siapa yang menyediakannya?", mentioned: true },
];

/* ───── Hero Asset URLs (Framer CDN) ───── */
const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";
const BG_GRADIENT = "https://framerusercontent.com/images/aaSazir73GbncCCLDZdoqquukeY.png";
const DASHBOARD_IMAGES = [
  "https://framerusercontent.com/images/6KCcqoV5JsbhhakFNgDWYxdVzBA.png",
  "https://framerusercontent.com/images/YENU9KLYq8IxQPhP0g23k7epVQ.png",
  "https://framerusercontent.com/images/5z04w9x5IIQC2aQp3SPkEKtyT4.png",
];
const HERO_STEPS = ["Tentukan Prompt", "Audit Brand", "Monitoring Harian"];

const AI_LOGOS = [
  { src: "https://framerusercontent.com/images/1Qy4nO9eawrvXqYd9ILHfHG5VA.svg", alt: "Claude", w: 98, h: 24 },
  { src: "https://framerusercontent.com/images/PdwCanOeNG0AbS4iruy4sPRfdas.svg", alt: "Gemini", w: 110, h: 24 },
  { src: "https://framerusercontent.com/images/qQyt0pI4hotJKK8RE7TMneKyptI.svg", alt: "Perplexity", w: 94, h: 24 },
  { src: "https://framerusercontent.com/images/5UMspUrrkMvfl7lWs0vuweD8Tyk.svg", alt: "Meta AI", w: 89, h: 24 },
  { src: "https://framerusercontent.com/images/2WjKGtr45KhKPD7xLIEf4X0qRM.svg", alt: "ChatGPT", w: 110, h: 24 },
];

/* ───── Nav (Framer design) ───── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: scrolled ? 834 : 1072,
        padding: 16,
        zIndex: 100,
        transition: "max-width 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          padding: "12px 12px 12px 14px",
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
          borderRadius: 12,
          border: scrolled ? "1px solid rgba(117, 115, 114, 0.15)" : "1px solid transparent",
          transition: "background-color 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src={LOGO_SVG} alt="Nuave logo" width={28} height={28} style={{ objectFit: "contain" }} />
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 20,
              color: "#0d0d0d",
            }}
          >
            Nuave
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[
            { label: "Cara Kerja", href: "#cara-kerja" },
            { label: "Harga", href: "#harga" },
            { label: "FAQ", href: "#faq" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "24px",
                color: "var(--lp-text-primary)",
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/support"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: "24px",
              color: "var(--lp-text-primary)",
              textDecoration: "none",
            }}
          >
            Kontak
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: 1 }}>
              <path d="M3.5 2.5H9.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Masuk button */}
        <Link
          href="/auth"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 20px",
            backgroundColor: "var(--lp-text-primary)",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: 14,
            lineHeight: "1.7em",
            borderRadius: 6,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          Masuk
        </Link>
      </div>
    </nav>
  );
}

/* ───── Hero Section (Framer design) ───── */
function HeroSection() {
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % HERO_STEPS.length);
    }, 3000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const handleStepClick = (i: number) => {
    setActiveStep(i);
    startTimer();
  };

  return (
    <section
      className="lp-root"
      style={{
        position: "relative",
        width: "100%",
        padding: "120px 30px 0",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Headline */}
          <h1
            style={{
              maxWidth: 800,
              fontFamily: "'Inter Display', Inter, sans-serif",
              fontWeight: 600,
              fontSize: 60,
              lineHeight: "1em",
              letterSpacing: -1,
              color: "var(--lp-text-primary)",
              textAlign: "center",
              margin: 0,
            }}
          >
            Lihat seberapa sering ChatGPT menyebut brand Anda
          </h1>

          {/* Subtitle */}
          <p
            style={{
              maxWidth: 740,
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: 18,
              lineHeight: "1.7em",
              letterSpacing: -0.5,
              color: "var(--lp-text-secondary)",
              textAlign: "center",
              margin: 0,
            }}
          >
            Jutaan orang kini melakukan pencarian lewat AI. Nuave melacak brand Anda dalam jawaban ChatGPT dan memberi rekomendasi perbaikan.
          </p>

          {/* CTA Button */}
          <Link
            href="/auth"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "12px 22px",
              backgroundColor: "var(--lp-purple)",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: "1.7em",
              borderRadius: 6,
              border: "1px solid var(--lp-border)",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Audit brand Anda — Gratis!
          </Link>
        </div>

        {/* Preview area */}
        <div
          style={{
            marginTop: 64,
            width: "100%",
            position: "relative",
          }}
        >
          {/* Purple gradient background */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1.82094",
              borderRadius: 12,
              border: "1px solid var(--lp-border)",
              overflow: "hidden",
            }}
          >
            <img
              src={BG_GRADIENT}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />

            {/* Overlay content */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "40px 40px 0",
                gap: 24,
              }}
            >
              {/* Stepper bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  padding: "8px 14px",
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  border: "1px solid var(--lp-border)",
                  boxShadow: "rgba(0, 0, 0, 0.04) 0px 1px 4px 0px",
                  height: 43,
                }}
              >
                {HERO_STEPS.map((step, i) => (
                  <button
                    key={step}
                    onClick={() => handleStepClick(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "0 14px 0 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 500,
                      fontSize: 16,
                      lineHeight: "1.7em",
                      whiteSpace: "nowrap",
                      color: activeStep === i ? "var(--lp-text-primary)" : "var(--lp-text-secondary)",
                    }}
                  >
                    {/* Fixed 20px indicator box — dot and circle share same center */}
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {activeStep === i ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="10" fill="#0a0a0a" />
                          <text
                            x="10"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#fff"
                            fontFamily="Inter, sans-serif"
                            fontWeight="600"
                            fontSize="14"
                            letterSpacing="0em"
                          >
                            {i + 1}
                          </text>
                        </svg>
                      ) : (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 100,
                            backgroundColor: "var(--lp-border)",
                          }}
                        />
                      )}
                    </div>
                    {step}
                  </button>
                ))}
              </div>

              {/* Dashboard mockup card — outer container */}
              <div
                style={{
                  width: "100%",
                  maxWidth: 900,
                  height: 504,
                  padding: 16,
                  backdropFilter: "blur(54px)",
                  WebkitBackdropFilter: "blur(54px)",
                  backgroundColor: "rgba(255, 255, 255, 0.54)",
                  borderRadius: 12,
                  boxShadow: "rgba(0, 0, 0, 0.08) 0px 8px 32px 0px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {DASHBOARD_IMAGES.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt="Dashboard"
                    style={{
                      position: i === 0 ? "relative" : "absolute",
                      top: i === 0 ? 0 : 16,
                      left: i === 0 ? 0 : 16,
                      width: i === 0 ? "100%" : "calc(100% - 32px)",
                      height: i === 0 ? "100%" : "calc(100% - 32px)",
                      objectFit: "cover",
                      objectPosition: "top center",
                      borderRadius: 6,
                      opacity: activeStep === i ? 1 : 0,
                      transition: "opacity 0.5s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───── Page ───── */

export default function Home() {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Bottom CTA form state
  const [brandName2, setBrandName2] = useState("");
  const [websiteUrl2, setWebsiteUrl2] = useState("");
  const [loading2, setLoading2] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  async function handleSubmit(brand: string, url: string, setLoadingFn: (v: boolean) => void) {
    setError(null);
    setLoadingFn(true);
    try {
      sessionStorage.setItem('nuave_pending_brand', brand);
      sessionStorage.setItem('nuave_pending_url', url);
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/onboarding/analyze');
      } else {
        router.push('/auth');
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoadingFn(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>

      {/* ──── Nav + Hero + AI Logos (Framer design) ──── */}
      <div style={{ background: "var(--lp-bg, #f7f7f5)" }}>
      <Nav />
      <HeroSection />

      {/* ──── AI Logos Marquee ──── */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <section
        style={{
          width: "100%",
          paddingTop: 120,
          paddingBottom: 96,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          overflow: "hidden",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 18,
            lineHeight: "1.5em",
            color: "#0A0A0A",
            textAlign: "center",
            margin: 0,
            padding: "0 30px",
          }}
        >
          Dikembangkan untuk pencarian berbasis AI — sekarang dan di masa depan
        </p>

        {/* Marquee track */}
        <div
          style={{
            width: "100%",
            maxWidth: 1045,
            margin: "0 auto",
            overflow: "hidden",
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 96,
              width: "max-content",
              animation: "marquee-scroll 60s linear infinite",
            }}
          >
            {/* Duplicate the set 4× for seamless loop */}
            {[...AI_LOGOS, ...AI_LOGOS, ...AI_LOGOS, ...AI_LOGOS].map((logo, i) => (
              <img
                key={`${logo.alt}-${i}`}
                src={logo.src}
                alt={logo.alt}
                style={{
                  display: "block",
                  flexShrink: 0,
                  height: 28,
                  width: "auto",
                }}
              />
            ))}
          </div>
        </div>
      </section>
      </div>{/* end Framer hero+marquee wrapper */}

      {/* ──── Stats ──── */}
      <section className="lp-section" style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div className="lp-stats-grid">
          {STATS.map((s, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "24px 16px",
              background: "#ffffff", borderRadius: 'var(--radius-lg)', border: "1px solid #E5E7EB",
            }}>
              <div style={{ fontSize: "36px", fontWeight: 700, color: "#6C3FF5", marginBottom: "8px" }}>{s.value}</div>
              <div className="text-copy-14" style={{ color: "#6B7280" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-label-12" style={{ textAlign: "center", color: "#9CA3AF", marginTop: "20px" }}>
          Sumber: Analisis 8 juta respons AI — State of AI Search 2026
        </p>
      </section>

      {/* ──── SEO vs AEO ──── */}
      <section className="lp-section">
        <div className="lp-section-inner">
        <h2 className="lp-section-heading">
          SEO saja tidak cukup lagi.
        </h2>
        <div className="lp-two-col">
          {/* Before */}
          <div style={{
            padding: "32px", borderRadius: 'var(--radius-xl)', border: "1px solid #E5E7EB",
            background: "#F9FAFB", opacity: 0.75,
          }}>
            <div style={{
              fontSize: "12px", fontWeight: 600, color: "#9CA3AF",
              textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "20px",
            }}>
              Sebelum
            </div>
            {["Riset keyword", "10 blue links di Google", "Traffic stabil dari SEO", "Fokus ranking halaman", "Click-Through Rate (CTR)"].map((item, i) => (
              <div key={i} className="text-label-14" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "#6B7280" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D1D5DB", flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>

          {/* After */}
          <div style={{
            padding: "32px", borderRadius: 'var(--radius-xl)',
            border: "2px solid #6C3FF5", background: "#ffffff",
            boxShadow: "0 0 0 4px rgba(108,63,245,0.08)",
          }}>
            <div style={{
              fontSize: "12px", fontWeight: 600, color: "#6C3FF5",
              textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "20px",
            }}>
              Sekarang
            </div>
            {["Orang bertanya langsung ke ChatGPT", "AI memberi jawaban langsung", "50%+ traffic Google menurun", "Disebut di jawaban AI", "Share of Voice di AI"].map((item, i) => (
              <div key={i} className="text-label-14" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "#111827", fontWeight: 500 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6C3FF5", flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Callout */}
        <div style={{
          marginTop: "32px", padding: "20px 24px", borderRadius: 'var(--radius-lg)',
          background: "#EDE9FF", textAlign: "center",
        }}>
          <p style={{ fontSize: "15px", color: "#111827", margin: 0, lineHeight: 1.6 }}>
            <strong>AEO</strong> memastikan brand Anda muncul ketika AI menjawab pertanyaan pelanggan.
            <br />Nuave mengukur dan memperbaiki hal ini.
          </p>
        </div>
        </div>
      </section>

      {/* ──── How it works ──── */}
      <section id="cara-kerja" className="lp-section" style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div className="lp-section-inner">
          <h2 className="lp-section-heading">
            Bagaimana Nuave bekerja
          </h2>
          <div className="lp-steps-grid">
            {[
              { step: "1", title: "Masukkan brand & URL", desc: "Isi nama brand dan URL website Anda. Hanya butuh 5 detik." },
              { step: "2", title: "AI mengirim 10 pertanyaan", desc: "Nuave mengirim 10 pertanyaan realistis ke ChatGPT dan menganalisis apakah brand Anda disebut." },
              { step: "3", title: "Terima skor & rekomendasi", desc: "Dapatkan Visibility Score 0–100 dan rekomendasi konten spesifik untuk meningkatkan visibilitas AI." },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  background: "#6C3FF5", color: "#ffffff",
                  fontSize: "20px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{s.title}</h3>
                <p className="text-copy-14" style={{ color: "#6B7280" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Features ──── */}
      <section className="lp-section" style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <h2 className="lp-section-heading" style={{ marginBottom: "12px" }}>
          Semua yang Anda butuhkan
        </h2>
        <p className="text-copy-16" style={{ color: "#6B7280", textAlign: "center", marginBottom: "48px" }}>
          Fitur lengkap untuk mengukur dan meningkatkan visibilitas brand di AI.
        </p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: "28px", borderRadius: 'var(--radius-lg)',
              border: "1px solid #E5E7EB", background: "#ffffff",
            }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: 'var(--radius-md)',
                background: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "16px",
              }}>
                <f.icon size={20} stroke={1.5} color="#6C3FF5" />
              </div>
              <h3 style={{ fontSize: "15px", marginBottom: "8px" }}>{f.title}</h3>
              <p className="text-copy-14" style={{ color: "#6B7280" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──── Score Preview ──── */}
      <section className="lp-section" style={{
        background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB",
      }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2 className="lp-section-heading" style={{ marginBottom: "12px" }}>
            Ini yang akan Anda lihat
          </h2>
          <p className="text-copy-16" style={{ color: "#6B7280", textAlign: "center", marginBottom: "48px" }}>
            Laporan detail dengan skor, analisis prompt, dan rekomendasi.
          </p>

          {/* Mockup card */}
          <div style={{
            background: "#ffffff", borderRadius: 'var(--radius-xl)', border: "1px solid #E5E7EB",
            padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}>
            {/* Score */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{
                width: "100px", height: "100px", borderRadius: "50%", margin: "0 auto 12px",
                background: `conic-gradient(#EF4444 0deg ${35 * 3.6}deg, #E5E7EB ${35 * 3.6}deg 360deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%", background: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#EF4444" }}>35</span>
                </div>
              </div>
              <span style={{
                display: "inline-block", background: "#FEE2E2", color: "#DC2626",
                fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: 'var(--radius-full)',
              }}>
                Visibilitas Rendah
              </span>
              <p className="text-copy-14" style={{ color: "#6B7280", marginTop: "8px" }}>
                2 dari 10 prompt menyebut brand Anda
              </p>
            </div>

            {/* Prompt rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {MOCK_PROMPTS.map((p, i) => (
                <div key={i} className="text-label-14" style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 16px", borderRadius: 'var(--radius-md)',
                  border: "1px solid #E5E7EB",
                  background: p.mentioned ? "#F0FDF4" : "#ffffff",
                }}>
                  {p.mentioned ? (
                    <IconCheck size={16} stroke={2.5} color="#22C55E" style={{ flexShrink: 0 }} />
                  ) : (
                    <IconX size={16} stroke={2.5} color="#EF4444" style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1 }}>{p.prompt}</span>
                  <span className="lp-score-badge-text" style={{
                    fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: 'var(--radius-full)',
                    background: p.mentioned ? "#DCFCE7" : "#FEE2E2",
                    color: p.mentioned ? "#16A34A" : "#DC2626",
                    flexShrink: 0,
                  }}>
                    {p.mentioned ? "Disebut" : "Tidak disebut"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <button
              onClick={() => {
                const form = document.getElementById('audit-form');
                if (form) form.scrollIntoView({ behavior: 'smooth' });
                else window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                fontSize: "15px", fontWeight: 600, color: "#ffffff",
                background: "#6C3FF5", border: "none", borderRadius: 'var(--radius-md)',
                padding: "14px 28px", cursor: "pointer",
              }}
            >
              Cek skor brand Anda sekarang <IconArrowRight size={18} stroke={1.5} />
            </button>
          </div>
        </div>
      </section>

      {/* ──── Pricing ──── */}
      <section id="harga" className="lp-section" style={{ maxWidth: "960px", margin: "0 auto" }}>
        <h2 className="lp-section-heading" style={{ marginBottom: "12px" }}>
          Harga sederhana, tanpa langganan
        </h2>
        <p className="text-copy-16" style={{ color: "#6B7280", textAlign: "center", marginBottom: "48px" }}>
          1 audit = 10 kredit. Daftar gratis = 10 kredit = 1 audit lengkap.
        </p>
        <div className="lp-pricing-grid">
          {PRICING.map((pkg) => (
            <div key={pkg.name} style={{
              position: "relative",
              padding: "32px 28px", borderRadius: 'var(--radius-xl)',
              background: pkg.popular ? "#6C3FF5" : "#ffffff",
              border: `1px solid ${pkg.popular ? "#6C3FF5" : "#E5E7EB"}`,
              boxShadow: pkg.popular ? "0 8px 32px rgba(108,63,245,0.25)" : "0 1px 2px rgba(0,0,0,0.05)",
              transform: pkg.popular ? "scale(1.03)" : "none",
              textAlign: "center",
            }}>
              {pkg.popular && (
                <div style={{
                  position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                  background: "#ffffff", color: "#6C3FF5",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                  padding: "4px 14px", borderRadius: 'var(--radius-full)',
                  border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  whiteSpace: "nowrap",
                }}>
                  Paling Populer
                </div>
              )}
              <p style={{
                fontSize: "13px", fontWeight: 600, textTransform: "uppercase" as const,
                letterSpacing: "0.05em", margin: "0 0 8px 0",
                color: pkg.popular ? "rgba(255,255,255,0.7)" : "#6B7280",
              }}>
                {pkg.name}
              </p>
              <p style={{
                fontSize: "36px", fontWeight: 700, margin: "0 0 4px 0",
                color: pkg.popular ? "#ffffff" : "#111827",
              }}>
                {pkg.price}
              </p>
              <p className="text-copy-14" style={{
                margin: "0 0 24px 0",
                color: pkg.popular ? "rgba(255,255,255,0.6)" : "#6B7280",
              }}>
                {pkg.credits} kredit
              </p>
              <button
                onClick={() => {
                  sessionStorage.setItem('nuave_pending_package', pkg.name.toLowerCase());
                  window.location.href = '/auth';
                }}
                className="text-label-14"
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  padding: "12px 24px", borderRadius: 'var(--radius-md)',
                  fontWeight: 600, border: "none", cursor: "pointer",
                  background: pkg.popular ? "#ffffff" : "#6C3FF5",
                  color: pkg.popular ? "#6C3FF5" : "#ffffff",
                }}
              >
                Beli {pkg.name} →
              </button>
            </div>
          ))}
        </div>
        <p className="text-label-13" style={{ textAlign: "center", color: "#9CA3AF", marginTop: "24px" }}>
          Belum yakin?{" "}
          <Link href="/auth" style={{ color: "#6C3FF5", fontWeight: 500, textDecoration: "none" }}>
            Mulai dengan 10 kredit gratis →
          </Link>
        </p>
      </section>

      {/* ──── FAQ ──── */}
      <section id="faq" className="lp-section" style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 className="lp-section-heading" style={{ marginBottom: "40px" }}>
            Pertanyaan yang sering ditanya
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: "#ffffff", border: "1px solid #E5E7EB", borderRadius: 'var(--radius-lg)',
                overflow: "hidden",
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "18px 24px", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span className="text-label-14" style={{ fontWeight: 600, color: "#111827" }}>{faq.q}</span>
                  <IconChevronDown
                    size={18} stroke={2} color="#6B7280"
                    style={{
                      flexShrink: 0, marginLeft: "12px",
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 18px" }}>
                    <p className="text-copy-14" style={{ color: "#6B7280", margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Final CTA ──── */}
      <section className="lp-section" style={{ background: "#EDE9FF" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "28px", marginBottom: "16px", lineHeight: 1.3 }}>
            Jangan biarkan brand Anda tidak terlihat di era AI.
          </h2>
          <p style={{ fontSize: "15px", color: "#6B7280", marginBottom: "32px" }}>
            Cek sekarang apakah ChatGPT menyebut brand Anda — gratis.
          </p>

          <div id="audit-form" style={{
            display: "flex", flexDirection: "column", gap: "12px",
            maxWidth: "400px", margin: "0 auto", textAlign: "left",
          }}>
            <div className="form-field">
              <label>Nama Brand</label>
              <input className="input-large" type="text" placeholder="misal: Nuave"
                value={brandName2} onChange={(e) => setBrandName2(e.target.value)} />
            </div>
            <div className="form-field">
              <label>URL Website</label>
              <input className="input-large" type="url" placeholder="misal: https://nuave.ai"
                value={websiteUrl2} onChange={(e) => setWebsiteUrl2(e.target.value)} />
            </div>
            <button type="button" onClick={() => handleSubmit(brandName2, websiteUrl2, setLoading2)} disabled={loading2}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                width: "100%", fontSize: "15px", fontWeight: 600, color: "#ffffff",
                background: "#6C3FF5", border: "none", borderRadius: 'var(--radius-md)',
                padding: "14px", cursor: loading2 ? "not-allowed" : "pointer",
                opacity: loading2 ? 0.7 : 1,
              }}>
              {loading2 ? "Menganalisis…" : <>Cek Visibilitas AI Anda <IconArrowRight size={18} stroke={1.5} /></>}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
            {["Gratis", "60 detik", "Tanpa kartu kredit"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6B7280" }}>
                <IconCheck size={16} stroke={2} color="#6C3FF5" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <Footer />
    </div>
  );
}
