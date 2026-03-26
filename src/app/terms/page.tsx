"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";

export default function TermsPage() {
  const router = useRouter();
  const LAST_UPDATED = "7 Maret 2026";
  const CONTACT_EMAIL = "hello@nuave.ai";

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
            Berlaku sejak 7 Maret 2026
          </div>
          <h1 className="text-[32px] m-0 mb-2">
            Syarat & Ketentuan
          </h1>
          <p className="type-body text-text-muted m-0">
            Terakhir diperbarui: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[800px] mx-auto px-8 py-12">

        {/* Intro */}
        <p className="text-[15px] text-text-body leading-[1.7] mb-8">
          Layanan Nuave (<strong>"Layanan"</strong>) disediakan oleh Nuave (<strong>"kami"</strong>) dan ditawarkan kepada Anda dengan syarat penerimaan tanpa modifikasi atas semua ketentuan yang tercantum di sini. Dengan menggunakan Layanan ini, Anda menyetujui semua Syarat & Ketentuan ini.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 1 */}
        <SectionTitle n="1">Ketentuan Penggunaan</SectionTitle>
        <p className="type-body text-text-body leading-[1.7] mb-6">
          Nuave adalah platform SaaS (Software as a Service) untuk Answer Engine Optimization (AEO) yang membantu bisnis mengukur dan meningkatkan visibilitas merek mereka di hasil jawaban AI. Layanan ini ditawarkan kepada Anda dengan syarat penerimaan atas semua ketentuan, syarat, dan pemberitahuan yang terkandung di sini serta ketentuan tambahan yang berlaku untuk setiap bagian dari Layanan.
        </p>
        <p className="type-body text-text-body leading-[1.7]">
          Jika Anda tidak menyetujui Syarat & Ketentuan ini, Anda harus segera menghentikan penggunaan Layanan.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 2 */}
        <SectionTitle n="2">Gambaran Umum Layanan</SectionTitle>
        <p className="type-body text-text-body leading-[1.7] mb-4">
          Nuave menyediakan layanan digital berupa:
        </p>
        {[
          "Audit visibilitas merek di platform AI (ChatGPT, Perplexity, dan lainnya)",
          "Analisis kompetitor berdasarkan respons AI",
          "Rekomendasi peningkatan konten web untuk optimasi AI",
          "Pembuatan artikel blog yang dioptimalkan untuk mesin jawaban AI",
          "Laporan visibilitas dalam format PDF",
        ].map((item, i) => (
          <div key={i} className="flex gap-3 mb-2.5">
            <span className="w-[22px] h-[22px] rounded-full bg-[var(--purple-light)] text-brand text-[12px] font-semibold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <p className="type-body text-text-body m-0 pt-px">{item}</p>
          </div>
        ))}

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 3 */}
        <SectionTitle n="3">Sistem Kredit & Pembayaran</SectionTitle>
        <p className="type-body text-text-body leading-[1.7] mb-4">
          Nuave menggunakan sistem berbasis kredit. Pengguna baru menerima <strong>10 kredit gratis</strong> saat pendaftaran. Kredit tambahan dapat dibeli dalam paket berikut:
        </p>

        <div className="border border-border-default rounded-[var(--radius-md)] overflow-hidden mb-4">
          <table className="w-full border-collapse type-body">
            <thead>
              <tr className="bg-surface">
                {["Paket", "Kredit", "Harga (IDR)"].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-text-body font-semibold border-b border-border-default">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Starter", "50 kredit", "Rp 75.000"],
                ["Growth ⭐ Terpopuler", "150 kredit", "Rp 199.000"],
                ["Agency", "500 kredit", "Rp 599.000"],
              ].map((row, i) => (
                <tr key={i} className={cn(i < 2 && "border-b border-border-default")}>
                  {row.map((cell, j) => (
                    <td key={j} className={cn("px-4 py-3", j === 0 ? "text-text-heading font-medium" : "text-text-body")}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="type-body text-text-body leading-[1.7] mb-3">
          Penggunaan kredit per tindakan:
        </p>
        <div className="border border-border-default rounded-[var(--radius-md)] overflow-hidden mb-4">
          <table className="w-full border-collapse type-body">
            <tbody>
              {[
                ["Jalankan audit (10 prompt)", "10 kredit"],
                ["Tambah 10 prompt ke audit", "10 kredit"],
                ["Generate rekomendasi konten web", "1 kredit"],
                ["Generate artikel blog", "2 kredit"],
                ["Re-analisis konten website", "3 kredit"],
                ["Ekspor laporan PDF", "Gratis"],
              ].map((row, i, arr) => (
                <tr key={i} className={cn(i < arr.length - 1 && "border-b border-border-default")}>
                  <td className="px-4 py-3 text-text-heading font-medium bg-surface w-[65%]">{row[0]}</td>
                  <td className="px-4 py-3 text-text-body">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[var(--radius-md)] p-4 mb-2">
          <p className="type-body text-[#92400E] m-0">
            <strong>Penting:</strong> Kredit yang telah dibeli tidak dapat dikembalikan atau ditukar dengan uang tunai. Kredit tidak memiliki masa kadaluarsa selama akun Anda aktif.
          </p>
        </div>

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 4 - Refund */}
        <SectionTitle n="4">Kebijakan Pengembalian Dana</SectionTitle>

        <div className="bg-[var(--purple-light)] border border-[#C4B5FD] rounded-[var(--radius-md)] p-4 mb-5">
          <p className="type-body text-[#4C1D95] m-0 font-medium">
            Nuave menjual produk digital (kredit layanan). Sesuai dengan sifat produk digital yang langsung dapat digunakan, berlaku ketentuan pengembalian dana berikut.
          </p>
        </div>

        <SubTitle>4.1 Pengembalian Dana yang Disetujui</SubTitle>
        <p className="type-body text-text-body leading-[1.7] mb-3">
          Pengembalian dana <strong>hanya</strong> dapat diproses dalam kondisi berikut:
        </p>
        {[
          "Pembayaran berhasil diproses tetapi kredit tidak ditambahkan ke akun Anda dalam 1×24 jam",
          "Terjadi duplikasi pembayaran untuk transaksi yang sama",
          "Terdapat kesalahan teknis dari sistem kami yang menyebabkan kredit terpotong tanpa layanan yang diberikan",
        ].map((item, i) => (
          <div key={i} className="flex gap-2 mb-2.5">
            <span className="text-success font-bold shrink-0">✓</span>
            <p className="type-body text-text-body m-0">{item}</p>
          </div>
        ))}

        <SubTitle>4.2 Pengembalian Dana yang Tidak Disetujui</SubTitle>
        <p className="type-body text-text-body leading-[1.7] mb-3">
          Pengembalian dana <strong>tidak dapat</strong> diproses untuk:
        </p>
        {[
          "Kredit yang telah digunakan sebagian atau seluruhnya",
          "Ketidakpuasan terhadap hasil audit atau rekomendasi AI (hasil dipengaruhi oleh data merek yang dimasukkan pengguna)",
          "Perubahan kebutuhan bisnis setelah pembelian",
          "Lupa menggunakan kredit yang telah dibeli",
          "Pelanggaran Syarat & Ketentuan yang mengakibatkan penutupan akun",
        ].map((item, i) => (
          <div key={i} className="flex gap-2 mb-2.5">
            <span className="text-error font-bold shrink-0">✕</span>
            <p className="type-body text-text-body m-0">{item}</p>
          </div>
        ))}

        <SubTitle>4.3 Proses Pengajuan Pengembalian Dana</SubTitle>
        {[
          ["Ajukan permintaan", `Kirim email ke ${CONTACT_EMAIL} dengan subjek "Refund Request - [Order ID]"`],
          ["Sertakan bukti", "Lampirkan bukti pembayaran dan deskripsi masalah yang dialami"],
          ["Proses verifikasi", "Tim kami akan memverifikasi dalam 3 hari kerja"],
          ["Pengembalian dana", "Jika disetujui, dana dikembalikan dalam 7-14 hari kerja melalui metode pembayaran asal"],
        ].map(([step, desc], i) => (
          <div key={i} className="flex gap-4 mb-4">
            <span className="w-7 h-7 rounded-full bg-[var(--purple-light)] text-brand text-[13px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <div>
              <p className="type-body font-semibold text-text-heading m-0 mb-0.5">{step}</p>
              <p className="type-body text-text-body m-0">{desc}</p>
            </div>
          </div>
        ))}

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 5 */}
        <SectionTitle n="5">Lisensi Penggunaan</SectionTitle>
        <p className="type-body text-text-body leading-[1.7] mb-3">
          Nuave memberikan Anda hak terbatas, non-eksklusif, tidak dapat dipindahtangankan untuk mengakses dan menggunakan Layanan semata-mata untuk keperluan bisnis internal Anda. Anda tidak boleh:
        </p>
        {[
          "Memodifikasi, mendekompilasi, atau melakukan rekayasa balik pada komponen Layanan",
          "Membuat karya turunan berdasarkan Layanan",
          "Mengizinkan pihak ketiga menggunakan atau mengakses Layanan dengan akun Anda",
          "Menggunakan Layanan untuk tujuan yang melanggar hukum yang berlaku di Indonesia",
        ].map((item, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <span className="text-error font-bold shrink-0">✕</span>
            <p className="type-body text-text-body m-0">{item}</p>
          </div>
        ))}

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 6 */}
        <SectionTitle n="6">Hak Kekayaan Intelektual</SectionTitle>
        <p className="type-body text-text-body leading-[1.7]">
          Seluruh konten, desain, kode, merek dagang, dan materi lain yang tersedia melalui Layanan Nuave adalah milik Nuave dan dilindungi oleh hukum kekayaan intelektual Indonesia. Konten yang dihasilkan AI untuk akun Anda (rekomendasi, artikel blog, laporan audit) menjadi hak Anda untuk digunakan sesuai tujuan bisnis, namun tidak dapat dijual kembali sebagai produk serupa.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 7 */}
        <SectionTitle n="7">Kewajiban & Jaminan Pengguna</SectionTitle>
        <p className="type-body text-text-body leading-[1.7] mb-3">
          Dengan menggunakan Layanan, Anda menjamin bahwa:
        </p>
        {[
          "Anda berusia minimal 18 tahun atau mewakili entitas bisnis yang sah",
          "Informasi yang Anda berikan (nama merek, URL website) adalah akurat dan Anda memiliki hak atas merek tersebut",
          "Anda tidak akan menggunakan Layanan untuk mengaudit merek milik pihak lain tanpa izin",
          "Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda",
        ].map((item, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <span className="text-success font-bold shrink-0">✓</span>
            <p className="type-body text-text-body m-0">{item}</p>
          </div>
        ))}

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 8 */}
        <SectionTitle n="8">Penafian & Batasan Tanggung Jawab</SectionTitle>
        <p className="type-body text-text-body leading-[1.7] mb-3">
          Nuave menyediakan Layanan "sebagaimana adanya". Kami tidak memberikan jaminan bahwa:
        </p>
        {[
          "Hasil audit mencerminkan semua respons AI yang ada di internet (bergantung pada model AI yang digunakan)",
          "Rekomendasi yang diberikan akan secara otomatis meningkatkan visibilitas merek Anda",
          "Layanan akan selalu tersedia tanpa gangguan",
        ].map((item, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <span className="text-text-muted shrink-0">•</span>
            <p className="type-body text-text-body m-0">{item}</p>
          </div>
        ))}
        <p className="type-body text-text-body leading-[1.7] mt-3">
          Tanggung jawab maksimal Nuave kepada Anda tidak akan melebihi jumlah yang Anda bayarkan kepada kami dalam 30 hari terakhir.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 9 */}
        <SectionTitle n="9">Penangguhan & Penutupan Akun</SectionTitle>
        <p className="type-body text-text-body leading-[1.7] mb-3">
          Nuave berhak menangguhkan atau menutup akun Anda dengan segera jika:
        </p>
        {[
          "Anda melanggar Syarat & Ketentuan ini",
          "Kami menduga adanya aktivitas penipuan atau penyalahgunaan Layanan",
          "Anda menggunakan Layanan untuk tujuan yang melanggar hukum",
          "Akun tidak aktif lebih dari 12 bulan",
        ].map((item, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <span className="text-error shrink-0">•</span>
            <p className="type-body text-text-body m-0">{item}</p>
          </div>
        ))}

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 10 */}
        <SectionTitle n="10">Perubahan Layanan & Ketentuan</SectionTitle>
        <p className="type-body text-text-body leading-[1.7]">
          Nuave berhak mengubah, memodifikasi, atau menghentikan Layanan kapan saja. Perubahan pada Syarat & Ketentuan akan diberitahukan melalui email atau notifikasi dalam aplikasi minimal <strong>14 hari</strong> sebelum berlaku. Penggunaan Layanan setelah tanggal efektif perubahan dianggap sebagai penerimaan atas ketentuan yang diperbarui.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 11 */}
        <SectionTitle n="11">Hukum yang Berlaku</SectionTitle>
        <p className="type-body text-text-body leading-[1.7]">
          Syarat & Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum yang berlaku di Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan melalui musyawarah terlebih dahulu, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui pengadilan yang berwenang di Indonesia.
        </p>

        <hr className="border-none border-t border-border-default my-8" />

        {/* Section 12 */}
        <SectionTitle n="12">Hubungi Kami</SectionTitle>
        <p className="type-body text-text-body mb-4">
          Untuk pertanyaan terkait Syarat & Ketentuan ini atau pengajuan pengembalian dana:
        </p>
        <div className="bg-surface border border-border-default rounded-[var(--radius-lg)] p-6">
          <p className="type-body text-text-body m-0 mb-2"><strong>Nuave</strong></p>
          <p className="type-body text-text-body m-0 mb-2">
            Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand no-underline hover:underline">{CONTACT_EMAIL}</a>
          </p>
          <p className="type-body text-text-body m-0">
            Website: <a href="https://nuave.ai" className="text-brand no-underline hover:underline">https://nuave.ai</a>
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
