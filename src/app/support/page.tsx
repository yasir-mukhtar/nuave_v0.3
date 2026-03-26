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
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white border-b border-border-default px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" className="block" />
          <span className="text-[18px] font-bold text-text-heading">Nuave</span>
        </Link>
      </header>

      {/* Hero */}
      <div className="bg-surface border-b border-border-default px-8 py-12">
        <div className="max-w-[800px] mx-auto">
          <div className="mb-5">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              className="inline-flex items-center gap-1.5 type-caption text-text-muted bg-transparent border-none p-0 cursor-pointer hover:text-text-body transition-colors"
            >
              <IconArrowLeft size={16} stroke={1.5} /> Kembali
            </button>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-[var(--purple-light)] border border-[#C4B5FD] rounded-full px-3 py-1 text-[12px] font-medium text-brand mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            Kami siap membantu
          </div>
          <h1 className="text-[32px] m-0 mb-2">
            Hubungi Kami
          </h1>
          <p className="type-body text-text-muted m-0 max-w-[520px]">
            Punya pertanyaan, ingin bermitra, atau ada keluhan? Isi formulir di bawah dan tim kami akan merespon dalam 1-2 hari kerja.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="px-8 py-12">

        <div className="max-w-[800px] mx-auto grid grid-cols-[1fr_280px] gap-12">

          {/* Form */}
          <div>
            {sent ? (
              <div className="text-center px-8 py-16 border border-border-default rounded-[var(--radius-lg)] bg-surface">
                <div className="w-14 h-14 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-4">
                  <IconCheck size={28} stroke={2} className="text-success" />
                </div>
                <h2 className="text-[20px] mb-2">
                  Pesan terkirim!
                </h2>
                <p className="type-body text-text-muted mb-6 leading-relaxed">
                  Pesan Anda telah terkirim. Kami akan merespon dalam 1–2 hari kerja.
                </p>
                <button
                  onClick={() => { setSent(false); setError(null); setName(""); setEmail(""); setCategory(""); setSubject(""); setMessage(""); }}
                  className="type-body font-medium text-brand bg-[var(--purple-light)] border border-[#C4B5FD] rounded-[var(--radius-md)] px-6 py-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Kirim pesan lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {/* Name & Email row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block type-caption font-medium text-text-heading mb-1.5">
                      Nama <span className="text-error">*</span>
                    </label>
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap Anda"
                      className="w-full px-3.5 py-2.5 type-body border border-border-default rounded-[var(--radius-md)] bg-white text-text-body outline-none box-border"
                    />
                  </div>
                  <div>
                    <label className="block type-caption font-medium text-text-heading mb-1.5">
                      Email <span className="text-error">*</span>
                    </label>
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@contoh.com"
                      className="w-full px-3.5 py-2.5 type-body border border-border-default rounded-[var(--radius-md)] bg-white text-text-body outline-none box-border"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block type-caption font-medium text-text-heading mb-1.5">
                    Kategori <span className="text-error">*</span>
                  </label>
                  <select
                    required value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 type-body border border-border-default rounded-[var(--radius-md)] bg-white outline-none cursor-pointer box-border appearance-none text-text-body"
                    style={{
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
                  <label className="block type-caption font-medium text-text-heading mb-1.5">
                    Subjek <span className="text-error">*</span>
                  </label>
                  <input
                    type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ringkasan singkat pesan Anda"
                    className="w-full px-3.5 py-2.5 type-body border border-border-default rounded-[var(--radius-md)] bg-white text-text-body outline-none box-border"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block type-caption font-medium text-text-heading mb-1.5">
                    Pesan <span className="text-error">*</span>
                  </label>
                  <textarea
                    required value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Jelaskan secara detail pertanyaan atau masalah Anda..."
                    rows={6}
                    className="w-full px-3.5 py-2.5 type-body border border-border-default rounded-[var(--radius-md)] bg-white text-text-body outline-none resize-y box-border font-[inherit] leading-relaxed"
                  />
                </div>

                {error && (
                  <p className="type-caption text-error m-0">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit" disabled={sending}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 type-body font-semibold text-white bg-brand border-none rounded-[var(--radius-md)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {sending ? "Mengirim..." : (
                    <>Kirim Pesan <IconSend size={16} stroke={1.5} /></>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <div className="flex flex-col gap-5">

            {/* Quick response + social card */}
            <div className="border border-border-default rounded-[var(--radius-lg)] p-5 bg-surface">
              <h3 className="type-body font-semibold mb-2">
                Butuh Respon Cepat?
              </h3>
              <p className="type-caption text-text-muted m-0 mb-3 leading-relaxed">
                Hubungi kami melalui:
              </p>
              <div className="flex flex-col gap-2">
                <a href="https://instagram.com/nuave.ai" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 type-body text-brand no-underline hover:opacity-80 transition-opacity">
                  <IconBrandInstagram size={18} stroke={1.5} /> @nuave.ai
                </a>
                <a href="https://x.com/nuaveAI" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 type-body text-brand no-underline hover:opacity-80 transition-opacity">
                  <IconBrandX size={18} stroke={1.5} /> @nuaveAI
                </a>
              </div>
            </div>

            {/* Email card */}
            <div className="border border-border-default rounded-[var(--radius-lg)] p-5 bg-surface">
              <h3 className="type-body font-semibold mb-3">
                Email Langsung
              </h3>
              <a href="mailto:hello.nuave@gmail.com" className="type-body text-brand no-underline break-all hover:opacity-80 transition-opacity">
                hello.nuave@gmail.com
              </a>
              <p className="type-caption text-text-muted mt-2 leading-relaxed">
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
