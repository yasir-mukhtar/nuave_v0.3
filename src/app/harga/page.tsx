"use client";
import Link from "next/link";
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
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>

      {/* Navbar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border-default)",
        padding: "0 32px", height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <div style={{ width: "10px", height: "10px", background: "var(--purple)", borderRadius: "3px" }} />
          <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-heading)" }}>Nuave</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/auth" style={{ fontSize: "14px", color: "var(--text-body)", textDecoration: "none", padding: "8px 16px" }}>
            Log in
          </Link>
          <Link href="/" style={{
            fontSize: "14px", fontWeight: 500, color: "#ffffff",
            background: "var(--purple)", textDecoration: "none",
            padding: "8px 20px", borderRadius: "8px",
          }}>
            Mulai gratis →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "64px 24px 48px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "var(--purple-light)", border: "1px solid #C4B5FD",
          borderRadius: "999px", padding: "4px 14px",
          fontSize: "12px", fontWeight: 500, color: "var(--purple)", marginBottom: "24px",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--purple)" }} />
          Bayar sekali, pakai kapan saja
        </div>
        <h1 style={{ fontSize: "40px", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 16px 0", lineHeight: 1.2 }}>
          Harga yang sederhana,<br />tanpa langganan
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 8px", lineHeight: 1.6 }}>
          Beli kredit saat butuh. Mulai gratis dengan 10 kredit — cukup untuk 1 audit lengkap.
        </p>
      </section>

      {/* Pricing Cards */}
      <section style={{ maxWidth: "1040px", margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} style={{
              position: "relative",
              background: pkg.popular ? "var(--purple)" : "#ffffff",
              border: `1px solid ${pkg.popular ? "var(--purple)" : "var(--border-default)"}`,
              borderRadius: "16px",
              padding: "32px 28px",
              boxShadow: pkg.popular ? "0 8px 32px rgba(108,63,245,0.25)" : "0 1px 2px rgba(0,0,0,0.05)",
              transform: pkg.popular ? "scale(1.03)" : "none",
            }}>
              {pkg.popular && (
                <div style={{
                  position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                  background: "#ffffff", color: "var(--purple)",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                  padding: "4px 14px", borderRadius: "999px",
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  whiteSpace: "nowrap",
                }}>
                  ⭐ PALING POPULER
                </div>
              )}

              <p style={{ fontSize: "13px", fontWeight: 600, color: pkg.popular ? "rgba(255,255,255,0.7)" : "var(--text-muted)", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {pkg.name}
              </p>
              <p style={{ fontSize: "32px", fontWeight: 700, color: pkg.popular ? "#ffffff" : "var(--text-heading)", margin: "0 0 4px 0" }}>
                {pkg.price}
              </p>
              <p style={{ fontSize: "13px", color: pkg.popular ? "rgba(255,255,255,0.6)" : "var(--text-muted)", margin: "0 0 20px 0" }}>
                {pkg.credits} kredit
              </p>
              <p style={{ fontSize: "13px", color: pkg.popular ? "rgba(255,255,255,0.8)" : "var(--text-body)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
                {pkg.description}
              </p>

              <button
                onClick={() => {
                  sessionStorage.setItem('nuave_pending_package', pkg.id);
                  window.location.href = '/auth';
                }}
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  padding: "12px 24px", borderRadius: "8px",
                  fontSize: "14px", fontWeight: 600,
                  background: pkg.popular ? "#ffffff" : "var(--purple)",
                  color: pkg.popular ? "var(--purple)" : "#ffffff",
                  border: "none", cursor: "pointer",
                  marginBottom: "28px",
                }}
              >
                Beli {pkg.name} →
              </button>

              <div style={{ borderTop: `1px solid ${pkg.popular ? "rgba(255,255,255,0.2)" : "var(--border-default)"}`, paddingTop: "24px" }}>
                {pkg.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ color: pkg.popular ? "rgba(255,255,255,0.9)" : "#22C55E", fontWeight: 700, fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>✓</span>
                    <span style={{ fontSize: "13px", color: pkg.popular ? "rgba(255,255,255,0.85)" : "var(--text-body)", lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Free trial note */}
        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "32px" }}>
          Belum yakin?{" "}
          <Link href="/" style={{ color: "var(--purple)", fontWeight: 500, textDecoration: "none" }}>
            Mulai dengan 10 kredit gratis →
          </Link>
          {" "}Tidak perlu kartu kredit.
        </p>
      </section>

      {/* Credit Usage Table */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border-default)", borderBottom: "1px solid var(--border-default)", padding: "64px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)", textAlign: "center", marginBottom: "8px" }}>
            Berapa kredit yang dibutuhkan?
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", marginBottom: "32px" }}>
            Setiap tindakan menggunakan kredit sesuai tabel berikut.
          </p>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: "12px", overflow: "hidden", background: "#ffffff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  <th style={{ textAlign: "left", padding: "14px 20px", color: "var(--text-body)", fontWeight: 600, borderBottom: "1px solid var(--border-default)" }}>Tindakan</th>
                  <th style={{ textAlign: "right", padding: "14px 20px", color: "var(--text-body)", fontWeight: 600, borderBottom: "1px solid var(--border-default)" }}>Kredit</th>
                </tr>
              </thead>
              <tbody>
                {CREDIT_USAGE.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < CREDIT_USAGE.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                    <td style={{ padding: "14px 20px", color: "var(--text-heading)", fontWeight: 500 }}>{row.action}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span style={{
                        background: row.credits === "Gratis" ? "#DCFCE7" : "var(--purple-light)",
                        color: row.credits === "Gratis" ? "#16A34A" : "var(--purple)",
                        fontSize: "12px", fontWeight: 600,
                        padding: "3px 10px", borderRadius: "999px",
                      }}>
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
      <section style={{ padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)", marginBottom: "8px" }}>
            Metode pembayaran
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "32px" }}>
            Pembayaran diproses secara aman melalui Midtrans.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            {["Transfer Bank (VA)", "GoPay", "OVO", "QRIS", "Indomaret", "Alfamart", "Kartu Kredit / Debit"].map((method) => (
              <span key={method} style={{
                background: "var(--surface)", border: "1px solid var(--border-default)",
                borderRadius: "8px", padding: "8px 16px",
                fontSize: "13px", fontWeight: 500, color: "var(--text-body)",
              }}>
                {method}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border-default)", padding: "64px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)", textAlign: "center", marginBottom: "40px" }}>
            Pertanyaan yang sering ditanya
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1px solid var(--border-default)", borderRadius: "12px", padding: "20px 24px" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", margin: "0 0 8px 0" }}>{faq.q}</p>
                <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-heading)", marginBottom: "12px" }}>
            Mulai audit AI pertama Anda — gratis
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "28px" }}>
            Daftar sekarang dan dapatkan 10 kredit gratis. Tidak perlu kartu kredit.
          </p>
          <Link href="/" style={{
            display: "inline-block",
            background: "var(--purple)", color: "#ffffff",
            fontSize: "15px", fontWeight: 600, textDecoration: "none",
            padding: "14px 32px", borderRadius: "10px",
          }}>
            Coba gratis sekarang →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
