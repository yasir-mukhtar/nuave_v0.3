"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { IconChevronDown, IconCoins } from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";

/* ───── Data ───── */

const STATS = [
  {
    number: "5x",
    title: "Konversi Lebih Tinggi",
    body: "Traffic dari pencarian lewat AI rata-rata menghasilkan konversi 14,2% dibanding 2,8% pencarian lewat Google search.",
  },
  {
    number: "67%",
    title: "CLV Lebih Tinggi",
    body: "Pelanggan yang datang dari pencarian lewat AI membeli hingga 67% lebih banyak dalam jangka panjang.",
  },
  {
    number: "73%",
    title: "Pembelian di Kunjungan Pertama",
    body: "73% pengunjung yang datang dari pencarian AI langsung membeli pada kunjungan pertama.",
  },
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
    q: "Apa itu Nuave?",
    a: "Nuave adalah platform AEO (Answer Engine Optimization) yang mengukur seberapa sering AI seperti ChatGPT menyebut brand Anda saat pengguna bertanya tentang kategori bisnis Anda. Anda mendapat skor visibilitas 0–100 beserta rekomendasi konten untuk meningkatkannya.",
  },
  {
    q: "Apa itu AEO?",
    a: "AEO atau Answer Engine Optimization adalah strategi agar brand Anda disebut oleh AI seperti ChatGPT, Perplexity, dan Gemini saat menjawab pertanyaan pengguna. Berbeda dari SEO yang fokus ke ranking Google, AEO fokus ke \"apakah AI tahu dan merekomendasikan bisnis Anda?\"",
  },
  {
    q: "Apa bedanya AEO dengan SEO?",
    a: "SEO membantu website Anda muncul di Google. AEO membuat brand Anda disebut oleh AI. Keduanya penting, tapi semakin banyak orang yang langsung tanya ke ChatGPT tanpa buka Google sama sekali.",
  },
  {
    q: "Kenapa saya perlu tahu apakah AI menyebut brand saya?",
    a: "Karena jutaan orang sekarang tanya ke AI: \"Software akuntansi terbaik untuk restoran kecil apa?\". Kalau brand Anda tidak disebut, Anda tidak ada di benak calon pelanggan itu. Padahal mereka sedang siap membeli.",
  },
  {
    q: "Bagaimana cara kerja Nuave?",
    a: "Anda masukkan nama brand dan URL website. Nuave akan otomatis menganalisis website Anda, membuat 10 pertanyaan yang relevan dengan bisnis Anda, lalu mengirimnya ke GPT-4o untuk melihat apakah brand Anda disebut. Hasilnya keluar dalam hitungan menit.",
  },
  {
    q: "Berapa biayanya?",
    a: "Nuave pakai sistem kredit, bukan langganan bulanan. Daftar gratis dan langsung dapat 10 kredit — cukup untuk satu audit penuh. Paket tambahan mulai dari Rp 75.000.",
  },
  {
    q: "AI mana saja yang dianalisis Nuave?",
    a: "Saat ini Nuave mensimulasikan hasil dari GPT-4o (ChatGPT). Dukungan untuk Perplexity, Gemini, Meta AI, dan model lainnya akan menyusul.",
  },
  {
    q: "Apakah saya perlu keahlian teknis?",
    a: "Tidak sama sekali. Cukup masukkan nama brand dan URL website Anda, sisanya Nuave yang urus.",
  },
  {
    q: "Apakah saya harus punya website untuk menggunakan Nuave?",
    a: "Ya. Nuave membutuhkan URL website untuk menganalisis konten bisnis Anda secara otomatis.",
  },
  {
    q: "Saya belum punya website — apakah Nuave tetap berguna untuk saya?",
    a: "Bisa, tapi hasilnya hampir pasti rendah. Tanpa website, AI tidak punya sumber informasi yang jelas sehingga brand Anda sulit dikenali atau dipercaya.",
  },
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
  return (
    <button
      onClick={() => scrollToSection(sectionId)}
      className="bg-transparent border-none p-0 cursor-pointer text-[14px] font-medium leading-[24px] text-[var(--lp-text-primary)] hover:text-brand transition-colors duration-150"
    >
      {label}
    </button>
  );
}

/* ───── Nav (Framer design) ───── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src={LOGO_SVG} alt="Nuave logo" width={28} height={28} className="object-contain" />
            <span className="text-[20px] font-semibold text-[#0d0d0d]">Nuave</span>
          </Link>

          {/* Links (desktop) */}
          <div className="lp-nav-links flex items-center gap-8">
            <NavAnchor label="Cara Kerja" sectionId="cara-kerja" />
            <NavAnchor label="Harga" sectionId="harga" />
            <NavAnchor label="FAQ" sectionId="faq" />
            <a
              href="/support"
              className="flex items-center gap-1 text-[14px] font-medium leading-[24px] text-[var(--lp-text-primary)] no-underline hover:text-brand transition-colors duration-150"
            >
              Kontak
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-px">
                <path d="M3.5 2.5H9.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Masuk / Dashboard button (desktop) */}
          <Link
            href={isLoggedIn ? "/dashboard" : "/auth"}
            className="btn-lp-black lp-nav-masuk flex items-center justify-center px-5 py-2 text-white text-[14px] font-medium leading-[1.7em] rounded-[6px] no-underline cursor-pointer"
          >
            {isLoggedIn ? "Dashboard" : "Masuk"}
          </Link>

          {/* Hamburger button (mobile) */}
          <button
            className="lp-nav-hamburger hidden bg-transparent border-none cursor-pointer p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
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
        className="lp-mobile-menu-overlay fixed inset-0 z-[99] bg-black/20"
        style={{
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
        className="lp-mobile-menu fixed left-4 right-4 z-[101] bg-white rounded-[12px] border border-[rgba(117,115,114,0.15)] shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-2 flex flex-col items-center"
        style={{
          top: 92,
          opacity: mobileMenuOpen ? 1 : 0,
          transform: mobileMenuOpen ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.97)",
          pointerEvents: mobileMenuOpen ? "auto" : "none",
          transition: "opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <button
          onClick={() => { scrollToSection("cara-kerja"); setMobileMenuOpen(false); }}
          className="bg-transparent border-none cursor-pointer text-center px-5 py-3.5 text-[16px] font-medium w-full text-[var(--lp-text-primary)]"
        >
          Cara Kerja
        </button>
        <button
          onClick={() => { scrollToSection("harga"); setMobileMenuOpen(false); }}
          className="bg-transparent border-none cursor-pointer text-center px-5 py-3.5 text-[16px] font-medium w-full text-[var(--lp-text-primary)]"
        >
          Harga
        </button>
        <button
          onClick={() => { scrollToSection("faq"); setMobileMenuOpen(false); }}
          className="bg-transparent border-none cursor-pointer text-center px-5 py-3.5 text-[16px] font-medium w-full text-[var(--lp-text-primary)]"
        >
          FAQ
        </button>
        <a
          href="/support"
          onClick={() => setMobileMenuOpen(false)}
          className="px-5 py-3.5 text-[16px] font-medium text-[var(--lp-text-primary)] no-underline text-center block w-full"
        >
          Kontak
        </a>
        <div className="h-px bg-[#E5E7EB] mx-4 self-stretch" />
        <div className="px-4 py-3 w-full box-border">
          <Link
            href={isLoggedIn ? "/dashboard" : "/auth"}
            onClick={() => setMobileMenuOpen(false)}
            className="btn-lp-black flex items-center justify-center px-5 py-3 text-white text-[15px] font-medium rounded-[8px] no-underline cursor-pointer w-full"
          >
            {isLoggedIn ? "Dashboard" : "Masuk"}
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
    <section className="lp-root lp-hero-section relative w-full pt-[120px] px-[30px] flex justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full flex flex-col items-center">
        {/* Text content */}
        <div className="flex flex-col items-center gap-6">
          {/* Headline */}
          <h1 className="lp-hero-heading max-w-[800px] text-center m-0">
            Lihat seberapa sering ChatGPT menyebut brand Anda
          </h1>

          {/* Subtitle */}
          <p className="lp-hero-subtitle max-w-[740px] text-[18px] font-normal leading-[1.7em] tracking-[-0.5px] text-[var(--lp-text-secondary)] text-center m-0">
            Jutaan orang kini melakukan pencarian lewat AI. Nuave melacak brand Anda dalam jawaban ChatGPT dan memberi rekomendasi perbaikan.
          </p>

          {/* CTA Button */}
          <Link
            href="/auth"
            className="btn-lp-purple inline-flex items-center px-[22px] py-3 text-white text-[14px] font-medium leading-[1.7em] rounded-[6px] border border-[var(--lp-border)] no-underline cursor-pointer"
          >
            Audit brand Anda — Gratis!
          </Link>
        </div>

        {/* Preview area */}
        <div className="lp-hero-preview mt-16 w-full relative">
          {/* Purple gradient background */}
          <div className="relative w-full aspect-[1.82094] rounded-[12px] border border-[var(--lp-border)] overflow-hidden">
            <img
              src={BG_GRADIENT}
              alt=""
              className="w-full h-full object-cover object-center block"
            />

            {/* Overlay content */}
            <div className="absolute inset-0 flex flex-col items-center pt-10 px-10 gap-6">
              {/* Stepper bar */}
              <div className="flex items-center gap-0 px-3.5 py-2 bg-white rounded-[10px] border border-[var(--lp-border)] shadow-[rgba(0,0,0,0.04)_0px_1px_4px_0px] h-[43px]">
                {HERO_STEPS.map((step, i) => (
                  <button
                    key={step}
                    onClick={() => handleStepClick(i)}
                    className="flex items-center gap-3.5 pr-3.5 bg-transparent border-none cursor-pointer text-[16px] font-medium leading-[1.7em] whitespace-nowrap"
                    style={{ color: activeStep === i ? "var(--lp-text-primary)" : "var(--lp-text-secondary)" }}
                  >
                    {/* Fixed 20px indicator box */}
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      {activeStep === i ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="10" fill="#0a0a0a" />
                          <text
                            x="10" y="10"
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
                        <div className="w-2 h-2 rounded-full bg-[var(--lp-border)]" />
                      )}
                    </div>
                    {step}
                  </button>
                ))}
              </div>

              {/* Dashboard mockup card */}
              <div className="w-full max-w-[900px] h-[504px] p-4 backdrop-blur-[54px] bg-white/[0.54] rounded-[12px] shadow-[rgba(0,0,0,0.08)_0px_8px_32px_0px] overflow-hidden relative">
                {DASHBOARD_IMAGES.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt="Dashboard"
                    className="object-cover object-top rounded-[6px]"
                    style={{
                      position: i === 0 ? "relative" : "absolute",
                      top: i === 0 ? 0 : 16,
                      left: i === 0 ? 0 : 16,
                      width: i === 0 ? "100%" : "calc(100% - 32px)",
                      height: i === 0 ? "100%" : "calc(100% - 32px)",
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
    <div className="lp-page min-h-screen bg-white">

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
      <section className="lp-marquee-section w-full pt-[120px] pb-24 flex flex-col items-center gap-8 overflow-hidden">
        <p className="lp-marquee-text text-[18px] font-normal leading-[1.5em] text-[#0A0A0A] text-center m-0 px-[30px]">
          Dikembangkan untuk pencarian berbasis AI — sekarang dan di masa depan
        </p>

        {/* Marquee track */}
        <div
          className="w-full max-w-[1045px] mx-auto overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div
            className="flex items-center gap-24 w-max"
            style={{ animation: "marquee-scroll 60s linear infinite" }}
          >
            {[...AI_LOGOS, ...AI_LOGOS, ...AI_LOGOS, ...AI_LOGOS].map((logo, i) => (
              <img
                key={`${logo.alt}-${i}`}
                src={logo.src}
                alt={logo.alt}
                className="block shrink-0 h-7 w-auto"
              />
            ))}
          </div>
        </div>
      </section>
      </div>{/* end Framer hero+marquee wrapper */}

      {/* ──── Problem Section ──── */}
      <section className="lp-problem-section bg-white px-8 py-[120px]">
        <div className="max-w-[1044px] mx-auto">

          {/* Heading */}
          <h2 className="lp-problem-heading text-center m-0 mb-14">
            Apakah brand Anda muncul di ChatGPT?
          </h2>

          {/* Two cards */}
          <div className="lp-problem-grid grid grid-cols-2 gap-6">
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
              <div
                key={card.number}
                className="lp-problem-card relative rounded-[12px] border border-[#E5E7EB] overflow-hidden flex flex-col justify-between min-h-[480px] bg-cover bg-center"
                style={{ backgroundImage: `url('${card.bg}')` }}
              >
                {/* Top content */}
                <div className="pt-10 px-10">
                  <p className="text-[48px] font-medium tracking-[-2px] leading-[1.2em] text-[#111827] m-0 mb-5">
                    {card.number}
                  </p>
                  <p className="text-[22px] font-medium tracking-[-0.5px] leading-[1.4em] text-[#111827] m-0 max-w-[340px]">
                    {card.desc}
                  </p>
                </div>

                {/* Bottom chips */}
                <div className="pt-[120px] px-10 pb-10 flex flex-col gap-2.5">
                  {card.chips.map((chip) => (
                    <span key={chip} className="inline-block self-start text-[16px] font-normal text-[#111827] bg-white/85 border border-black/[0.08] rounded-full px-4 py-2 backdrop-blur-[4px]">
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
      <section className="lp-stats-section bg-[#F9FAFB] pt-[120px] pb-[120px]">

        {/* Heading + subtitle */}
        <div className="px-8 text-center mb-6">
          <h2 className="lp-stats-heading m-0 mb-5">
            Jadi yang Pertama Ditemukan<br className="lp-stats-br" />di Era <em>Answer Engine</em>
          </h2>
          <p className="lp-stats-subtitle text-[20px] font-normal tracking-[-0.5px] leading-[1.7em] text-[#6B7280] m-0">
            Nuave membantu brand Anda ditemukan, dipercaya,<br className="lp-stats-br" />dan langsung dipilih di pencarian AI.
          </p>
        </div>

        {/* Top divider */}
        <div className="h-px bg-[#E5E7EB]" />

        {/* Stats grid */}
        <div className="lp-stats-grid-inner grid grid-cols-3 max-w-[1044px] mx-auto">
          {STATS.map((stat, i) => (
            <div key={i} className={cn("lp-stat-item px-10 py-12 border-r border-[#E5E7EB]", i === 0 && "border-l border-[#E5E7EB]")}>
              <p className="text-[40px] font-semibold tracking-[-1px] leading-[1.4em] text-[#111827] m-0 mb-2">
                {stat.number}
              </p>
              <p className="text-[24px] font-medium tracking-[-0.5px] leading-[1.4em] text-[#111827] m-0 mb-3">
                {stat.title}
              </p>
              <p className="text-[16px] font-normal leading-[1.7em] text-[#6B7280] m-0">
                {stat.body}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom divider */}
        <div className="h-px bg-[#E5E7EB]" />

        {/* Source reference */}
        <p className="text-center mt-6 text-[13px] text-[#9CA3AF]">
          Sumber:{" "}
          <a
            href="https://mybrandi.ai/referrals-from-ai-vs-google/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9CA3AF] underline"
          >
            MyBrandi.ai
          </a>
          ,{" "}
          <a
            href="https://superprompt.com/blog/ai-search-traffic-conversion-rates-5x-higher-than-google-2025-data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9CA3AF] underline"
          >
            Superprompt
          </a>
        </p>

      </section>

      {/* ──── Pricing ──── */}
      <section id="harga" className="lp-pricing-section bg-white px-8 py-[72px]">
        <div className="max-w-[740px] mx-auto">

          {/* Title + subtitle */}
          <div className="text-center mb-14">
            <h2 className="lp-pricing-heading m-0 mb-4">
              Harga
            </h2>
            <p className="text-[16px] font-normal leading-[1.6em] text-[#6B7280] m-0">
              Nuave menggunakan sistem kredit yang lebih fleksibel dari sistem langganan.
            </p>
          </div>

          {/* Cards */}
          <div className="lp-pricing-grid-inner grid grid-cols-2 gap-6">
            {PRICING.map((pkg) => (
              <div key={pkg.name} className="relative p-8 rounded-[12px] bg-white border border-[#E5E7EB] flex flex-col">
                {/* Badge */}
                {pkg.badge && (
                  <div className="absolute top-4 right-4 bg-brand text-white text-[13px] font-medium px-3.5 py-[5px] rounded-full whitespace-nowrap">
                    {pkg.badge}
                  </div>
                )}

                {/* Plan name */}
                <p className="text-[20px] font-semibold text-[#111827] m-0 mb-2">
                  {pkg.name}
                </p>

                {/* Description */}
                <p className="text-[14px] font-normal text-[#6B7280] m-0 mb-6">
                  {pkg.desc}
                </p>

                {/* Price */}
                <p className="text-[60px] font-medium tracking-[-2px] leading-[72px] text-[#111827] m-0 mb-6">
                  {pkg.price}
                </p>

                {/* Credits */}
                <div className="flex items-center gap-2 mb-8">
                  <IconCoins size={18} stroke={1.5} className="text-[#6B7280]" />
                  <span className="text-[16px] font-normal leading-[28px] text-[#374151]">
                    {pkg.credits} kredit
                  </span>
                </div>

                {/* Button */}
                <button
                  onClick={() => {
                    sessionStorage.setItem('nuave_pending_package', pkg.name.toLowerCase());
                    window.location.href = '/auth';
                  }}
                  className={cn(
                    "block w-full py-3.5 px-6 rounded-[8px] text-[14px] font-medium cursor-pointer mt-auto",
                    pkg.highlight
                      ? "btn-lp-purple text-white border-none"
                      : "bg-white text-[#111827] border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors"
                  )}
                >
                  Beli paket {pkg.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section id="faq" className="lp-faq-section bg-[#F9FAFB] px-8 pt-[72px] pb-20">
        <div className="max-w-[740px] mx-auto">
          <h2 className="lp-faq-heading text-center mb-12">
            Frequently Asked Questions (FAQ)
          </h2>
          <div className="flex flex-col gap-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between gap-4 w-full p-6 bg-transparent border-none cursor-pointer text-left"
                >
                  <span className="text-[18px] font-semibold tracking-[-0.5px] leading-[1.7em] text-[#111827]">
                    {faq.q}
                  </span>
                  <IconChevronDown
                    size={20}
                    stroke={1.5}
                    className="shrink-0 text-[#6B7280] transition-transform duration-300"
                    style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {/* Smooth expand/collapse via CSS grid trick */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: openFaq === i ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="text-[16px] font-normal leading-[1.6em] text-[#6B7280] m-0 px-6 pb-6">
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
      <section
        className="lp-cta-section w-full min-h-[516px] px-8 py-[144px] flex items-center justify-center relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-cta.png')" }}
      >
        <div className="flex flex-col items-center gap-10 text-center">
          <h2 className="lp-cta-heading m-0 max-w-[720px]">
            Siap menjadi jawaban pertama ChatGPT?
          </h2>
          <Link
            href="/auth"
            className="btn-lp-black inline-flex items-center px-7 py-3.5 text-white text-[14px] font-medium rounded-[8px] no-underline cursor-pointer"
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
