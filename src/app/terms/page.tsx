"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import Footer from "@/components/Footer";

export default function TermsPage() {
  const router = useRouter();
  const LAST_UPDATED = "7 Maret 2026";
  const CONTACT_EMAIL = "hello@nuave.ai";

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" style={{ display: 'block' }} />
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>Nuave</span>
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
            Berlaku sejak 7 Maret 2026
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 8px 0" }}>
            Syarat & Ketentuan
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            Terakhir diperbarui: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 32px" }}>

        {/* Intro */}
        <p style={{ fontSize: "15px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "32px" }}>
          Layanan Nuave (<strong>"Layanan"</strong>) disediakan oleh Nuave (<strong>"kami"</strong>) dan ditawarkan kepada Anda dengan syarat penerimaan tanpa modifikasi atas semua ketentuan yang tercantum di sini. Dengan menggunakan Layanan ini, Anda menyetujui semua Syarat & Ketentuan ini.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 1 */}
        <SectionTitle n="1">Ketentuan Penggunaan</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "24px" }}>
          Nuave adalah platform SaaS (Software as a Service) untuk Answer Engine Optimization (AEO) yang membantu bisnis mengukur dan meningkatkan visibilitas merek mereka di hasil jawaban AI. Layanan ini ditawarkan kepada Anda dengan syarat penerimaan atas semua ketentuan, syarat, dan pemberitahuan yang terkandung di sini serta ketentuan tambahan yang berlaku untuk setiap bagian dari Layanan.
        </p>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7 }}>
          Jika Anda tidak menyetujui Syarat & Ketentuan ini, Anda harus segera menghentikan penggunaan Layanan.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 2 */}
        <SectionTitle n="2">Gambaran Umum Layanan</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "16px" }}>
          Nuave menyediakan layanan digital berupa:
        </p>
        {[
          "Audit visibilitas merek di platform AI (ChatGPT, Perplexity, dan lainnya)",
          "Analisis kompetitor berdasarkan respons AI",
          "Rekomendasi peningkatan konten web untuk optimasi AI",
          "Pembuatan artikel blog yang dioptimalkan untuk mesin jawaban AI",
          "Laporan visibilitas dalam format PDF",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
            <span style={{
              width: "22px", height: "22px", borderRadius: "50%",
              background: "var(--purple-light)", color: "var(--purple)",
              fontSize: "12px", fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{i + 1}</span>
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0, paddingTop: "2px" }}>{item}</p>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 3 */}
        <SectionTitle n="3">Sistem Kredit & Pembayaran</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "16px" }}>
          Nuave menggunakan sistem berbasis kredit. Pengguna baru menerima <strong>10 kredit gratis</strong> saat pendaftaran. Kredit tambahan dapat dibeli dalam paket berikut:
        </p>

        <div style={{ border: "1px solid var(--border-default)", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                {["Paket", "Kredit", "Harga (IDR)"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-body)", fontWeight: 600, borderBottom: "1px solid var(--border-default)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Starter", "50 kredit", "Rp 75.000"],
                ["Growth ⭐ Terpopuler", "150 kredit", "Rp 199.000"],
                ["Agency", "500 kredit", "Rp 599.000"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: i < 2 ? "1px solid var(--border-default)" : "none" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "12px 16px", color: j === 0 ? "var(--text-heading)" : "var(--text-body)", fontWeight: j === 0 ? 500 : 400 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "12px" }}>
          Penggunaan kredit per tindakan:
        </p>
        <div style={{ border: "1px solid var(--border-default)", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <tbody>
              {[
                ["Jalankan audit (10 prompt)", "10 kredit"],
                ["Tambah 10 prompt ke audit", "10 kredit"],
                ["Generate rekomendasi konten web", "1 kredit"],
                ["Generate artikel blog", "2 kredit"],
                ["Re-analisis konten website", "3 kredit"],
                ["Ekspor laporan PDF", "Gratis"],
              ].map((row, i, arr) => (
                <tr key={i} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                  <td style={{ padding: "12px 16px", color: "var(--text-heading)", fontWeight: 500, background: "var(--surface)", width: "65%" }}>{row[0]}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-body)" }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px", padding: "16px", marginBottom: "8px" }}>
          <p style={{ fontSize: "14px", color: "#92400E", margin: 0 }}>
            <strong>Penting:</strong> Kredit yang telah dibeli tidak dapat dikembalikan atau ditukar dengan uang tunai. Kredit tidak memiliki masa kadaluarsa selama akun Anda aktif.
          </p>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 4 - Refund */}
        <SectionTitle n="4">Kebijakan Pengembalian Dana</SectionTitle>

        <div style={{ background: "var(--purple-light)", border: "1px solid #C4B5FD", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", color: "#4C1D95", margin: 0, fontWeight: 500 }}>
            Nuave menjual produk digital (kredit layanan). Sesuai dengan sifat produk digital yang langsung dapat digunakan, berlaku ketentuan pengembalian dana berikut.
          </p>
        </div>

        <SubTitle>4.1 Pengembalian Dana yang Disetujui</SubTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "12px" }}>
          Pengembalian dana <strong>hanya</strong> dapat diproses dalam kondisi berikut:
        </p>
        {[
          "Pembayaran berhasil diproses tetapi kredit tidak ditambahkan ke akun Anda dalam 1×24 jam",
          "Terjadi duplikasi pembayaran untuk transaksi yang sama",
          "Terdapat kesalahan teknis dari sistem kami yang menyebabkan kredit terpotong tanpa layanan yang diberikan",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <span style={{ color: "#22C55E", fontWeight: 700, flexShrink: 0 }}>✓</span>
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>{item}</p>
          </div>
        ))}

        <SubTitle>4.2 Pengembalian Dana yang Tidak Disetujui</SubTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "12px" }}>
          Pengembalian dana <strong>tidak dapat</strong> diproses untuk:
        </p>
        {[
          "Kredit yang telah digunakan sebagian atau seluruhnya",
          "Ketidakpuasan terhadap hasil audit atau rekomendasi AI (hasil dipengaruhi oleh data merek yang dimasukkan pengguna)",
          "Perubahan kebutuhan bisnis setelah pembelian",
          "Lupa menggunakan kredit yang telah dibeli",
          "Pelanggaran Syarat & Ketentuan yang mengakibatkan penutupan akun",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <span style={{ color: "#EF4444", fontWeight: 700, flexShrink: 0 }}>✕</span>
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>{item}</p>
          </div>
        ))}

        <SubTitle>4.3 Proses Pengajuan Pengembalian Dana</SubTitle>
        {[
          ["Ajukan permintaan", `Kirim email ke ${CONTACT_EMAIL} dengan subjek "Refund Request - [Order ID]"`],
          ["Sertakan bukti", "Lampirkan bukti pembayaran dan deskripsi masalah yang dialami"],
          ["Proses verifikasi", "Tim kami akan memverifikasi dalam 3 hari kerja"],
          ["Pengembalian dana", "Jika disetujui, dana dikembalikan dalam 7-14 hari kerja melalui metode pembayaran asal"],
        ].map(([step, desc], i) => (
          <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <span style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "var(--purple-light)", color: "var(--purple)",
              fontSize: "13px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{i + 1}</span>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", margin: "0 0 2px 0" }}>{step}</p>
              <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 5 */}
        <SectionTitle n="5">Lisensi Penggunaan</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "12px" }}>
          Nuave memberikan Anda hak terbatas, non-eksklusif, tidak dapat dipindahtangankan untuk mengakses dan menggunakan Layanan semata-mata untuk keperluan bisnis internal Anda. Anda tidak boleh:
        </p>
        {[
          "Memodifikasi, mendekompilasi, atau melakukan rekayasa balik pada komponen Layanan",
          "Membuat karya turunan berdasarkan Layanan",
          "Mengizinkan pihak ketiga menggunakan atau mengakses Layanan dengan akun Anda",
          "Menggunakan Layanan untuk tujuan yang melanggar hukum yang berlaku di Indonesia",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "#EF4444", fontWeight: 700, flexShrink: 0 }}>✕</span>
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>{item}</p>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 6 */}
        <SectionTitle n="6">Hak Kekayaan Intelektual</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7 }}>
          Seluruh konten, desain, kode, merek dagang, dan materi lain yang tersedia melalui Layanan Nuave adalah milik Nuave dan dilindungi oleh hukum kekayaan intelektual Indonesia. Konten yang dihasilkan AI untuk akun Anda (rekomendasi, artikel blog, laporan audit) menjadi hak Anda untuk digunakan sesuai tujuan bisnis, namun tidak dapat dijual kembali sebagai produk serupa.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 7 */}
        <SectionTitle n="7">Kewajiban & Jaminan Pengguna</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "12px" }}>
          Dengan menggunakan Layanan, Anda menjamin bahwa:
        </p>
        {[
          "Anda berusia minimal 18 tahun atau mewakili entitas bisnis yang sah",
          "Informasi yang Anda berikan (nama merek, URL website) adalah akurat dan Anda memiliki hak atas merek tersebut",
          "Anda tidak akan menggunakan Layanan untuk mengaudit merek milik pihak lain tanpa izin",
          "Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "#22C55E", fontWeight: 700, flexShrink: 0 }}>✓</span>
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>{item}</p>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 8 */}
        <SectionTitle n="8">Penafian & Batasan Tanggung Jawab</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "12px" }}>
          Nuave menyediakan Layanan "sebagaimana adanya". Kami tidak memberikan jaminan bahwa:
        </p>
        {[
          "Hasil audit mencerminkan semua respons AI yang ada di internet (bergantung pada model AI yang digunakan)",
          "Rekomendasi yang diberikan akan secara otomatis meningkatkan visibilitas merek Anda",
          "Layanan akan selalu tersedia tanpa gangguan",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>•</span>
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>{item}</p>
          </div>
        ))}
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginTop: "12px" }}>
          Tanggung jawab maksimal Nuave kepada Anda tidak akan melebihi jumlah yang Anda bayarkan kepada kami dalam 30 hari terakhir.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 9 */}
        <SectionTitle n="9">Penangguhan & Penutupan Akun</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "12px" }}>
          Nuave berhak menangguhkan atau menutup akun Anda dengan segera jika:
        </p>
        {[
          "Anda melanggar Syarat & Ketentuan ini",
          "Kami menduga adanya aktivitas penipuan atau penyalahgunaan Layanan",
          "Anda menggunakan Layanan untuk tujuan yang melanggar hukum",
          "Akun tidak aktif lebih dari 12 bulan",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "#EF4444", flexShrink: 0 }}>•</span>
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>{item}</p>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 10 */}
        <SectionTitle n="10">Perubahan Layanan & Ketentuan</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7 }}>
          Nuave berhak mengubah, memodifikasi, atau menghentikan Layanan kapan saja. Perubahan pada Syarat & Ketentuan akan diberitahukan melalui email atau notifikasi dalam aplikasi minimal <strong>14 hari</strong> sebelum berlaku. Penggunaan Layanan setelah tanggal efektif perubahan dianggap sebagai penerimaan atas ketentuan yang diperbarui.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 11 */}
        <SectionTitle n="11">Hukum yang Berlaku</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7 }}>
          Syarat & Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum yang berlaku di Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan melalui musyawarah terlebih dahulu, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui pengadilan yang berwenang di Indonesia.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        {/* Section 12 */}
        <SectionTitle n="12">Hubungi Kami</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>
          Untuk pertanyaan terkait Syarat & Ketentuan ini atau pengajuan pengembalian dana:
        </p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "12px", padding: "24px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-body)", margin: "0 0 8px 0" }}><strong>Nuave</strong></p>
          <p style={{ fontSize: "14px", color: "var(--text-body)", margin: "0 0 8px 0" }}>
            Email: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--purple)" }}>{CONTACT_EMAIL}</a>
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>
            Website: <a href="https://nuave.ai" style={{ color: "var(--purple)" }}>https://nuave.ai</a>
          </p>
        </div>

      </main>

      <Footer />

    </div>
  );
}

function SectionTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "20px", fontWeight: 700, color: "var(--text-heading)", marginBottom: "16px" }}>
      <span style={{
        width: "32px", height: "32px", borderRadius: "8px",
        background: "var(--purple-light)", color: "var(--purple)",
        fontSize: "14px", fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{n}</span>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px", marginTop: "20px" }}>
      {children}
    </h3>
  );
}
