"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Footer from "@/components/Footer";
import {
  type PlanId,
  PLAN_HIERARCHY,
  getPlanLimits,
  getPlanPricing,
} from "@/lib/plan-limits";
import { getPlanLabel } from "@/lib/plan-gate-client";

type Tier = {
  id: PlanId;
  description: string;
  cta: string;
  popular: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    id: "starter",
    description: "Pantau visibilitas AI brand Anda setiap hari dan dapatkan rekomendasi.",
    cta: "Pilih Starter",
    popular: false,
    features: [
      "1 brand, 10 prompt",
      "Audit otomatis bulanan",
      "Monitoring harian",
      "3 kompetitor dengan data lengkap",
      "Rekomendasi lengkap",
      "Tren skor visibilitas",
      "1 konten/bulan",
      "Ekspor PDF",
    ],
  },
  {
    id: "growth",
    description: "Kelola beberapa brand dan bandingkan tren dengan kompetitor.",
    cta: "Pilih Growth",
    popular: true,
    features: [
      "3 brand, 30 prompt/brand",
      "Audit otomatis bulanan",
      "Monitoring harian",
      "10 kompetitor/brand",
      "Rekomendasi lengkap",
      "Tren skor + perbandingan kompetitor",
      "10 konten/bulan",
      "Ekspor PDF",
    ],
  },
  {
    id: "agency",
    description: "Untuk agensi yang mengelola banyak brand klien.",
    cta: "Hubungi kami",
    popular: false,
    features: [
      "20 brand, 50 prompt/brand",
      "Audit otomatis + manual (1×/hari)",
      "Monitoring harian",
      "Semua kompetitor (tanpa batas)",
      "Rekomendasi lengkap",
      "Tren skor + perbandingan kompetitor",
      "Konten tanpa batas",
      "PDF white-label",
      "Dukungan prioritas",
    ],
  },
];

const FEATURE_COMPARISON: {
  label: string;
  values: Record<PlanId, string | boolean>;
}[] = [
  { label: "Merek", values: { free: "1", starter: "1", growth: "3", agency: "20" } },
  { label: "Prompt per brand", values: { free: "10", starter: "10", growth: "30", agency: "50" } },
  { label: "Audit otomatis bulanan", values: { free: false, starter: true, growth: true, agency: true } },
  { label: "Monitoring harian", values: { free: false, starter: true, growth: true, agency: true } },
  { label: "Audit manual", values: { free: false, starter: false, growth: false, agency: "1×/hari" } },
  { label: "Kompetitor dilacak", values: { free: "0", starter: "3", growth: "10", agency: "Tanpa batas" } },
  { label: "Data & tren kompetitor", values: { free: false, starter: true, growth: true, agency: true } },
  { label: "Perbandingan tren kompetitor", values: { free: false, starter: false, growth: true, agency: true } },
  { label: "Rekomendasi", values: { free: false, starter: true, growth: true, agency: true } },
  { label: "Konten per bulan", values: { free: "0", starter: "1", growth: "10", agency: "Tanpa batas" } },
  { label: "Ekspor PDF", values: { free: false, starter: true, growth: true, agency: true } },
  { label: "PDF white-label", values: { free: false, starter: false, growth: false, agency: true } },
  { label: "Dukungan prioritas", values: { free: false, starter: false, growth: false, agency: true } },
];

const FAQS = [
  {
    q: "Apa bedanya audit bulanan dan monitoring harian?",
    a: "Audit bulanan menjalankan semua prompt Anda secara lengkap dan menghasilkan analisis masalah + rekomendasi. Monitoring harian memantau skor visibilitas tanpa analisis mendalam — seperti mengecek suhu tubuh setiap hari.",
  },
  {
    q: "Apakah saya bisa upgrade atau downgrade kapan saja?",
    a: "Ya. Upgrade langsung aktif dengan perhitungan prorata. Downgrade berlaku di akhir periode billing yang sedang berjalan.",
  },
  {
    q: "Apa yang terjadi dengan data saya jika saya downgrade?",
    a: "Data Anda tetap aman. Merek dan prompt yang melebihi batas paket baru akan dibekukan (tidak dihapus) — Anda dapat mengaksesnya kembali setelah upgrade.",
  },
  {
    q: "Metode pembayaran apa yang tersedia?",
    a: "Transfer bank (BCA, BNI, BRI, Mandiri), GoPay, OVO, QRIS, Indomaret, Alfamart, dan kartu kredit/debit — semua melalui Midtrans.",
  },
  {
    q: "Apakah ada refund?",
    a: "Paket bulanan: akses berlanjut hingga akhir periode, tidak ada refund. Paket tahunan: refund prorata untuk bulan yang belum digunakan. Pembatalan dalam 48 jam pertama mendapat refund penuh.",
  },
  {
    q: "Apakah hemat 20% tahunan benar-benar sepadan?",
    a: "Ya — jika Anda berencana menggunakan Nuave lebih dari 3 bulan. AEO adalah permainan jangka panjang, hasilnya terlihat dalam 2-3 bulan. Paket tahunan memastikan monitoring konsisten.",
  },
];

function formatPriceNumber(amount: number): string {
  if (amount === 0) return "0";
  return amount.toLocaleString("id-ID");
}

export default function HargaPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (user) {
        // Fetch current plan to determine upgrade vs new subscription
        fetch('/api/billing/status')
          .then(r => r.json())
          .then(data => { if (data.plan) setCurrentPlan(data.plan); })
          .catch(() => {});
      }
    });
  }, []);

  async function handleSubscribe(planId: PlanId) {
    if (!isLoggedIn) {
      // Not logged in — send to auth, then back to pricing
      router.push(`/auth?next=/harga`);
      return;
    }

    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }

    if (planId === 'agency') {
      router.push('/support');
      return;
    }

    setSubscribing(true);
    try {
      // Use change-plan for users already on a paid plan (handles proration)
      // Use create-subscription for free → paid
      const isPlanChange = currentPlan !== null && currentPlan !== 'free';
      const endpoint = isPlanChange
        ? '/api/billing/change-plan'
        : '/api/billing/create-subscription';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, cycle: isAnnual ? 'annual' : 'monthly' }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal membuat langganan');
        return;
      }

      // Redirect to Midtrans Snap payment page
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else if (data.action === 'upgraded_free') {
        // Prorated credit covered the full cost — no payment needed
        router.push('/settings?tab=langganan');
      } else if (data.action === 'downgrade_scheduled') {
        alert(data.message);
        router.push('/settings?tab=langganan');
      }
    } catch {
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-[8px] border-b border-border-default px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" className="block" />
          <span className="text-[18px] font-bold text-text-heading">Nuave</span>
        </Link>
      </header>

      {/* Back button */}
      <section className="bg-surface border-b border-border-default px-8 py-12">
        <div className="max-w-[800px] mx-auto">
          <button
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/");
            }}
            className="inline-flex items-center gap-1.5 type-caption text-text-muted bg-transparent border-none p-0 cursor-pointer hover:text-text-body transition-colors"
          >
            <IconArrowLeft size={16} stroke={1.5} /> Kembali
          </button>
        </div>
      </section>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-10">
        <div className="inline-flex items-center gap-1.5 bg-[var(--purple-light)] border border-[#C4B5FD] rounded-full px-3.5 py-1 text-[12px] font-medium text-brand mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          Langganan bulanan atau tahunan
        </div>
        <h1 className="text-[40px] m-0 mb-4 leading-[1.2]">
          Pilih paket yang<br />sesuai kebutuhan Anda
        </h1>
        <p className="type-body text-text-muted max-w-[520px] mx-auto mb-8 leading-relaxed">
          Mulai dengan audit brand Anda, gratis.
        </p>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className={cn("type-body font-medium", !isAnnual ? "text-text-heading" : "text-text-muted")}>
            Bulanan
          </span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
          <span className={cn("type-body font-medium", isAnnual ? "text-text-heading" : "text-text-muted")}>
            Tahunan
          </span>
          <span className="bg-[#DCFCE7] text-success text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            HEMAT 20%
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-[1120px] mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-5">
          {TIERS.map((tier) => {
            const pricing = getPlanPricing(tier.id);
            const price = isAnnual ? pricing.annual : pricing.monthly;
            const isPopular = tier.popular;
            const isActive = isLoggedIn && currentPlan === tier.id;

            return (
              <div
                key={tier.id}
                className="relative rounded-[6px] px-6 py-7 flex flex-col bg-white border border-border-default shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-brand text-[11px] font-bold tracking-[0.05em] px-3.5 py-1 rounded-full border border-border-default shadow-[0_1px_4px_rgba(0,0,0,0.08)] whitespace-nowrap">
                    PALING POPULER
                  </div>
                )}

                <p className="text-[13px] font-semibold m-0 mb-2 uppercase tracking-[0.05em] text-text-muted">
                  {getPlanLabel(tier.id)}
                </p>

                <div className="mb-1">
                  <span className="text-[20px] font-bold text-text-heading">Rp</span>
                  <span className="text-[32px] font-bold text-text-heading ml-1">
                    {formatPriceNumber(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-[13px] ml-1 text-text-muted">
                      /bulan
                    </span>
                  )}
                </div>

                {isAnnual && price > 0 && (
                  <p className="text-[12px] m-0 mb-4 text-text-placeholder">
                    Ditagih Rp {(price * 12).toLocaleString("id-ID")}/tahun
                  </p>
                )}
                {(!isAnnual || price === 0) && <div className="mb-4" />}

                <p className="text-[13px] m-0 mb-6 leading-relaxed min-h-[40px] text-text-body">
                  {tier.description}
                </p>

                <div className="mt-auto mb-7">
                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={subscribing || isActive}
                    className={cn(
                      "block w-full text-center px-6 py-3 rounded-[6px] type-body font-semibold cursor-pointer transition-opacity",
                      isActive
                        ? "bg-[#F3F4F6] text-[#9CA3AF] border border-border-default cursor-not-allowed"
                        : isPopular
                          ? "bg-brand text-white border border-brand hover:opacity-90"
                          : "bg-white text-text-heading border border-[#D1D5DB] hover:border-[#9CA3AF] hover:opacity-90"
                    )}
                  >
                    {isActive
                      ? "Paket saat ini"
                      : subscribing
                        ? "Memproses..."
                        : `${tier.cta} →`}
                  </button>
                </div>

                <div className="border-t border-border-default pt-5 flex-1">
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 mb-2.5">
                      <IconCheck
                        size={16}
                        stroke={2.5}
                        className="shrink-0 mt-0.5 text-success"
                      />
                      <span className="text-[13px] leading-snug text-text-body">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-surface border-t border-b border-border-default px-6 py-16">
        <div className="max-w-[900px] mx-auto">
          <h2 className="text-center mb-2">Perbandingan fitur</h2>
          <p className="type-body text-text-muted text-center mb-8">
            Detail lengkap setiap paket.
          </p>
          <div className="border border-border-default rounded-[var(--radius-lg)] overflow-hidden bg-white">
            <table className="w-full border-collapse type-body">
              <thead>
                <tr className="bg-surface">
                  <th className="text-left px-5 py-3.5 text-text-body font-semibold border-b border-border-default w-[240px]">
                    Fitur
                  </th>
                  {PLAN_HIERARCHY.filter((p) => p !== "free").map((planId) => (
                    <th
                      key={planId}
                      className="text-center px-4 py-3.5 text-text-body font-semibold border-b border-border-default"
                    >
                      {getPlanLabel(planId)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row, i) => (
                  <tr
                    key={i}
                    className={cn(i < FEATURE_COMPARISON.length - 1 && "border-b border-border-default")}
                  >
                    <td className="px-5 py-3 text-text-heading font-medium">{row.label}</td>
                    {PLAN_HIERARCHY.map((planId) => {
                      const val = row.values[planId];
                      return (
                        <td key={planId} className="px-4 py-3 text-center">
                          {val === true ? (
                            <IconCheck size={16} stroke={2.5} className="text-success mx-auto" />
                          ) : val === false ? (
                            <IconX size={16} stroke={2} className="text-text-placeholder mx-auto" />
                          ) : (
                            <span className="type-body font-medium text-text-heading">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-[640px] mx-auto">
          <h2 className="mb-2">Metode pembayaran</h2>
          <p className="type-body text-text-muted mb-8">
            Pembayaran diproses secara aman melalui Midtrans.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {["Transfer Bank (VA)", "GoPay", "OVO", "QRIS", "Indomaret", "Alfamart", "Kartu Kredit / Debit"].map((method) => (
              <span key={method} className="bg-surface border border-border-default rounded-[var(--radius-md)] px-4 py-2 type-caption font-medium text-text-body">
                {method}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface border-t border-border-default px-6 py-16">
        <div className="max-w-[640px] mx-auto">
          <h2 className="text-center mb-10">Pertanyaan yang sering ditanya</h2>
          <div className="flex flex-col gap-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-border-default rounded-[var(--radius-lg)] px-6 py-5">
                <p className="type-body font-semibold text-text-heading m-0 mb-2">{faq.q}</p>
                <p className="type-body text-text-body m-0 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-[560px] mx-auto">
          <h2 className="text-[28px] mb-3">
            Mulai audit AI pertama Anda — gratis
          </h2>
          <p className="type-body text-text-muted mb-7">
            Daftar sekarang dan jalankan audit lengkap pertama tanpa biaya.
          </p>
          <Link
            href="/auth"
            className="inline-block bg-brand text-white type-body font-semibold no-underline px-8 py-3.5 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
          >
            Coba gratis sekarang →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
