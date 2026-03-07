"use client";

import Link from "next/link";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  const CONTACT_EMAIL = "privacy@nuave.id";
  const LAST_UPDATED = "7 Maret 2026";

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
        <Link href="/" style={{ fontSize: "14px", color: "var(--text-muted)", textDecoration: "none" }}>
          ← Kembali ke beranda
        </Link>
      </header>

      {/* Hero */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-default)", padding: "48px 32px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "var(--purple-light)", border: "1px solid #C4B5FD",
            borderRadius: "999px", padding: "4px 12px",
            fontSize: "12px", fontWeight: 500, color: "var(--purple)", marginBottom: "16px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--purple)" }} />
            Sesuai UU PDP No. 27 Tahun 2022
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 8px 0" }}>
            Kebijakan Privasi
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            Terakhir diperbarui: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 32px" }}>

        <p style={{ fontSize: "15px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "8px" }}>
          Nuave ("<strong>kami</strong>") berkomitmen melindungi privasi Anda sesuai dengan{" "}
          <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)</strong>{" "}
          Republik Indonesia. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan,
          menyimpan, dan melindungi data pribadi Anda ketika menggunakan layanan Nuave di{" "}
          <a href="https://nuave.id" style={{ color: "var(--purple)" }}>https://nuave.id</a>.
        </p>
        <p style={{ fontSize: "15px", color: "var(--text-body)", lineHeight: 1.7, marginBottom: "32px" }}>
          Dengan menggunakan layanan kami, Anda menyetujui praktik yang dijelaskan dalam Kebijakan Privasi ini.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="1">Data Pribadi yang Kami Kumpulkan</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>Kami mengumpulkan kategori data berikut:</p>

        <SubTitle>1.1 Data Identitas & Akun</SubTitle>
        <DataTable rows={[
          ["Nama lengkap", "Disediakan melalui Google OAuth saat registrasi"],
          ["Alamat email", "Disediakan melalui Google OAuth saat registrasi"],
          ["ID pengguna", "Dibuat secara otomatis oleh sistem kami (Supabase Auth)"],
        ]} />

        <SubTitle>1.2 Data Bisnis (Input Pengguna)</SubTitle>
        <DataTable rows={[
          ["Nama merek / brand", "Dimasukkan oleh pengguna untuk keperluan audit AEO"],
          ["URL website", "Dimasukkan oleh pengguna; digunakan untuk proses scraping konten publik"],
          ["Informasi profil bisnis", "Gambaran perusahaan, diferensiasi produk, pesaing — dihasilkan oleh AI dari konten website publik"],
        ]} />

        <SubTitle>1.3 Data Penggunaan Layanan</SubTitle>
        <DataTable rows={[
          ["Hasil audit", "Respons AI dari GPT-4o, skor visibilitas, analisis pesaing"],
          ["Riwayat transaksi kredit", "Pembelian kredit, penggunaan kredit, saldo"],
          ["Log aktivitas", "Waktu audit, jenis tindakan yang dilakukan"],
        ]} />

        <SubTitle>1.4 Data Teknis</SubTitle>
        <DataTable rows={[
          ["Data sesi", "Token autentikasi (disimpan dalam httpOnly cookie)"],
          ["Alamat IP", "Untuk keperluan rate limiting dan keamanan sistem"],
        ]} />

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px", padding: "16px", margin: "16px 0 32px" }}>
          <p style={{ fontSize: "14px", color: "#92400E", margin: 0 }}>
            <strong>Catatan:</strong> Kami <strong>tidak</strong> mengumpulkan data sensitif seperti nomor KTP, data kesehatan, data biometrik, orientasi seksual, pandangan politik, atau data keuangan (kartu kredit diproses langsung oleh Stripe dan tidak pernah menyentuh server kami).
          </p>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="2">Dasar Hukum Pemrosesan Data</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>Sesuai Pasal 20 UU PDP, kami memproses data pribadi Anda berdasarkan:</p>
        {[
          ["Persetujuan (Pasal 20 huruf a)", "Anda memberikan persetujuan eksplisit saat mendaftar dan menggunakan layanan kami."],
          ["Pelaksanaan Perjanjian (Pasal 20 huruf b)", "Pemrosesan diperlukan untuk menyediakan layanan audit AEO yang Anda minta."],
          ["Kepentingan Sah (Pasal 20 huruf f)", "Untuk keamanan sistem, pencegahan penipuan, dan peningkatan kualitas layanan."],
        ].map(([title, desc], i) => (
          <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--purple)", flexShrink: 0, marginTop: "6px" }} />
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>
              <strong style={{ color: "var(--text-heading)" }}>{title}:</strong> {desc}
            </p>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="3">Tujuan Penggunaan Data</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>Kami menggunakan data Anda untuk:</p>
        {[
          "Menyediakan dan menjalankan layanan audit AEO (mengirim prompt ke GPT-4o, menganalisis respons AI, menghitung Visibility Score)",
          "Mengautentikasi identitas Anda dan mengelola akun",
          "Mengelola saldo kredit dan memproses transaksi pembayaran",
          "Menghasilkan rekomendasi konten dan artikel blog menggunakan Claude AI",
          "Meningkatkan akurasi dan kualitas layanan kami",
          "Memenuhi kewajiban hukum dan mencegah penyalahgunaan layanan",
          "Mengirimkan notifikasi terkait layanan (bukan pemasaran tanpa persetujuan)",
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

        <SectionTitle n="4">Pihak Ketiga & Transfer Data Lintas Negara</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>
          Sesuai Pasal 56 UU PDP, kami menginformasikan bahwa data Anda diproses oleh penyedia layanan pihak ketiga berikut:
        </p>
        <div style={{ overflowX: "auto", marginBottom: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", border: "1px solid var(--border-default)", borderRadius: "8px", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                {["Penyedia", "Tujuan", "Lokasi Server", "Data yang Dikirim"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-body)", fontWeight: 600, borderBottom: "1px solid var(--border-default)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Supabase", "Database & autentikasi", "Singapura (AWS ap-southeast-1)", "Email, nama, data audit, riwayat kredit"],
                ["OpenAI (GPT-4o)", "Simulasi prompt pengguna AI", "Amerika Serikat", "Teks prompt yang dihasilkan (tanpa PII)"],
                ["Anthropic (Claude)", "Scraping website, analisis, rekomendasi", "Amerika Serikat", "URL website publik, teks konten publik"],
                ["Stripe", "Pemrosesan pembayaran", "Amerika Serikat", "Email, riwayat transaksi (data kartu tidak menyentuh server kami)"],
                ["Vercel", "Hosting aplikasi web", "Amerika Serikat / Global Edge", "Request HTTP, log akses"],
              ].map((row, i, arr) => (
                <tr key={i} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "12px 16px", color: j === 0 ? "var(--text-heading)" : "var(--text-body)", fontWeight: j === 0 ? 500 : 400 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="5">Retensi & Penghapusan Data</SectionTitle>
        <DataTable rows={[
          ["Data akun pengguna", "Selama akun aktif + 30 hari setelah penghapusan akun"],
          ["Hasil audit (dengan akun)", "Selama akun aktif"],
          ["Audit anonim (tanpa akun)", "48 jam — dihapus otomatis"],
          ["Riwayat transaksi kredit", "5 tahun (kewajiban hukum perpajakan Indonesia)"],
          ["Log keamanan / akses", "90 hari"],
        ]} />

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="6">Hak-Hak Anda Sebagai Subjek Data</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>Sesuai Pasal 5–16 UU PDP, Anda memiliki hak-hak berikut:</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          {[
            ["Hak Mengakses", "Meminta salinan data pribadi Anda yang kami simpan."],
            ["Hak Memperbaiki", "Meminta koreksi data yang tidak akurat atau tidak lengkap."],
            ["Hak Menghapus", "Meminta penghapusan data pribadi Anda ('hak untuk dilupakan')."],
            ["Hak Membatasi", "Meminta pembatasan pemrosesan data Anda dalam kondisi tertentu."],
            ["Hak Portabilitas", "Menerima data Anda dalam format yang dapat dibaca mesin."],
            ["Hak Menolak", "Menolak pemrosesan data untuk tujuan tertentu termasuk pemasaran."],
            ["Hak Menarik Persetujuan", "Menarik persetujuan kapan saja tanpa mempengaruhi keabsahan pemrosesan sebelumnya."],
            ["Hak Mengajukan Keberatan", "Mengajukan keberatan kepada kami atau ke Lembaga Perlindungan Data Pribadi."],
          ].map(([title, desc], i) => (
            <div key={i} style={{ border: "1px solid var(--border-default)", borderRadius: "8px", padding: "16px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", margin: "0 0 4px 0" }}>{title}</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--purple-light)", border: "1px solid #C4B5FD", borderRadius: "8px", padding: "16px" }}>
          <p style={{ fontSize: "14px", color: "#4C1D95", margin: 0 }}>
            Untuk menggunakan hak-hak di atas, kirimkan permintaan ke{" "}
            <a href="mailto:privacy@nuave.id" style={{ color: "var(--purple)", fontWeight: 600 }}>privacy@nuave.id</a>.
            Kami akan merespons dalam <strong>14 hari kerja</strong>.
          </p>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="7">Keamanan Data</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai, termasuk:</p>
        {[
          "Enkripsi data saat transit menggunakan TLS/HTTPS",
          "Token autentikasi disimpan dalam httpOnly cookies (tidak dapat diakses JavaScript)",
          "Row Level Security (RLS) di Supabase — setiap pengguna hanya dapat mengakses datanya sendiri",
          "API key AI (OpenAI, Anthropic) hanya tersimpan di server, tidak pernah terekspos ke browser",
          "Rate limiting pada endpoint kritis untuk mencegah penyalahgunaan",
          "Kunci Stripe diverifikasi melalui webhook signature untuk setiap transaksi",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "#22C55E", fontWeight: 700, flexShrink: 0 }}>✓</span>
            <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>{item}</p>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="8">Cookie & Penyimpanan Lokal</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>Kami menggunakan cookie yang diperlukan untuk fungsi autentikasi:</p>
        <DataTable rows={[
          ["Cookie sesi Supabase", "httpOnly, Secure — menjaga status login Anda — hingga logout"],
          ["sessionStorage browser", "Sisi klien saja — menyimpan sementara brand & URL sebelum login — dihapus saat tab ditutup"],
        ]} />
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginTop: "12px" }}>
          Kami <strong>tidak</strong> menggunakan cookie analitik pihak ketiga atau pelacak lintas situs pada halaman yang terautentikasi.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="9">Perlindungan Anak di Bawah Umur</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7 }}>
          Layanan Nuave ditujukan untuk pengguna berusia <strong>18 tahun ke atas</strong>. Kami tidak secara sadar mengumpulkan data pribadi dari anak di bawah umur. Jika Anda mengetahui bahwa seseorang di bawah 18 tahun telah mendaftar, harap hubungi kami di{" "}
          <a href="mailto:privacy@nuave.id" style={{ color: "var(--purple)" }}>privacy@nuave.id</a>.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="10">Perubahan Kebijakan Privasi</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.7 }}>
          Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui email atau notifikasi dalam aplikasi setidaknya <strong>14 hari</strong> sebelum berlaku.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "32px 0" }} />

        <SectionTitle n="11">Hubungi Kami</SectionTitle>
        <p style={{ fontSize: "14px", color: "var(--text-body)", marginBottom: "16px" }}>Untuk pertanyaan, permintaan hak subjek data, atau keluhan terkait privasi:</p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-default)", borderRadius: "12px", padding: "24px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-body)", margin: "0 0 8px 0" }}><strong>Penanggung Jawab Data:</strong> Nuave</p>
          <p style={{ fontSize: "14px", color: "var(--text-body)", margin: "0 0 8px 0" }}>
            <strong>Email:</strong>{" "}
            <a href="mailto:privacy@nuave.id" style={{ color: "var(--purple)" }}>privacy@nuave.id</a>
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-body)", margin: 0 }}>
            <strong>Website:</strong>{" "}
            <a href="https://nuave.id" style={{ color: "var(--purple)" }}>https://nuave.id</a>
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

function DataTable({ rows }: { rows: string[][] }) {
  return (
    <div style={{ border: "1px solid var(--border-default)", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border-default)" : "none" }}>
              <td style={{ padding: "12px 16px", fontWeight: 500, color: "var(--text-heading)", width: "35%", background: "var(--surface)" }}>{row[0]}</td>
              <td style={{ padding: "12px 16px", color: "var(--text-body)" }}>{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
