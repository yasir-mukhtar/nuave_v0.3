"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    price: "Rp 75.000",
    credits: 50,
    popular: false,
    description: "Cocok untuk bisnis yang ingin mencoba AEO pertama kali.",
  },
  {
    id: "growth",
    name: "Growth",
    price: "Rp 199.000",
    credits: 150,
    popular: true,
    description: "Untuk bisnis yang aktif membangun visibilitas AI mereka.",
  },
  {
    id: "agency",
    name: "Agency",
    price: "Rp 599.000",
    credits: 500,
    popular: false,
    description: "Untuk agensi yang mengelola banyak merek klien sekaligus.",
  },
];

export default function CreditsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState("growth");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const pkg = searchParams.get("package");
    if (pkg && PACKAGES.find((p) => p.id === pkg)) {
      setSelected(pkg);
    }
  }, [searchParams]);

  const selectedPkg = PACKAGES.find((p) => p.id === selected)!;

  async function handlePay() {
    setPaying(true);
    // TODO: call /api/credits/purchase with selected package
    await new Promise((r) => setTimeout(r, 800));
    alert("Pembayaran akan segera tersedia. Terima kasih atas kesabaran Anda!");
    setPaying(false);
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-[8px] border-b border-border-default px-8 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" className="block" />
          <span className="text-[18px] font-bold text-text-heading">Nuave</span>
        </Link>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-12">

        {/* Back button + Title */}
        <div className="mb-10">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/dashboard");
              }
            }}
            className="inline-flex items-center gap-1.5 type-caption text-text-muted bg-transparent border-none cursor-pointer p-0 mb-4 hover:text-text-body transition-colors"
          >
            <IconArrowLeft size={16} stroke={1.5} />
            Kembali ke dashboard
          </button>
          <h1 className="text-[28px] m-0 mb-2">
            Beli Kredit
          </h1>
          <p className="type-body text-text-muted m-0">
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda.
          </p>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-8 items-start">

          {/* Package selector */}
          <div className="flex flex-col gap-4">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={cn(
                  "flex items-center justify-between px-6 py-5 rounded-[var(--radius-lg)] cursor-pointer text-left transition-all duration-150",
                  selected === pkg.id
                    ? "bg-[var(--purple-light)] border-2 border-brand"
                    : "bg-white border-2 border-border-default"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Radio */}
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    selected === pkg.id ? "border-brand" : "border-[#D1D5DB]"
                  )}>
                    {selected === pkg.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="type-body font-semibold text-text-heading">{pkg.name}</span>
                      {pkg.popular && (
                        <span className="text-[10px] font-bold text-brand bg-[var(--purple-light)] px-2 py-px rounded-full tracking-[0.05em]">
                          POPULER
                        </span>
                      )}
                    </div>
                    <p className="type-caption text-text-muted m-0">{pkg.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className={cn("text-[18px] font-bold", selected === pkg.id ? "text-brand" : "text-text-heading")}>
                    {pkg.price}
                  </div>
                  <div className="type-caption text-text-muted">{pkg.credits} kredit</div>
                </div>
              </button>
            ))}
          </div>

          {/* Order summary */}
          <div className="bg-surface border border-border-default rounded-[var(--radius-xl)] p-7 sticky top-[72px]">
            <h2 className="type-body font-semibold m-0 mb-5">
              Ringkasan Pesanan
            </h2>

            <div className="flex justify-between mb-3">
              <span className="type-body text-text-muted">Paket</span>
              <span className="type-body font-medium text-text-heading">{selectedPkg.name}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="type-body text-text-muted">Kredit</span>
              <span className="type-body font-medium text-text-heading">{selectedPkg.credits} kredit</span>
            </div>
            <div className="flex justify-between mb-5">
              <span className="type-body text-text-muted">Masa berlaku</span>
              <span className="type-body font-medium text-text-heading">Tidak kadaluarsa</span>
            </div>

            <div className="border-t border-border-default pt-4 mb-5">
              <div className="flex justify-between">
                <span className="type-body font-semibold text-text-heading">Total</span>
                <span className="text-[20px] font-bold text-brand">{selectedPkg.price}</span>
              </div>
            </div>

            <Button
              variant="brand"
              className="w-full mb-3"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? "Memproses..." : `Bayar ${selectedPkg.price} →`}
            </Button>

            <div className="flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span className="type-caption text-text-muted">Pembayaran aman via Midtrans</span>
            </div>

            <div className="mt-5 border-t border-border-default pt-4">
              <p className="type-caption text-text-muted m-0 mb-1.5 font-semibold">Metode pembayaran:</p>
              <div className="flex flex-wrap gap-1.5">
                {["Virtual Account", "GoPay", "OVO", "QRIS", "Indomaret"].map((m) => (
                  <span key={m} className="text-[11px] text-text-muted bg-white border border-border-default rounded-[var(--radius-xs)] px-2 py-px">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
