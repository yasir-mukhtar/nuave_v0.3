"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconSend, IconCheck, IconBrandInstagram, IconBrandX, IconArrowLeft } from "@tabler/icons-react";
import Footer from "@/components/Footer";

const CATEGORIES = [
  { value: "general", label: "Pertanyaan Umum" },
  { value: "partnership", label: "Kemitraan / Partnership" },
  { value: "complaint", label: "Keluhan / Komplain" },
  { value: "billing", label: "Pembayaran & Kredit" },
  { value: "bug", label: "Laporan Bug" },
  { value: "feature", label: "Saran Fitur" },
  { value: "privacy", label: "Privasi & Data" },
  { value: "other", label: "Lainnya" },
];

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category;
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category: categoryLabel, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim pesan.");
        return;
      }

      setSent(true);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#ffffff", borderBottom: "1px solid var(--border-default)",
        padding: "0 32px", height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" style={{ display: "block" }} />
            <span style={{ fontWeight: 700, fontSize: "18px", color: "#111827" }}>Nuave</span>
          </div>
        </Link>
      </header>

      {/* Hero */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-default)", padding: "48px 32px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "13px", color: "var(--text-muted)", background: "none",
                border: "none", padding: 0, cursor: "pointer",
              }}
            >
              <IconArrowLeft size={16} stroke={1.5} /> Kembali
            </button>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "var(--purple-light)", border: "1px solid #C4B5FD",
            borderRadius: "999px", padding: "4px 12px",
            fontSize: "12px", fontWeight: 500, color: "var(--purple)", marginBottom: "16px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--purple)" }} />
            Kami siap membantu
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 8px 0" }}>
            Hubungi Kami
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: 0, maxWidth: "520px" }}>
            Punya pertanyaan, ingin bermitra, atau ada keluhan? Isi formulir di bawah dan tim kami akan merespon dalam 1-2 hari kerja.
          </p>
        </div>
      </div>

      {/* Content */}
      <main style={{ padding: "48px 32px" }}>

        <div style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 280px", gap: "48px" }}>

          {/* Form */}
          <div>
            {sent ? (
              <div style={{
                textAlign: "center", padding: "64px 32px",
                border: "1px solid var(--border-default)", borderRadius: "12px",
                background: "var(--surface)",
              }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <IconCheck size={28} stroke={2} color="#22C55E" />
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-heading)", marginBottom: "8px" }}>
                  Pesan terkirim!
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
                  Pesan Anda telah terkirim. Kami akan merespon dalam 1–2 hari kerja.
                </p>
                <button
                  onClick={() => { setSent(false); setError(null); setName(""); setEmail(""); setCategory(""); setSubject(""); setMessage(""); }}
                  style={{
                    fontSize: "14px", fontWeight: 500, color: "var(--purple)",
                    background: "var(--purple-light)", border: "1px solid #C4B5FD",
                    borderRadius: "8px", padding: "10px 24px", cursor: "pointer",
                  }}
                >
                  Kirim pesan lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Name & Email row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-heading)", marginBottom: "6px" }}>
                      Nama <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap Anda"
                      style={{
                        width: "100%", padding: "10px 14px", fontSize: "14px",
                        border: "1px solid var(--border-default)", borderRadius: "8px",
                        background: "#ffffff", color: "var(--text-body)",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-heading)", marginBottom: "6px" }}>
                      Email <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@contoh.com"
                      style={{
                        width: "100%", padding: "10px 14px", fontSize: "14px",
                        border: "1px solid var(--border-default)", borderRadius: "8px",
                        background: "#ffffff", color: "var(--text-body)",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-heading)", marginBottom: "6px" }}>
                    Kategori <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    required value={category} onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px", fontSize: "14px",
                      border: "1px solid var(--border-default)", borderRadius: "8px",
                      background: "#ffffff", color: category ? "var(--text-body)" : "var(--text-muted)",
                      outline: "none", cursor: "pointer", boxSizing: "border-box",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px 12px",
                    }}
                  >
                    <option value="" disabled>Pilih kategori</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-heading)", marginBottom: "6px" }}>
                    Subjek <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ringkasan singkat pesan Anda"
                    style={{
                      width: "100%", padding: "10px 14px", fontSize: "14px",
                      border: "1px solid var(--border-default)", borderRadius: "8px",
                      background: "#ffffff", color: "var(--text-body)",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-heading)", marginBottom: "6px" }}>
                    Pesan <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <textarea
                    required value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Jelaskan secara detail pertanyaan atau masalah Anda..."
                    rows={6}
                    style={{
                      width: "100%", padding: "10px 14px", fontSize: "14px",
                      border: "1px solid var(--border-default)", borderRadius: "8px",
                      background: "#ffffff", color: "var(--text-body)",
                      outline: "none", resize: "vertical", boxSizing: "border-box",
                      fontFamily: "inherit", lineHeight: 1.6,
                    }}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: "13px", color: "#EF4444", margin: 0 }}>{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit" disabled={sending}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    width: "100%", padding: "12px 24px", fontSize: "14px", fontWeight: 600,
                    color: "#ffffff", background: "#6C3FF5", border: "none", borderRadius: "8px",
                    cursor: sending ? "not-allowed" : "pointer",
                    opacity: sending ? 0.7 : 1,
                  }}
                >
                  {sending ? "Mengirim..." : (
                    <>Kirim Pesan <IconSend size={16} stroke={1.5} /></>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Quick response + social card */}
            <div style={{
              border: "1px solid var(--border-default)", borderRadius: "12px",
              padding: "20px", background: "var(--surface)",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "8px" }}>
                Butuh Respon Cepat?
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: 1.5 }}>
                Hubungi kami melalui:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a href="https://instagram.com/nuave.ai" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--purple)", textDecoration: "none" }}>
                  <IconBrandInstagram size={18} stroke={1.5} /> @nuave.ai
                </a>
                <a href="https://x.com/nuaveAI" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--purple)", textDecoration: "none" }}>
                  <IconBrandX size={18} stroke={1.5} /> @nuaveAI
                </a>
              </div>
            </div>

            {/* Email card */}
            <div style={{
              border: "1px solid var(--border-default)", borderRadius: "12px",
              padding: "20px", background: "var(--surface)",
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "12px" }}>
                Email Langsung
              </h3>
              <a href="mailto:hello.nuave@gmail.com" style={{
                fontSize: "14px", color: "var(--purple)", textDecoration: "none", wordBreak: "break-all",
              }}>
                hello.nuave@gmail.com
              </a>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 }}>
                Untuk pertanyaan umum dan dukungan teknis.
              </p>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
