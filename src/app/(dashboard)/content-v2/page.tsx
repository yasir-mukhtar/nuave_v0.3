"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSparkles,
  IconCopy,
  IconCheck,
  IconChevronDown,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tip } from "@/components/ui/tip";

/* ── Types ── */

type Category = "teknikal" | "web_copy" | "konten";
type Priority = "high" | "medium" | "low";

interface ContentBlock {
  label: string;
  body: string;
  copyable: boolean;
}

interface Rec {
  id: string;
  category: Category;
  priority: Priority;
  title: string;
  description: string;
  blocks: ContentBlock[];
  implemented: boolean;
}

/* ── Config ── */

const CAT: Record<Category, { label: string; bg: string; color: string; tip: string }> = {
  teknikal: {
    label: "Teknikal",
    bg: "#DBEAFE",
    color: "#2563EB",
    tip: "Optimasi struktur situs untuk mesin AI: schema markup, structured data, kecepatan halaman, dan crawlability.",
  },
  web_copy: {
    label: "Web Copy",
    bg: "#EDE9FF",
    color: "#533AFD",
    tip: "Perbaikan teks di halaman website: headline, CTA, FAQ, meta description, dan halaman produk.",
  },
  konten: {
    label: "Konten",
    bg: "#DCFCE7",
    color: "#16A34A",
    tip: "Konten panjang yang meningkatkan otoritas topik: panduan, artikel perbandingan, how-to, dan blog post.",
  },
};

const PRIO: Record<Priority, { label: string; color: string }> = {
  high: { label: "Prioritas tinggi", color: "#DC2626" },
  medium: { label: "Prioritas sedang", color: "#D97706" },
  low: { label: "Prioritas rendah", color: "#6B7280" },
};

/* ── Audit scores (for generate modal priority preview) ── */

const AUDIT_SCORES: Record<Category, number> = {
  teknikal: 34,
  web_copy: 52,
  konten: 28,
};

/* ── Mock Data ── */

const INITIAL_RECS: Rec[] = [
  {
    id: "1",
    category: "teknikal",
    priority: "high",
    title: "Tambahkan Schema Markup FAQ di Semua Halaman Produk",
    description:
      "AI search engines lebih mudah mengutip halaman yang memiliki structured data FAQ. Ini salah satu sinyal paling kuat untuk AI citation.",
    blocks: [
      {
        label: "Implementasi JSON-LD",
        body: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Apa itu Ortuseight?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Ortuseight adalah brand sepatu olahraga Indonesia yang berdiri sejak 2019, fokus pada performa futsal dan sepak bola dengan teknologi outsole eksklusif."
    }
  }]
}`,
        copyable: true,
      },
      {
        label: "Halaman yang perlu diupdate",
        body: "Tambahkan schema ini ke: /produk, /tentang-kami, /faq. Prioritaskan halaman dengan traffic organik tertinggi terlebih dahulu.",
        copyable: false,
      },
    ],
    implemented: false,
  },
  {
    id: "2",
    category: "web_copy",
    priority: "high",
    title: "Perkuat Trust Signal dan Credibility Markers di Beranda",
    description:
      "Tambahkan social proof eksplisit yang dapat dikutip AI saat menjawab pertanyaan tentang brand Anda.",
    blocks: [
      {
        label: "Hero Section — Tagline Baru",
        body: "Dipercaya 50.000+ atlet Indonesia. Teknologi outsole eksklusif X-Grip™ untuk traksi maksimal di lapangan basah.",
        copyable: true,
      },
      {
        label: "Social Proof Block",
        body: `• "Satu-satunya brand lokal yang melewati standar uji FIFA Quality Pro" — Sport Review Magazine, 2024\n• Digunakan Tim Nasional Futsal Indonesia sejak 2022\n• Rating 4.8/5 dari 12.400+ review terverifikasi`,
        copyable: true,
      },
    ],
    implemented: false,
  },
  {
    id: "3",
    category: "konten",
    priority: "high",
    title: "Publikasikan Panduan Lengkap: Memilih Sepatu Futsal yang Tepat",
    description:
      "Konten panduan komprehensif meningkatkan kemungkinan dikutip AI saat menjawab pertanyaan pembelian.",
    blocks: [
      {
        label: "Judul Utama Panduan",
        body: "Panduan Lengkap Memilih Sepatu Futsal 2025: Dari Pemula hingga Profesional",
        copyable: true,
      },
      {
        label: "Struktur Konten (5 Bagian Utama)",
        body: `**Bagian 1: Memahami Jenis Outsole**\n- Flat/IN-sole untuk lapangan indoor kayu atau parket\n- Rubber outsole untuk lapangan beton dan semen\n- Perbedaan traksi dan dampaknya pada performa\n\n**Bagian 2: Fit dan Ukuran yang Benar**\n- Cara mengukur kaki yang benar (panduan langkah demi langkah)\n- Mengapa sepatu futsal lebih ketat dari sneaker biasa\n- Tabel ukuran konversi internasional\n\n**Bagian 3: Material Upper**\n- Synthetic leather: tahan lama, touch konsisten\n- Mesh: ringan, sirkulasi udara\n- Kangaroo leather: premium, molding sempurna ke kaki\n\n**Bagian 4: Rekomendasi per Level Bermain**\n- Pemula (< 2 tahun): fokus durabilitas dan harga\n- Intermediate: balance antara touch dan traksi\n- Profesional: maksimalkan responsiveness\n\n**Bagian 5: Perawatan dan Umur Panjang**\n- Cara membersihkan outsole rubber dengan benar\n- Rotasi sepatu untuk memaksimalkan umur pakai\n- Tanda-tanda sepatu sudah harus diganti`,
        copyable: true,
      },
      {
        label: "Meta Description",
        body: "Bingung memilih sepatu futsal? Panduan lengkap ini membahas outsole, material, ukuran, dan rekomendasi berdasarkan level bermain. Ditulis oleh atlet dan diuji langsung di lapangan.",
        copyable: true,
      },
    ],
    implemented: false,
  },
  {
    id: "4",
    category: "teknikal",
    priority: "medium",
    title: "Optimalkan Core Web Vitals untuk Halaman Kategori",
    description:
      "LCP di atas 2.5 detik mengurangi kemungkinan halaman diindeks untuk AI Overviews.",
    blocks: [
      {
        label: "Temuan & prioritas perbaikan",
        body: "Halaman /kategori/futsal memiliki LCP 4.2s. Penyebab utama: gambar hero tidak menggunakan lazy loading dan tidak ada width/height attribute yang mencegah layout shift.",
        copyable: false,
      },
    ],
    implemented: false,
  },
  {
    id: "5",
    category: "web_copy",
    priority: "medium",
    title: "Perbarui Copy di Halaman Pricing dan Perbandingan Produk",
    description:
      "Tambahkan frasa yang sering digunakan dalam pertanyaan komparasi di AI search.",
    blocks: [
      {
        label: "Comparison Table Headline",
        body: "Ortuseight vs Merek Lain: Perbandingan Jujur dari Sisi Material, Harga, dan Performa",
        copyable: true,
      },
    ],
    implemented: false,
  },
  {
    id: "6",
    category: "konten",
    priority: "medium",
    title: "Artikel Perbandingan: Sepatu Futsal Lokal vs Import",
    description:
      "Query komparasi adalah salah satu yang paling sering dijawab AI dengan kutipan langsung.",
    blocks: [
      {
        label: "Judul Artikel",
        body: "Sepatu Futsal Lokal vs Import 2025: Mana yang Lebih Worth It untuk Pemain Indonesia?",
        copyable: true,
      },
    ],
    implemented: false,
  },
  {
    id: "7",
    category: "teknikal",
    priority: "low",
    title: "Tambahkan Alt Text Deskriptif pada Semua Gambar Produk",
    description:
      "Alt text yang deskriptif membantu AI memahami konteks produk dari gambar.",
    blocks: [
      {
        label: "Contoh format Alt Text",
        body: 'Sebelum: alt="img_001.jpg"\nSesudah: alt="Ortuseight Ventura sepatu futsal indoor outsole flat hitam merah ukuran 39-44"',
        copyable: false,
      },
    ],
    implemented: false,
  },
  // Implemented
  {
    id: "8",
    category: "teknikal",
    priority: "high",
    title: "Perbaiki Meta Description Halaman Utama",
    description:
      "Meta description dengan kata kunci utama meningkatkan kemungkinan dikutip AI.",
    blocks: [],
    implemented: true,
  },
  {
    id: "9",
    category: "web_copy",
    priority: "medium",
    title: "Tambahkan Testimonial Customer Enterprise di Halaman B2B",
    description:
      "Social proof dari korporat meningkatkan kepercayaan AI dalam merekomendasikan produk.",
    blocks: [],
    implemented: true,
  },
];

/* ── Sub-components ── */

function PrioBars({ priority }: { priority: Priority }) {
  const label = PRIO[priority].label;
  const icon =
    priority === "high" ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 cursor-default">
        <rect x="16" y="4" width="4" height="16" rx="2" fill="#FB2C36" />
        <rect x="10" y="8" width="4" height="12" rx="2" fill="#FB2C36" />
        <rect x="4" y="12" width="4" height="8" rx="2" fill="#FB2C36" />
      </svg>
    ) : priority === "medium" ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 cursor-default">
        <rect x="16" y="4" width="4" height="16" rx="2" fill="#CCCCCC" />
        <rect x="10" y="8" width="4" height="12" rx="2" fill="#FF6900" />
        <rect x="4" y="12" width="4" height="8" rx="2" fill="#FF6900" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 cursor-default">
        <rect x="16" y="4" width="4" height="16" rx="2" fill="#CCCCCC" />
        <rect x="10" y="8" width="4" height="12" rx="2" fill="#CCCCCC" />
        <rect x="4" y="12" width="4" height="8" rx="2" fill="#F0B100" />
      </svg>
    );
  return <Tip label={label}>{icon}</Tip>;
}

function CatTag({ cat }: { cat: Category }) {
  const cfg = CAT[cat];
  return (
    <Tip label={cfg.tip}>
      <span className="inline-flex items-center h-[24px] px-2 rounded-[4px] border border-[var(--border-light)] type-caption font-medium text-text-muted whitespace-nowrap cursor-default select-none">
        {cfg.label}
      </span>
    </Tip>
  );
}

function renderBodyLine(line: string, i: number) {
  const bold = (text: string) =>
    text.split(/(\*\*.*?\*\*)/).map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={j}>{part}</span>
      )
    );

  if (line.startsWith("- ")) {
    return (
      <div key={i} className="flex gap-2 type-body">
        <span className="shrink-0 text-text-muted">•</span>
        <span>{bold(line.slice(2))}</span>
      </div>
    );
  }
  if (line.startsWith("**") && line.endsWith("**")) {
    return (
      <p key={i} className="font-semibold mt-3 mb-0.5 type-body">
        {bold(line)}
      </p>
    );
  }
  if (line === "") return <div key={i} className="h-2" />;
  return (
    <p key={i} className="type-body">
      {bold(line)}
    </p>
  );
}

function CopyBlock({
  label,
  body,
  mono = false,
}: {
  label: string;
  body: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const clean = body.replace(/\*\*/g, "");
    navigator.clipboard.writeText(clean).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-5">
      <p className="type-body font-semibold text-text-heading mb-2">
        {label}
      </p>
      <div className="rounded-md bg-[var(--bg-neutral)] p-4">
        <div className="flex justify-start mb-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 h-[32px] type-body font-medium text-text-muted hover:text-text-body transition-colors cursor-pointer"
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            {copied ? "Tersalin!" : "Salin"}
          </button>
        </div>
        <div
          className="type-body"
          style={{
            fontFamily: mono ? "ui-monospace, monospace" : "inherit",
            color: "var(--text-body)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {mono ? body : body.split("\n").map((line, i) => renderBodyLine(line, i))}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="mb-5">
      <p className="type-body font-semibold text-text-heading mb-2">
        {label}
      </p>
      <div className="rounded-md bg-[var(--bg-surface)] border border-border-default px-4 py-3">
        <p className="type-body text-text-body whitespace-pre-line">{body}</p>
      </div>
    </div>
  );
}

function RecItem({
  rec,
  selected,
  onClick,
  dimmed = false,
}: {
  rec: Rec;
  selected: boolean;
  onClick: () => void;
  dimmed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 px-8 py-3.5 border-b border-border-light transition-colors",
        selected ? "bg-[var(--bg-surface-raised)]" : "hover:bg-[var(--bg-surface)]",
        dimmed && "opacity-45"
      )}
    >
      <PrioBars priority={rec.priority} />
      <span
        className={cn(
          "flex-1 min-w-0 type-body leading-snug truncate",
          selected ? "font-semibold text-text-heading" : "text-text-body"
        )}
      >
        {rec.title}
      </span>
      <CatTag cat={rec.category} />
    </button>
  );
}

/* ── Generate Modal ── */

function categoryPrioHint(score: number): { label: string; color: string } {
  if (score < 40) return { label: "Prioritas tinggi", color: "#DC2626" };
  if (score < 65) return { label: "Prioritas sedang", color: "#D97706" };
  return { label: "Prioritas rendah", color: "#16A34A" };
}

function GenerateModal({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: () => void;
}) {
  const cats: Category[] = ["teknikal", "web_copy", "konten"];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-[440px] p-6 shadow-[var(--shadow-modal)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-semibold text-text-heading type-body">Buat Rekomendasi Baru</h3>
            <p className="type-body text-text-muted mt-0.5">
              Berdasarkan hasil audit terakhir Ortuseight
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-body mt-0.5">
            <IconX size={17} />
          </button>
        </div>

        <p className="type-body font-semibold text-text-heading mb-3">
          Estimasi prioritas rekomendasi
        </p>
        <div className="space-y-2 mb-5">
          {cats.map((cat) => {
            const score = AUDIT_SCORES[cat];
            const hint = categoryPrioHint(score);
            return (
              <div
                key={cat}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border-default"
              >
                <div className="flex items-center gap-2.5">
                  <CatTag cat={cat} />
                  <span className="type-caption text-text-muted">Skor audit: {score}/100</span>
                </div>
                <span className="type-caption font-semibold" style={{ color: hint.color }}>
                  {hint.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--bg-surface)] border border-border-default mb-5">
          <IconInfoCircle size={14} className="text-text-muted shrink-0 mt-0.5" />
          <p className="type-body text-text-muted leading-relaxed">
            Menghasilkan 3 rekomendasi (1 per kategori) secara paralel. Proses biasanya selesai dalam
            5–10 detik.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 type-body font-medium rounded-md border border-border-default text-text-body hover:bg-[var(--bg-surface)] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onGenerate}
            className="flex-1 py-2 type-caption font-semibold rounded-md text-white bg-brand flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
          >
            <IconSparkles size={14} />
            Buat sekarang · 10 kredit
          </button>
        </div>
      </div>
    </div>
  );
}

function GeneratingOverlay({ onDone }: { onDone: () => void }) {
  const cats: Category[] = ["teknikal", "web_copy", "konten"];
  const [done, setDone] = useState<Set<Category>>(new Set());

  const stableDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    const t1 = setTimeout(() => setDone((d) => new Set([...d, "teknikal"])), 1800);
    const t2 = setTimeout(() => setDone((d) => new Set([...d, "web_copy"])), 2700);
    const t3 = setTimeout(() => setDone((d) => new Set([...d, "konten"])), 3500);
    const t4 = setTimeout(stableDone, 4200);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [stableDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-[440px] p-6 shadow-[var(--shadow-modal)]">
        <h3 className="font-semibold text-text-heading type-body mb-1">
          Membuat rekomendasi...
        </h3>
        <p className="type-caption text-text-muted mb-5">
          3 kategori diproses secara bersamaan
        </p>
        <div className="space-y-3">
          {cats.map((cat) => {
            const isDone = done.has(cat);
            return (
              <div
                key={cat}
                className="flex items-center gap-3 py-3 px-4 rounded-lg border border-border-default"
              >
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#DCFCE7]">
                      <IconCheck size={11} color="#16A34A" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 animate-spin border-brand border-t-transparent" />
                  )}
                </div>
                <CatTag cat={cat} />
                <span className="type-caption text-text-muted ml-auto">
                  {isDone ? "Selesai" : "Memproses..."}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */

type GenState = "idle" | "modal" | "generating";
type DemoMode = "normal" | "limit";

export default function KontenV2Page() {
  const [recs, setRecs] = useState<Rec[]>(INITIAL_RECS);
  const [selected, setSelected] = useState<Rec | null>(INITIAL_RECS[2]);
  const [showImpl, setShowImpl] = useState(false);
  const [genState, setGenState] = useState<GenState>("idle");
  const [demoMode, setDemoMode] = useState<DemoMode>("normal");

  // Override main's scroll+padding so this page owns its own scroll
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const prevOverflow = main.style.overflow;
    const prevPadding = main.style.padding;
    main.style.overflow = "hidden";
    main.style.padding = "0";
    return () => {
      main.style.overflow = prevOverflow;
      main.style.padding = prevPadding;
    };
  }, []);

  const active = recs.filter((r) => !r.implemented);
  const implemented = recs.filter((r) => r.implemented);
  const LIMIT = 10;
  const isAtLimit = demoMode === "limit" || active.length >= LIMIT;
  const allImplemented = active.length === 0;

  // Keep selected in sync when recs change
  useEffect(() => {
    if (selected) {
      const updated = recs.find((r) => r.id === selected.id);
      setSelected(updated ?? null);
    }
  }, [recs]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMarkImplemented(id: string) {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, implemented: true } : r)));
    toast("Rekomendasi ditandai sudah diimplementasi");
  }

  function handleUnmarkImplemented(id: string) {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, implemented: false } : r)));
    toast("Rekomendasi ditandai belum diimplementasi");
  }

  const handleGenerateDone = useCallback(() => {
    setGenState("idle");
  }, []);

  function resetDemo() {
    setRecs(INITIAL_RECS);
    setSelected(INITIAL_RECS[2]);
    setDemoMode("normal");
    setShowImpl(false);
  }

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex h-full w-full">
      {/* ── LEFT PANEL ── */}
      <div
        className="flex flex-col min-h-0 border-r border-border-default shrink-0 bg-white w-[380px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 h-[52px] border-b border-border-default shrink-0">
          <div className="flex items-center gap-2">
            <span className="type-title text-text-heading">Rekomendasi</span>
          </div>
          <Tip
            label={
              isAtLimit
                ? "Tandai minimal 1 rekomendasi sebagai terimplementasi untuk membuka slot baru."
                : "Hasilkan 3 rekomendasi baru (1 per kategori) · 10 kredit"
            }
          >
            <span>
              <Button
                variant="default"
                size="sm"
                disabled={isAtLimit}
                onClick={() => !isAtLimit && setGenState("modal")}
              >
                <IconSparkles size={13} />
                Buat rekomendasi
              </Button>
            </span>
          </Tip>
        </div>

        {/* Rekomendasi aktif counter */}
        {!allImplemented && (
          <div className="flex items-center justify-between px-8 py-2.5 border-b border-border-default shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="type-caption text-text-muted">Rekomendasi aktif</span>
              <Tip label="Anda dapat menyimpan hingga 10 rekomendasi yang belum diimplementasikan">
                <IconInfoCircle size={13} className="text-text-muted cursor-default hover:text-text-body transition-colors" />
              </Tip>
            </div>
            <span className={cn("type-caption tabular-nums", isAtLimit ? "text-error" : "text-text-muted")}>
              {isAtLimit ? "10" : active.length}/10
            </span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {allImplemented ? (
            /* ── All-implemented success state ── */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[#DCFCE7]">
                <IconCheck size={22} color="#16A34A" />
              </div>
              <p className="font-semibold text-text-heading type-body mb-1.5">
                Semua rekomendasi telah diimplementasi!
              </p>
              <p className="type-body text-text-muted mb-5">
                {implemented.length} rekomendasi selesai. Skor AI visibility Anda meningkat sejak
                pertama menggunakan Konten.
              </p>
              <button
                onClick={() => setGenState("modal")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md type-caption font-semibold text-white bg-brand transition-opacity hover:opacity-90"
              >
                <IconSparkles size={14} />
                Buat rekomendasi baru · 10 kredit
              </button>
            </div>
          ) : (
            <>
              {/* Active recommendations */}
              {active.map((rec) => (
                <RecItem
                  key={rec.id}
                  rec={rec}
                  selected={selected?.id === rec.id}
                  onClick={() => setSelected(rec)}
                />
              ))}

              {/* Implemented section */}
              {implemented.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowImpl((v) => !v)}
                    className={cn(
                      "flex items-center justify-between w-full px-8 py-2.5 rounded-sm cursor-pointer text-left transition-colors duration-100 border-t border-border-light",
                      showImpl ? "bg-surface-raised" : "bg-transparent hover:bg-surface"
                    )}
                  >
                    <span className={cn(
                      "type-body flex items-center gap-1.5",
                      showImpl ? "font-semibold text-text-heading" : "text-text-muted"
                    )}>
                      <IconCheck size={14} stroke={1.5} />
                      Terimplementasi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "type-caption shrink-0 tabular-nums",
                        showImpl ? "text-text-heading font-semibold" : "text-text-muted"
                      )}>{implemented.length}</span>
                      <IconChevronDown
                        size={14}
                        className={cn("transition-transform duration-200", showImpl && "rotate-180")}
                      />
                    </span>
                  </button>
                  {showImpl &&
                    implemented.map((rec) => (
                      <RecItem
                        key={rec.id}
                        rec={rec}
                        selected={selected?.id === rec.id}
                        onClick={() => setSelected(rec)}
                        dimmed
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Demo state controls */}
        <div className="px-4 py-3 border-t border-border-default bg-[var(--bg-surface)] shrink-0">
          <p className="type-caption font-semibold text-text-muted uppercase tracking-wide mb-2">
            Demo states
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {(["normal", "limit"] as DemoMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setDemoMode(mode)}
                className={cn(
                  "type-caption px-2 py-0.5 rounded border font-medium transition-colors",
                  demoMode === mode
                    ? "bg-text-heading text-white border-text-heading"
                    : "border-border-default text-text-muted hover:border-border-strong"
                )}
              >
                {mode === "normal" ? "Normal (7/10)" : "Limit (10/10)"}
              </button>
            ))}
            <button
              onClick={() => {
                setRecs((prev) => prev.map((r) => ({ ...r, implemented: true })));
                setSelected(null);
              }}
              className="type-caption px-2 py-0.5 rounded border border-border-default text-text-muted hover:border-border-strong font-medium transition-colors"
            >
              All implemented
            </button>
            <button
              onClick={resetDemo}
              className="type-caption px-2 py-0.5 rounded border border-border-default text-text-muted hover:border-border-strong font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white">
        {selected ? (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-8 h-[52px] border-b border-border-default shrink-0">
              <div className="flex items-center gap-2">
                <span className="type-title text-text-heading">Detail</span>
                <Tip label="Konten siap pakai yang dapat langsung diimplementasikan ke website Anda.">
                  <IconInfoCircle size={14} className="text-text-muted cursor-default" />
                </Tip>
              </div>
              {selected.implemented ? (
                <button
                  onClick={() => handleUnmarkImplemented(selected.id)}
                  className="flex items-center gap-1.5 type-body font-medium text-error hover:opacity-80 transition-opacity"
                >
                  Belum diimplementasi
                  <IconX size={16} />
                </button>
              ) : (
                <button
                  onClick={() => handleMarkImplemented(selected.id)}
                  className="flex items-center gap-1.5 type-body font-medium text-text-muted hover:text-text-body transition-colors"
                >
                  Sudah diimplementasi
                  <IconCheck size={16} />
                </button>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0 px-8 py-5">
              <div className="mb-3">
                <CatTag cat={selected.category} />
              </div>
              <p className="type-heading-sm text-text-heading mb-2">
                {selected.title}
              </p>
              <p className="type-body text-text-muted mb-6">
                {selected.description}
              </p>

              {selected.blocks.map((block, i) => {
                const isMonospace =
                  block.body.trimStart().startsWith("{") && block.body.includes('"@');
                return block.copyable ? (
                  <CopyBlock
                    key={i}
                    label={block.label}
                    body={block.body}
                    mono={isMonospace}
                  />
                ) : (
                  <InfoBlock key={i} label={block.label} body={block.body} />
                );
              })}

              {selected.implemented && selected.blocks.length === 0 && (
                <p className="type-caption text-text-muted italic">
                  Rekomendasi ini telah ditandai sebagai terimplementasi.
                </p>
              )}

              <div className="h-2" />
            </div>

          </>
        ) : (
          /* No selection state */
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <p className="type-body text-text-muted max-w-xs">
              Pilih rekomendasi untuk melihat detail dan konten yang siap diimplementasikan.
            </p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {genState === "modal" && (
        <GenerateModal
          onClose={() => setGenState("idle")}
          onGenerate={() => setGenState("generating")}
        />
      )}
      {genState === "generating" && <GeneratingOverlay onDone={handleGenerateDone} />}
    </div>
    </TooltipProvider>
  );
}
