"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { IconCheck, IconX, IconArrowRight, IconChevronDown, IconBrandOpenai, IconTarget, IconMessageChatbot, IconFileText, IconCpu, IconCreditCard, IconCoins } from '@tabler/icons-react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";

/* ───── Data ───── */

const STATS = [
  {
    number: "9x",
    title: "Conversion Rate",
    body: "Traffic dari AI memiliki conversion rate lebih tinggi dibanding search tradisional.",
  },
  {
    number: "4x",
    title: "Leads Quality",
    body: "Leads dari AI lebih siap untuk melakukan pembelian.",
  },
  {
    number: "1%",
    title: "Pertumbuhan Bulanan",
    body: "Pencarian melalui AI tumbuh 1% setiap bulan.",
  },
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
    name: "Lite",
    desc: "Track prompt selama satu minggu",
    credits: 50,
    price: "Rp75.000",
    highlight: false,
    badge: null,
  },
  {
    name: "Standar",
    desc: "Track prompt selama satu bulan",
    credits: 150,
    price: "Rp200.000",
    highlight: true,
    badge: "Lebih Hemat",
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

/* ───── Nav helpers ───── */
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function NavAnchor({ label, sectionId }: { label: string; sectionId: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => scrollToSection(sectionId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        fontSize: 14,
        lineHeight: "24px",
        color: hovered ? "#6C3FF5" : "var(--lp-text-primary)",
        textDecoration: "none",
        transition: "color 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

/* ───── Nav (Framer design) ───── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [kontakHovered, setKontakHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        className="lp-nav-bar"
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
          className="lp-nav-inner"
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

          {/* Links (desktop) */}
          <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <NavAnchor label="Cara Kerja" sectionId="cara-kerja" />
            <NavAnchor label="Harga" sectionId="harga" />
            <NavAnchor label="FAQ" sectionId="faq" />
            <a
              href="/support"
              onMouseEnter={() => setKontakHovered(true)}
              onMouseLeave={() => setKontakHovered(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "24px",
                color: kontakHovered ? "#6C3FF5" : "var(--lp-text-primary)",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              Kontak
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginTop: 1 }}>
                <path d="M3.5 2.5H9.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Masuk button (desktop) */}
          <Link
            href="/auth"
            className="btn-lp-black lp-nav-masuk"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 20px",
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

          {/* Hamburger button (mobile) */}
          <button
            className="lp-nav-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {mobileMenuOpen ? (
                <>
                  <path d="M6 6L18 18" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 6L6 18" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M4 8H20" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 16H20" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className="lp-mobile-menu-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "rgba(0,0,0,0.2)",
          backdropFilter: mobileMenuOpen ? "blur(1px)" : "blur(0px)",
          WebkitBackdropFilter: mobileMenuOpen ? "blur(1px)" : "blur(0px)",
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? "auto" : "none",
          transition: "opacity 0.3s ease, backdrop-filter 0.35s ease, -webkit-backdrop-filter 0.35s ease",
        }}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile menu drawer */}
      <div
        className="lp-mobile-menu"
        style={{
          position: "fixed",
          top: 92,
          left: 16,
          right: 16,
          zIndex: 101,
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid rgba(117, 115, 114, 0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          padding: "8px 0",
          flexDirection: "column",
          alignItems: "center",
          display: "flex",
          opacity: mobileMenuOpen ? 1 : 0,
          transform: mobileMenuOpen ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.97)",
          pointerEvents: mobileMenuOpen ? "auto" : "none",
          transition: "opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <button
          onClick={() => { scrollToSection("cara-kerja"); setMobileMenuOpen(false); }}
          style={{
            background: "none", border: "none", cursor: "pointer", textAlign: "center",
            padding: "14px 20px", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 16, width: "100%",
            color: "var(--lp-text-primary)",
          }}
        >
          Cara Kerja
        </button>
        <button
          onClick={() => { scrollToSection("harga"); setMobileMenuOpen(false); }}
          style={{
            background: "none", border: "none", cursor: "pointer", textAlign: "center",
            padding: "14px 20px", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 16, width: "100%",
            color: "var(--lp-text-primary)",
          }}
        >
          Harga
        </button>
        <button
          onClick={() => { scrollToSection("faq"); setMobileMenuOpen(false); }}
          style={{
            background: "none", border: "none", cursor: "pointer", textAlign: "center",
            padding: "14px 20px", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 16, width: "100%",
            color: "var(--lp-text-primary)",
          }}
        >
          FAQ
        </button>
        <a
          href="/support"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            padding: "14px 20px", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 16,
            color: "var(--lp-text-primary)", textDecoration: "none", textAlign: "center", display: "block", width: "100%",
          }}
        >
          Kontak
        </a>
        <div style={{ height: 1, background: "#E5E7EB", margin: "4px 16px" }} />
        <div style={{ padding: "12px 16px", width: "100%", boxSizing: "border-box" }}>
          <Link
            href="/auth"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-lp-black"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "12px 20px", color: "#fff", fontFamily: "Inter, sans-serif",
              fontWeight: 500, fontSize: 15, borderRadius: 8, textDecoration: "none",
              cursor: "pointer", width: "100%",
            }}
          >
            Masuk
          </Link>
        </div>
      </div>
    </>
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
      className="lp-root lp-hero-section"
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
            className="lp-hero-heading"
            style={{
              maxWidth: 800,
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontWeight: 600,
              fontSize: 60,
              lineHeight: "1em",
              letterSpacing: -2,
              color: "var(--lp-text-primary)",
              textAlign: "center",
              margin: 0,
            }}
          >
            Lihat seberapa sering ChatGPT menyebut brand Anda
          </h1>

          {/* Subtitle */}
          <p
            className="lp-hero-subtitle"
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
            className="btn-lp-purple"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "12px 22px",
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
          className="lp-hero-preview"
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
        className="lp-marquee-section"
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
          className="lp-marquee-text"
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

      {/* ──── Problem Section ──── */}
      <section className="lp-problem-section" style={{ background: "#ffffff", padding: "120px 32px" }}>
        <div style={{ maxWidth: 1044, margin: "0 auto" }}>

          {/* Heading */}
          <h2 className="lp-problem-heading" style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontWeight: 500,
            fontSize: 48,
            letterSpacing: "-2px",
            lineHeight: "1.2em",
            color: "#111827",
            textAlign: "center",
            margin: "0 0 56px 0",
          }}>
            Apakah brand Anda muncul di ChatGPT?
          </h2>

          {/* Two cards */}
          <div className="lp-problem-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

            {/* Card 1 — purple */}
            {[
              {
                bg: "/bg-purple.png",
                number: "49%",
                desc: "pencarian di ChatGPT meminta panduan dan rekomendasi",
                chips: ["Sepatu lari merek lokal terbaik", "Klinik kecantikan terpercaya di Jakarta", "Aplikasi budgeting terbaik untuk orang awam"],
              },
              {
                bg: "/bg-orange.png",
                number: "90%",
                desc: "klien B2B menggunakan ChatGPT untuk riset pembelian",
                chips: ["Jasa digital marketing untuk startup", "Software akuntansi terbaik untuk UMKM", "Vendor cloud storage terpercaya di Indonesia"],
              },
            ].map((card) => (
              <div key={card.number} className="lp-problem-card" style={{
                position: "relative",
                borderRadius: 16,
                border: "1px solid #E5E7EB",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 480,
                backgroundImage: `url('${card.bg}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}>
                {/* Top content */}
                <div style={{ padding: "40px 40px 0 40px" }}>
                  <p style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: 48,
                    letterSpacing: "-2px",
                    lineHeight: "1.2em",
                    color: "#111827",
                    margin: "0 0 20px 0",
                  }}>
                    {card.number}
                  </p>
                  <p style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: 22,
                    letterSpacing: "-0.5px",
                    lineHeight: "1.4em",
                    color: "#111827",
                    margin: 0,
                    maxWidth: 340,
                  }}>
                    {card.desc}
                  </p>
                </div>

                {/* Bottom chips */}
                <div style={{ padding: "120px 40px 40px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {card.chips.map((chip) => (
                    <span key={chip} style={{
                      display: "inline-block",
                      alignSelf: "flex-start",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 400,
                      fontSize: 16,
                      color: "#111827",
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 999,
                      padding: "8px 16px",
                      backdropFilter: "blur(4px)",
                    }}>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ──── How it works ──── */}
      <HowItWorks />


      {/* ──── Stats ──── */}
      <section className="lp-stats-section" style={{ background: "#F9FAFB", paddingTop: 120, paddingBottom: 120 }}>

        {/* Heading + subtitle — padded inward */}
        <div style={{ padding: "0 32px", textAlign: "center", marginBottom: 40 }}>
          <h2 className="lp-stats-heading" style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontWeight: 500,
            fontSize: 48,
            letterSpacing: "-2px",
            lineHeight: "1.2em",
            color: "#111827",
            margin: "0 0 20px 0",
          }}>
            Platform AI adalah <em>search engine</em> baru.
          </h2>
          <p className="lp-stats-subtitle" style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 20,
            letterSpacing: "-0.5px",
            lineHeight: "1.7em",
            color: "#6B7280",
            margin: 0,
          }}>
            Bangun visibilitas brand Anda di mata AI dengan <em>Answer Engine Optimization</em> (AEO) <em>tool</em> Nuave.
          </p>
        </div>

        {/* Top divider — full width */}
        <div style={{ height: 1, background: "#E5E7EB" }} />

        {/* Stats grid — max-width 1044px, centered */}
        <div className="lp-stats-grid-inner" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          maxWidth: 1044,
          margin: "0 auto",
        }}>
          {STATS.map((stat, i) => (
            <div key={i} className="lp-stat-item" style={{
              padding: "48px 40px",
              borderLeft: i === 0 ? "1px solid #E5E7EB" : "none",
              borderRight: "1px solid #E5E7EB",
            }}>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 40,
                letterSpacing: "-1px",
                lineHeight: "1.4em",
                color: "#111827",
                margin: "0 0 8px 0",
              }}>
                {stat.number}
              </p>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: 24,
                letterSpacing: "-0.5px",
                lineHeight: "1.4em",
                color: "#111827",
                margin: "0 0 12px 0",
              }}>
                {stat.title}
              </p>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: 16,
                lineHeight: "1.7em",
                color: "#6B7280",
                margin: 0,
              }}>
                {stat.body}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom divider — full width */}
        <div style={{ height: 1, background: "#E5E7EB" }} />

      </section>

      {/* ──── Pricing ──── */}
      <section id="harga" className="lp-pricing-section" style={{ background: "#ffffff", padding: "72px 32px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>

          {/* Title + subtitle */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontWeight: 500,
              fontSize: 48,
              lineHeight: "58px",
              color: "#111827",
              margin: "0 0 16px 0",
            }}>
              Harga
            </h2>
            <p style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: 16,
              lineHeight: "1.6em",
              color: "#6B7280",
              margin: 0,
            }}>
              Nuave menggunakan sistem kredit yang lebih fleksibel dari sistem langganan.
            </p>
          </div>

          {/* Cards */}
          <div className="lp-pricing-grid-inner" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {PRICING.map((pkg) => (
              <div key={pkg.name} style={{
                position: "relative",
                padding: 32,
                borderRadius: 16,
                background: "#ffffff",
                border: "1px solid #E5E7EB",
                display: "flex",
                flexDirection: "column",
              }}>
                {/* Badge */}
                {pkg.badge && (
                  <div style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "#6C3FF5",
                    color: "#ffffff",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: 13,
                    padding: "5px 14px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}>
                    {pkg.badge}
                  </div>
                )}

                {/* Plan name */}
                <p style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#111827",
                  margin: "0 0 8px 0",
                }}>
                  {pkg.name}
                </p>

                {/* Description */}
                <p style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  color: "#6B7280",
                  margin: "0 0 24px 0",
                }}>
                  {pkg.desc}
                </p>

                {/* Price */}
                <p style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: 60,
                  letterSpacing: "-2px",
                  lineHeight: "72px",
                  color: "#111827",
                  margin: "0 0 24px 0",
                }}>
                  {pkg.price}
                </p>

                {/* Credits */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 32,
                }}>
                  <IconCoins size={18} stroke={1.5} color="#6B7280" />
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    fontSize: 16,
                    lineHeight: "28px",
                    color: "#374151",
                  }}>
                    {pkg.credits} kredit
                  </span>
                </div>

                {/* Button */}
                <button
                  onClick={() => {
                    sessionStorage.setItem('nuave_pending_package', pkg.name.toLowerCase());
                    window.location.href = '/auth';
                  }}
                  className={pkg.highlight ? "btn-lp-purple" : undefined}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: 10,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: "pointer",
                    background: pkg.highlight ? undefined : "#ffffff",
                    color: pkg.highlight ? "#ffffff" : "#111827",
                    border: pkg.highlight ? "none" : "1px solid #E5E7EB",
                    marginTop: "auto",
                  }}
                >
                  Beli paket {pkg.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section id="faq" className="lp-faq-section" style={{ background: "#F9FAFB", padding: "72px 32px 80px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <h2 className="lp-faq-heading" style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontWeight: 500,
            fontSize: 36,
            letterSpacing: "-1px",
            lineHeight: "1.4em",
            color: "#111827",
            textAlign: "center",
            marginBottom: 48,
          }}>
            Frequently Asked Questions (FAQ)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                overflow: "hidden",
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    width: "100%",
                    padding: 24,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: 18,
                    letterSpacing: "-0.5px",
                    lineHeight: "1.7em",
                    color: "#111827",
                  }}>
                    {faq.q}
                  </span>
                  <IconChevronDown
                    size={20}
                    stroke={1.5}
                    color="#6B7280"
                    style={{
                      flexShrink: 0,
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  />
                </button>
                {/* Smooth expand/collapse via CSS grid trick */}
                <div style={{
                  display: "grid",
                  gridTemplateRows: openFaq === i ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.3s ease",
                }}>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 400,
                      fontSize: 16,
                      lineHeight: "1.6em",
                      color: "#6B7280",
                      margin: 0,
                      padding: "0 24px 24px",
                    }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Final CTA ──── */}
      <section className="lp-cta-section" style={{
        width: "100%",
        minHeight: 516,
        padding: "144px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundImage: "url('/bg-cta.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          textAlign: "center",
        }}>
          <h2 className="lp-cta-heading" style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontWeight: 500,
            fontSize: 60,
            letterSpacing: "-2px",
            lineHeight: "1.2em",
            color: "#0a0a0a",
            margin: 0,
            maxWidth: 720,
          }}>
            Siap menjadi jawaban pertama ChatGPT?
          </h2>
          <Link
            href="/auth"
            className="btn-lp-black"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "14px 28px",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              borderRadius: 8,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Audit brand Anda — Gratis
          </Link>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <Footer />
    </div>
  );
}
