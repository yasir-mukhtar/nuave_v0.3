"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  const router = useRouter();
  const CONTACT_EMAIL = "privacy@nuave.ai";
  const LAST_UPDATED = "7 Maret 2026";

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
            Sesuai UU PDP No. 27 Tahun 2022
          </div>
          <h1 className="text-[32px] m-0 mb-2">
            Kebijakan Privasi
          </h1>
          <p className="type-body text-text-muted m-0">
            Terakhir diperbarui: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[800px] mx-auto px-8 py-12">

        <p className="text-[15px] text-text-body leading-[1.7] mb-2">
          Nuave ("<strong>kami</strong>") berkomitmen melindungi privasi Anda sesuai dengan{" "}
          <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)</strong>{" "}
          Republik Indonesia. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan,
          menyimpan, dan melindungi data pribadi Anda ketika menggunakan layanan Nuave di{" "}
          <a href="https://nuave.ai" className="text-brand no-underline hover:underline">https://nuave.ai</a>.
        </p>
        <p className="text-[15px] text-text-body leading-[1.7] mb-8">
          Dengan menggunakan layanan kami, Anda menyetujui praktik yang dijelaskan dalam Kebijakan Privasi ini.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="1">Data Pribadi yang Kami Kumpulkan</SectionTitle>
        <p className="type-body text-text-body mb-4">Kami mengumpulkan kategori data berikut:</p>

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

        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[var(--radius-md)] p-4 my-4 mb-8">
          <p className="type-body text-[#92400E] m-0">
            <strong>Catatan:</strong> Kami <strong>tidak</strong> mengumpulkan data sensitif seperti nomor KTP, data kesehatan, data biometrik, orientasi seksual, pandangan politik, atau data keuangan (kartu kredit diproses langsung oleh Stripe dan tidak pernah menyentuh server kami).
          </p>
        </div>

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="2">Dasar Hukum Pemrosesan Data</SectionTitle>
        <p className="type-body text-text-body mb-4">Sesuai Pasal 20 UU PDP, kami memproses data pribadi Anda berdasarkan:</p>
        {[
          ["Persetujuan (Pasal 20 huruf a)", "Anda memberikan persetujuan eksplisit saat mendaftar dan menggunakan layanan kami."],
          ["Pelaksanaan Perjanjian (Pasal 20 huruf b)", "Pemrosesan diperlukan untuk menyediakan layanan audit AEO yang Anda minta."],
          ["Kepentingan Sah (Pasal 20 huruf f)", "Untuk keamanan sistem, pencegahan penipuan, dan peningkatan kualitas layanan."],
        ].map(([title, desc], i) => (
          <div key={i} className="flex gap-3 mb-3">
            <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />
            <p className="type-body text-text-body m-0">
              <strong className="text-text-heading">{title}:</strong> {desc}
            </p>
          </div>
        ))}

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="3">Tujuan Penggunaan Data</SectionTitle>
        <p className="type-body text-text-body mb-4">Kami menggunakan data Anda untuk:</p>
        {[
          "Menyediakan dan menjalankan layanan audit AEO (mengirim prompt ke GPT-4o, menganalisis respons AI, menghitung Visibility Score)",
          "Mengautentikasi identitas Anda dan mengelola akun",
          "Mengelola saldo kredit dan memproses transaksi pembayaran",
          "Menghasilkan rekomendasi konten dan artikel blog menggunakan Claude AI",
          "Meningkatkan akurasi dan kualitas layanan kami",
          "Memenuhi kewajiban hukum dan mencegah penyalahgunaan layanan",
          "Mengirimkan notifikasi terkait layanan (bukan pemasaran tanpa persetujuan)",
        ].map((item, i) => (
          <div key={i} className="flex gap-3 mb-2.5">
            <span className="w-[22px] h-[22px] rounded-full bg-[var(--purple-light)] text-brand text-[12px] font-semibold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <p className="type-body text-text-body m-0 pt-px">{item}</p>
          </div>
        ))}

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="4">Pihak Ketiga & Transfer Data Lintas Negara</SectionTitle>
        <p className="type-body text-text-body mb-4">
          Sesuai Pasal 56 UU PDP, kami menginformasikan bahwa data Anda diproses oleh penyedia layanan pihak ketiga berikut:
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse type-body border border-border-default rounded-[var(--radius-md)] overflow-hidden">
            <thead>
              <tr className="bg-surface">
                {["Penyedia", "Tujuan", "Lokasi Server", "Data yang Dikirim"].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-text-body font-semibold border-b border-border-default">{h}</th>
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
                <tr key={i} className={cn(i < arr.length - 1 && "border-b border-border-default")}>
                  {row.map((cell, j) => (
                    <td key={j} className={cn("px-4 py-3", j === 0 ? "text-text-heading font-medium" : "text-text-body")}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="5">Retensi & Penghapusan Data</SectionTitle>
        <DataTable rows={[
          ["Data akun pengguna", "Selama akun aktif + 30 hari setelah penghapusan akun"],
          ["Hasil audit (dengan akun)", "Selama akun aktif"],
          ["Audit anonim (tanpa akun)", "48 jam — dihapus otomatis"],
          ["Riwayat transaksi kredit", "5 tahun (kewajiban hukum perpajakan Indonesia)"],
          ["Log keamanan / akses", "90 hari"],
        ]} />

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="6">Hak-Hak Anda Sebagai Subjek Data</SectionTitle>
        <p className="type-body text-text-body mb-4">Sesuai Pasal 5–16 UU PDP, Anda memiliki hak-hak berikut:</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
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
            <div key={i} className="border border-border-default rounded-[var(--radius-md)] p-4">
              <p className="type-body font-semibold text-text-heading m-0 mb-1">{title}</p>
              <p className="type-caption text-text-muted m-0">{desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-[var(--purple-light)] border border-[#C4B5FD] rounded-[var(--radius-md)] p-4">
          <p className="type-body text-[#4C1D95] m-0">
            Untuk menggunakan hak-hak di atas, kirimkan permintaan ke{" "}
            <a href="mailto:privacy@nuave.ai" className="text-brand font-semibold no-underline hover:underline">privacy@nuave.ai</a>.
            Kami akan merespons dalam <strong>14 hari kerja</strong>.
          </p>
        </div>

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="7">Keamanan Data</SectionTitle>
        <p className="type-body text-text-body mb-4">Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai, termasuk:</p>
        {[
          "Enkripsi data saat transit menggunakan TLS/HTTPS",
          "Token autentikasi disimpan dalam httpOnly cookies (tidak dapat diakses JavaScript)",
          "Row Level Security (RLS) di Supabase — setiap pengguna hanya dapat mengakses datanya sendiri",
          "API key AI (OpenAI, Anthropic) hanya tersimpan di server, tidak pernah terekspos ke browser",
          "Rate limiting pada endpoint kritis untuk mencegah penyalahgunaan",
          "Kunci Stripe diverifikasi melalui webhook signature untuk setiap transaksi",
        ].map((item, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <span className="text-success font-bold shrink-0">✓</span>
            <p className="type-body text-text-body m-0">{item}</p>
          </div>
        ))}

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="8">Cookie & Penyimpanan Lokal</SectionTitle>
        <p className="type-body text-text-body mb-4">Kami menggunakan cookie yang diperlukan untuk fungsi autentikasi:</p>
        <DataTable rows={[
          ["Cookie sesi Supabase", "httpOnly, Secure — menjaga status login Anda — hingga logout"],
          ["sessionStorage browser", "Sisi klien saja — menyimpan sementara brand & URL sebelum login — dihapus saat tab ditutup"],
        ]} />
        <p className="type-body text-text-body mt-3">
          Kami <strong>tidak</strong> menggunakan cookie analitik pihak ketiga atau pelacak lintas situs pada halaman yang terautentikasi.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="9">Perlindungan Anak di Bawah Umur</SectionTitle>
        <p className="type-body text-text-body leading-[1.7]">
          Layanan Nuave ditujukan untuk pengguna berusia <strong>18 tahun ke atas</strong>. Kami tidak secara sadar mengumpulkan data pribadi dari anak di bawah umur. Jika Anda mengetahui bahwa seseorang di bawah 18 tahun telah mendaftar, harap hubungi kami di{" "}
          <a href="mailto:privacy@nuave.ai" className="text-brand no-underline hover:underline">privacy@nuave.ai</a>.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="10">Perubahan Kebijakan Privasi</SectionTitle>
        <p className="type-body text-text-body leading-[1.7]">
          Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui email atau notifikasi dalam aplikasi setidaknya <strong>14 hari</strong> sebelum berlaku.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        <SectionTitle n="11">Hubungi Kami</SectionTitle>
        <p className="type-body text-text-body mb-4">Untuk pertanyaan, permintaan hak subjek data, atau keluhan terkait privasi:</p>
        <div className="bg-surface border border-border-default rounded-[var(--radius-lg)] p-6">
          <p className="type-body text-text-body m-0 mb-2"><strong>Penanggung Jawab Data:</strong> Nuave</p>
          <p className="type-body text-text-body m-0 mb-2">
            <strong>Email:</strong>{" "}
            <a href="mailto:privacy@nuave.ai" className="text-brand no-underline hover:underline">privacy@nuave.ai</a>
          </p>
          <p className="type-body text-text-body m-0">
            <strong>Website:</strong>{" "}
            <a href="https://nuave.ai" className="text-brand no-underline hover:underline">https://nuave.ai</a>
          </p>
        </div>

      </main>

      <Footer />

    </div>
  );
}

function SectionTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-[20px] mb-4">
      <span className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--purple-light)] text-brand text-[14px] font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] font-semibold text-text-muted uppercase tracking-[0.05em] mb-3 mt-5">
      {children}
    </h3>
  );
}

function DataTable({ rows }: { rows: string[][] }) {
  return (
    <div className="border border-border-default rounded-[var(--radius-md)] overflow-hidden mb-4">
      <table className="w-full border-collapse type-body">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn(i < rows.length - 1 && "border-b border-border-default")}>
              <td className="px-4 py-3 font-medium text-text-heading w-[35%] bg-surface">{row[0]}</td>
              <td className="px-4 py-3 text-text-body">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
