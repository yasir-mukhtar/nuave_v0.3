"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";

const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    price: "Rp 75.000",
    credits: 50,
    popular: false,
    description: "Cocok untuk bisnis yang ingin mencoba AEO pertama kali.",
    features: [
      "50 kredit",
      "5× audit lengkap (10 prompt)",
      "Analisis kompetitor",
      "Rekomendasi konten web (×50)",
      "Laporan PDF gratis",
      "Kredit tidak kadaluarsa",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "Rp 199.000",
    credits: 150,
    popular: true,
    description: "Untuk bisnis yang aktif membangun visibilitas AI mereka.",
    features: [
      "150 kredit",
      "15× audit lengkap (10 prompt)",
      "Analisis kompetitor",
      "Rekomendasi konten web (×150)",
      "Generate artikel blog (×75)",
      "Laporan PDF gratis",
      "Kredit tidak kadaluarsa",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "Rp 599.000",
    credits: 500,
    popular: false,
    description: "Untuk agensi yang mengelola banyak merek klien sekaligus.",
    features: [
      "500 kredit",
      "50× audit lengkap (10 prompt)",
      "Analisis kompetitor",
      "Rekomendasi konten web (×500)",
      "Generate artikel blog (×250)",
      "Laporan PDF gratis",
      "Kredit tidak kadaluarsa",
      "Cocok untuk 5–20 klien",
    ],
  },
];

const CREDIT_USAGE = [
  { action: "Jalankan audit (10 prompt)", credits: "10 kredit" },
  { action: "Tambah 10 prompt ke audit", credits: "10 kredit" },
  { action: "Rekomendasi konten web", credits: "1 kredit" },
  { action: "Generate artikel blog", credits: "2 kredit" },
  { action: "Re-analisis website", credits: "3 kredit" },
  { action: "Ekspor laporan PDF", credits: "Gratis" },
];

const FAQS = [
  {
    q: "Apa itu kredit?",
    a: "Kredit adalah satuan yang digunakan untuk mengakses fitur Nuave. Setiap tindakan seperti menjalankan audit atau membuat artikel blog menggunakan sejumlah kredit. Pengguna baru mendapat 10 kredit gratis saat mendaftar.",
  },
  {
    q: "Apakah kredit saya kadaluarsa?",
    a: "Tidak. Kredit yang Anda beli tidak memiliki masa kadaluarsa selama akun Anda aktif. Gunakan sesuai kebutuhan bisnis Anda.",
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    a: "Kami menerima transfer bank virtual account (BCA, BNI, BRI, Mandiri), GoPay, OVO, QRIS, Indomaret, dan Alfamart — semua melalui Midtrans.",
  },
  {
    q: "Apakah ada biaya langganan bulanan?",
    a: "Tidak. Nuave menggunakan model bayar-per-penggunaan berbasis kredit. Anda hanya membayar saat membutuhkan, tanpa komitmen bulanan.",
  },
  {
    q: "Bagaimana jika kredit saya habis?",
    a: "Anda dapat membeli kredit tambahan kapan saja dari halaman dashboard. Tidak ada penalti atau biaya tambahan.",
  },
  {
    q: "Apakah tersedia refund?",
    a: "Refund hanya diproses untuk kasus teknis seperti kredit tidak masuk setelah pembayaran berhasil, atau duplikasi transaksi. Lihat Syarat & Ketentuan kami untuk detail lengkap.",
  },
];

export default function HargaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-[8px] border-b border-border-default px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" className="block" />
          <span className="text-[18px] font-bold text-text-heading">Nuave</span>
        </Link>
      </header>

      {/* Hero */}
      <section className="bg-surface border-b border-border-default px-8 py-12">
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
        </div>
      </section>

      <section className="text-center px-6 pt-16 pb-12">
        <div className="inline-flex items-center gap-1.5 bg-[var(--purple-light)] border border-[#C4B5FD] rounded-full px-3.5 py-1 text-[12px] font-medium text-brand mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          Bayar sekali, pakai kapan saja
        </div>
        <h1 className="text-[40px] m-0 mb-4 leading-[1.2]">
          Harga yang sederhana,<br />tanpa langganan
        </h1>
        <p className="type-body text-text-muted max-w-[480px] mx-auto mb-2 leading-relaxed">
          Beli kredit saat butuh. Mulai gratis dengan 10 kredit — cukup untuk 1 audit lengkap.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-[1040px] mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className={cn(
              "relative rounded-[var(--radius-xl)] px-7 py-8",
              pkg.popular
                ? "bg-brand border border-brand shadow-[0_8px_32px_rgba(108,63,245,0.25)] scale-[1.03]"
                : "bg-white border border-border-default shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            )}>
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-brand text-[11px] font-bold tracking-[0.05em] px-3.5 py-1 rounded-full border border-border-default shadow-[0_1px_4px_rgba(0,0,0,0.08)] whitespace-nowrap">
                  ⭐ PALING POPULER
                </div>
              )}

              <p className={cn(
                "text-[13px] font-semibold m-0 mb-2 uppercase tracking-[0.05em]",
                pkg.popular ? "text-white/70" : "text-text-muted"
              )}>
                {pkg.name}
              </p>
              <p className={cn(
                "text-[32px] font-bold m-0 mb-1",
                pkg.popular ? "text-white" : "text-text-heading"
              )}>
                {pkg.price}
              </p>
              <p className={cn(
                "text-[13px] m-0 mb-5",
                pkg.popular ? "text-white/60" : "text-text-muted"
              )}>
                {pkg.credits} kredit
              </p>
              <p className={cn(
                "text-[13px] m-0 mb-6 leading-relaxed",
                pkg.popular ? "text-white/80" : "text-text-body"
              )}>
                {pkg.description}
              </p>

              <button
                onClick={() => {
                  sessionStorage.setItem('nuave_pending_package', pkg.id);
                  window.location.href = '/auth';
                }}
                className={cn(
                  "block w-full text-center px-6 py-3 rounded-[var(--radius-md)] type-body font-semibold border-none cursor-pointer mb-7 hover:opacity-90 transition-opacity",
                  pkg.popular ? "bg-white text-brand" : "bg-brand text-white"
                )}
              >
                Beli {pkg.name} →
              </button>

              <div className={cn(
                "border-t pt-6",
                pkg.popular ? "border-white/20" : "border-border-default"
              )}>
                {pkg.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-2.5">
                    <span className={cn(
                      "font-bold text-[14px] shrink-0 mt-px",
                      pkg.popular ? "text-white/90" : "text-success"
                    )}>✓</span>
                    <span className={cn(
                      "text-[13px] leading-snug",
                      pkg.popular ? "text-white/85" : "text-text-body"
                    )}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Free trial note */}
        <p className="text-center type-caption text-text-muted mt-8">
          Belum yakin?{" "}
          <Link href="/" className="text-brand font-medium no-underline hover:opacity-80 transition-opacity">
            Mulai dengan 10 kredit gratis →
          </Link>
          {" "}Tidak perlu kartu kredit.
        </p>
      </section>

      {/* Credit Usage Table */}
      <section className="bg-surface border-t border-b border-border-default px-6 py-16">
        <div className="max-w-[640px] mx-auto">
          <h2 className="text-center mb-2">
            Berapa kredit yang dibutuhkan?
          </h2>
          <p className="type-body text-text-muted text-center mb-8">
            Setiap tindakan menggunakan kredit sesuai tabel berikut.
          </p>
          <div className="border border-border-default rounded-[var(--radius-lg)] overflow-hidden bg-white">
            <table className="w-full border-collapse type-body">
              <thead>
                <tr className="bg-surface">
                  <th className="text-left px-5 py-3.5 text-text-body font-semibold border-b border-border-default">Tindakan</th>
                  <th className="text-right px-5 py-3.5 text-text-body font-semibold border-b border-border-default">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {CREDIT_USAGE.map((row, i) => (
                  <tr key={i} className={cn(i < CREDIT_USAGE.length - 1 && "border-b border-border-default")}>
                    <td className="px-5 py-3.5 text-text-heading font-medium">{row.action}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn(
                        "text-[12px] font-semibold px-2.5 py-[3px] rounded-full",
                        row.credits === "Gratis"
                          ? "bg-[#DCFCE7] text-success"
                          : "bg-[var(--purple-light)] text-brand"
                      )}>
                        {row.credits}
                      </span>
                    </td>
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
          <h2 className="mb-2">
            Metode pembayaran
          </h2>
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
          <h2 className="text-center mb-10">
            Pertanyaan yang sering ditanya
          </h2>
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
            Daftar sekarang dan dapatkan 10 kredit gratis. Tidak perlu kartu kredit.
          </p>
          <Link href="/" className="inline-block bg-brand text-white type-body font-semibold no-underline px-8 py-3.5 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
            Coba gratis sekarang →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
