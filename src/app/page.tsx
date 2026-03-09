"use client";

import { useEffect, useState } from "react";
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

/* ───── Component ───── */

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

      {/* ──── Nav ──── */}
      <header className="lp-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "56px",
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border-default)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 100,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" style={{ display: 'block' }} />
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#6C3FF5", textTransform: "lowercase" as const }}>nuave</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isLoggedIn ? (
            <Link href="/dashboard" style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "14px", fontWeight: 500, color: "#ffffff",
              background: "#6C3FF5", textDecoration: "none",
              padding: "8px 20px", borderRadius: "8px",
            }}>
              Dashboard <IconArrowRight size={16} stroke={2} />
            </Link>
          ) : (
            <>
              <Link href="/auth" className="lp-nav-cta-text" style={{ fontSize: "14px", color: "var(--text-body)", textDecoration: "none", padding: "8px 16px" }}>
                Masuk
              </Link>
              <Link href="/auth" onClick={() => {
                sessionStorage.removeItem('nuave_pending_brand');
                sessionStorage.removeItem('nuave_pending_url');
              }} style={{
                fontSize: "14px", fontWeight: 500, color: "#ffffff",
                background: "#6C3FF5", textDecoration: "none",
                padding: "8px 20px", borderRadius: "8px",
                whiteSpace: "nowrap",
              }}>
                Mulai Gratis
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ──── Hero ──── */}
      <section style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #F5F0FF 0%, #EDE9FF 25%, #F0EAFF 50%, #E8E0FF 75%, #F5F0FF 100%)",
      }}>
        {/* Abstract wavy background SVGs */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} preserveAspectRatio="none" viewBox="0 0 1440 800">
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C3FF5" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#C084FC" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.06" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#6C3FF5" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="wave3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6C3FF5" stopOpacity="0.06" />
              <stop offset="40%" stopColor="#3B82F6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {/* Large flowing wave — back */}
          <path d="M0 400 C200 250, 400 550, 720 350 S1200 500, 1440 300 L1440 800 L0 800Z" fill="url(#wave1)" />
          {/* Mid wave */}
          <path d="M0 500 C180 380, 360 620, 600 450 S900 600, 1100 420 C1250 350, 1350 500, 1440 440 L1440 800 L0 800Z" fill="url(#wave2)" />
          {/* Front wave */}
          <path d="M0 600 C240 520, 480 700, 720 580 S1080 700, 1440 560 L1440 800 L0 800Z" fill="url(#wave3)" />
          {/* Subtle top wave */}
          <path d="M0 100 C300 180, 500 50, 800 130 S1200 60, 1440 120 L1440 0 L0 0Z" fill="url(#wave1)" />
        </svg>

        {/* Gradient orbs */}
        <div style={{
          position: "absolute", top: "-120px", right: "-80px", width: "500px", height: "500px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(108,63,245,0.12) 0%, rgba(167,139,250,0.06) 40%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", left: "-100px", width: "400px", height: "400px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)",
          filter: "blur(50px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "50%", width: "300px", height: "300px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(108,63,245,0.04) 50%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none", transform: "translateX(-50%)",
        }} />

        {/* Content */}
        <div className="lp-hero-grid">
          {/* Left column */}
          <div>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em",
              color: "#111827", margin: "0 0 20px 0",
            }}>
              Buat brand Anda muncul di setiap jawaban AI — bukan hanya di Google.
            </h1>
            <p style={{
              fontSize: "16px", color: "#4B5563", lineHeight: 1.7, margin: "0 0 32px 0", maxWidth: "480px",
            }}>
              Lihat bagaimana ChatGPT melihat brand Anda, bandingkan dengan kompetitor, dan dapatkan rekomendasi yang langsung berdampak.
            </p>

            {/* Form */}
            <div id="audit-form" style={{
              display: "flex", flexDirection: "column", gap: "12px",
              maxWidth: "420px", width: "100%",
              background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
              padding: "24px", borderRadius: "16px",
              border: "1px solid rgba(108,63,245,0.1)",
              boxShadow: "0 4px 24px rgba(108,63,245,0.06)",
            }}>
              <div className="form-field">
                <label>Nama Brand</label>
                <input className="input-large" type="text" placeholder="misal: Nuave"
                  value={brandName} onChange={(e) => setBrandName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>URL Website</label>
                <input className="input-large" type="url" placeholder="misal: https://nuave.ai"
                  value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
              </div>
              {error && <p style={{ fontSize: "13px", color: "#e53e3e", margin: 0 }}>{error}</p>}
              <button type="button" onClick={() => handleSubmit(brandName, websiteUrl, setLoading)} disabled={loading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  width: "100%", fontSize: "15px", fontWeight: 600, color: "#ffffff",
                  background: "linear-gradient(135deg, #6C3FF5, #8B5CF6)", border: "none", borderRadius: "8px",
                  padding: "14px", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 4px 16px rgba(108,63,245,0.3)",
                }}>
                {loading ? "Menganalisis…" : <>Cek Visibilitas AI Anda <IconArrowRight size={18} stroke={1.5} /></>}
              </button>
            </div>

            {/* Trust strip */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
              {["Gratis", "60 detik", "Tanpa kartu kredit"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6B7280" }}>
                  <IconCheck size={16} stroke={2} color="#6C3FF5" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right column — mockup */}
          <div className="lp-hero-mockup" style={{
            background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(108,63,245,0.1)", borderRadius: "16px",
            padding: "32px", display: "flex", flexDirection: "column", gap: "24px",
            boxShadow: "0 8px 32px rgba(108,63,245,0.08)",
          }}>
            {/* Score gauge */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "120px", height: "120px", borderRadius: "50%", margin: "0 auto 12px",
                background: `conic-gradient(#EF4444 0deg ${35 * 3.6}deg, #E5E7EB ${35 * 3.6}deg 360deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: "96px", height: "96px", borderRadius: "50%", background: "rgba(255,255,255,0.9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column",
                }}>
                  <span style={{ fontSize: "32px", fontWeight: 700, color: "#EF4444" }}>35</span>
                </div>
              </div>
              <span style={{
                display: "inline-block", background: "#FEE2E2", color: "#DC2626",
                fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "999px",
              }}>
                Visibilitas Rendah
              </span>
              <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "8px" }}>
                2 dari 10 prompt menyebut brand Anda
              </p>
            </div>

            {/* Prompt rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {MOCK_PROMPTS.slice(0, 4).map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", background: "rgba(255,255,255,0.8)", borderRadius: "8px",
                  border: "1px solid rgba(229,231,235,0.8)", fontSize: "13px",
                }}>
                  {p.mentioned ? (
                    <IconCheck size={16} stroke={2.5} color="#22C55E" style={{ flexShrink: 0 }} />
                  ) : (
                    <IconX size={16} stroke={2.5} color="#EF4444" style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ color: "#374151" }}>{p.prompt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom wave divider */}
        <svg style={{ display: "block", width: "100%", height: "60px", position: "relative", zIndex: 1 }} preserveAspectRatio="none" viewBox="0 0 1440 60">
          <path d="M0 0 C360 50, 720 60, 1080 30 S1440 50, 1440 0 L1440 60 L0 60Z" fill="#ffffff" />
        </svg>
      </section>

      {/* ──── Stats ──── */}
      <section className="lp-section" style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div className="lp-stats-grid">
          {STATS.map((s, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "24px 16px",
              background: "#ffffff", borderRadius: "12px", border: "1px solid #E5E7EB",
            }}>
              <div style={{ fontSize: "36px", fontWeight: 700, color: "#6C3FF5", marginBottom: "8px" }}>{s.value}</div>
              <div style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", marginTop: "20px" }}>
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
            padding: "32px", borderRadius: "16px", border: "1px solid #E5E7EB",
            background: "#F9FAFB", opacity: 0.75,
          }}>
            <div style={{
              fontSize: "12px", fontWeight: 600, color: "#9CA3AF",
              textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "20px",
            }}>
              Sebelum
            </div>
            {["Riset keyword", "10 blue links di Google", "Traffic stabil dari SEO", "Fokus ranking halaman", "Click-Through Rate (CTR)"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", fontSize: "14px", color: "#6B7280" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D1D5DB", flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>

          {/* After */}
          <div style={{
            padding: "32px", borderRadius: "16px",
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
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", fontSize: "14px", color: "#111827", fontWeight: 500 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6C3FF5", flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Callout */}
        <div style={{
          marginTop: "32px", padding: "20px 24px", borderRadius: "12px",
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
      <section className="lp-section" style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
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
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>{s.desc}</p>
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
        <p style={{ fontSize: "16px", color: "#6B7280", textAlign: "center", marginBottom: "48px" }}>
          Fitur lengkap untuk mengukur dan meningkatkan visibilitas brand di AI.
        </p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: "28px", borderRadius: "12px",
              border: "1px solid #E5E7EB", background: "#ffffff",
            }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "16px",
              }}>
                <f.icon size={20} stroke={1.5} color="#6C3FF5" />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>{f.title}</h3>
              <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>{f.desc}</p>
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
          <p style={{ fontSize: "16px", color: "#6B7280", textAlign: "center", marginBottom: "48px" }}>
            Laporan detail dengan skor, analisis prompt, dan rekomendasi.
          </p>

          {/* Mockup card */}
          <div style={{
            background: "#ffffff", borderRadius: "16px", border: "1px solid #E5E7EB",
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
                fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "999px",
              }}>
                Visibilitas Rendah
              </span>
              <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
                2 dari 10 prompt menyebut brand Anda
              </p>
            </div>

            {/* Prompt rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {MOCK_PROMPTS.map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 16px", borderRadius: "8px",
                  border: "1px solid #E5E7EB", fontSize: "14px",
                  background: p.mentioned ? "#F0FDF4" : "#ffffff",
                }}>
                  {p.mentioned ? (
                    <IconCheck size={16} stroke={2.5} color="#22C55E" style={{ flexShrink: 0 }} />
                  ) : (
                    <IconX size={16} stroke={2.5} color="#EF4444" style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ color: "#374151", flex: 1 }}>{p.prompt}</span>
                  <span className="lp-score-badge-text" style={{
                    fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
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
                background: "#6C3FF5", border: "none", borderRadius: "8px",
                padding: "14px 28px", cursor: "pointer",
              }}
            >
              Cek skor brand Anda sekarang <IconArrowRight size={18} stroke={1.5} />
            </button>
          </div>
        </div>
      </section>

      {/* ──── Pricing ──── */}
      <section className="lp-section" style={{ maxWidth: "960px", margin: "0 auto" }}>
        <h2 className="lp-section-heading" style={{ marginBottom: "12px" }}>
          Harga sederhana, tanpa langganan
        </h2>
        <p style={{ fontSize: "16px", color: "#6B7280", textAlign: "center", marginBottom: "48px" }}>
          1 audit = 10 kredit. Daftar gratis = 10 kredit = 1 audit lengkap.
        </p>
        <div className="lp-pricing-grid">
          {PRICING.map((pkg) => (
            <div key={pkg.name} style={{
              position: "relative",
              padding: "32px 28px", borderRadius: "16px",
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
                  padding: "4px 14px", borderRadius: "999px",
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
              <p style={{
                fontSize: "14px", margin: "0 0 24px 0",
                color: pkg.popular ? "rgba(255,255,255,0.6)" : "#6B7280",
              }}>
                {pkg.credits} kredit
              </p>
              <button
                onClick={() => {
                  sessionStorage.setItem('nuave_pending_package', pkg.name.toLowerCase());
                  window.location.href = '/auth';
                }}
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  padding: "12px 24px", borderRadius: "8px",
                  fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer",
                  background: pkg.popular ? "#ffffff" : "#6C3FF5",
                  color: pkg.popular ? "#6C3FF5" : "#ffffff",
                }}
              >
                Beli {pkg.name} →
              </button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: "13px", color: "#9CA3AF", marginTop: "24px" }}>
          Belum yakin?{" "}
          <Link href="/auth" style={{ color: "#6C3FF5", fontWeight: 500, textDecoration: "none" }}>
            Mulai dengan 10 kredit gratis →
          </Link>
        </p>
      </section>

      {/* ──── FAQ ──── */}
      <section className="lp-section" style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 className="lp-section-heading" style={{ marginBottom: "40px" }}>
            Pertanyaan yang sering ditanya
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "12px",
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
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{faq.q}</span>
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
                    <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
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
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "16px", lineHeight: 1.3 }}>
            Jangan biarkan brand Anda tidak terlihat di era AI.
          </h2>
          <p style={{ fontSize: "15px", color: "#6B7280", marginBottom: "32px" }}>
            Cek sekarang apakah ChatGPT menyebut brand Anda — gratis.
          </p>

          <div style={{
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
                background: "#6C3FF5", border: "none", borderRadius: "8px",
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
