"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconLoader2 } from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const steps = [
  { state: "done", label: "Scraping website" },
  { state: "done", label: "Mendeteksi bahasa", subtitle: "Terdeteksi: Bahasa Indonesia" },
  { state: "active", label: "Menganalisis produk kamu" },
  { state: "pending", label: "Menghasilkan differentiators" },
  { state: "pending", label: "Mencari kompetitor" },
  { state: "pending", label: "Membuat profil bisnis" },
] as const;

export default function AnalyzePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const brand = sessionStorage.getItem('nuave_pending_brand');
    const url = sessionStorage.getItem('nuave_pending_url');

    if (!brand || !url) {
      router.push('/');
      return;
    }

    async function triggerScrape() {
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website_url: url, brand_name: brand })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal menganalisis website');
        }

        const data = await res.json();
        sessionStorage.setItem('nuave_profile', JSON.stringify(data));

        // Clear pending items
        sessionStorage.removeItem('nuave_pending_brand');
        sessionStorage.removeItem('nuave_pending_url');

        router.push('/onboarding/profile');
      } catch (err: any) {
        console.error('Scrape error:', err);
        setError(err.message || 'Terjadi kesalahan saat analisis');
      }
    }

    triggerScrape();
  }, [router]);

  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="max-w-[480px] w-full px-6 py-10">

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex justify-between mb-2.5">
            <span className="type-caption text-text-muted">Menganalisis brand kamu</span>
            <span className="type-caption text-text-muted">Langkah 2 dari 4</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-[3px] flex-1 rounded-full",
                  i < 2 ? "bg-brand" : "bg-border-default"
                )}
              />
            ))}
          </div>
        </div>

        {/* Step list */}
        <div className="flex flex-col gap-2">
          {error ? (
            <div className="text-center py-6">
              <p className="text-error mb-4">{error}</p>
              <Button variant="brand" onClick={() => window.location.reload()}>
                Coba lagi
              </Button>
            </div>
          ) : steps.map((step) => {
            const isDone = step.state === "done";
            const isActive = step.state === "active";

            return (
              <div
                key={step.label}
                className={cn(
                  "flex flex-row items-center gap-3.5 px-4 py-3 rounded-[var(--radius-md)] border border-border-default",
                  isActive ? "bg-surface" : "bg-white",
                  isDone && "border-l-[3px] border-l-[var(--green)]",
                  isActive && "border-l-[3px] border-l-brand",
                )}
              >
                {/* Icon circle */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full shrink-0 flex items-center justify-center box-border",
                    isDone && "bg-[var(--green-light)]",
                    isActive && "border-2 border-brand",
                    !isDone && !isActive && "bg-surface-raised"
                  )}
                >
                  {isDone && <IconCheck size={16} stroke={2.5} color="var(--green)" />}
                  {isActive && <IconLoader2 size={18} stroke={2.5} color="var(--purple)" className="animate-spin" />}
                </div>

                {/* Label + subtitle */}
                <div>
                  <div className={cn(
                    "type-body",
                    step.state === "pending" ? "text-text-placeholder" : "text-text-heading",
                    isDone && "font-medium",
                    isActive && "font-semibold",
                  )}>
                    {step.label}
                  </div>
                  {"subtitle" in step && step.subtitle && (
                    <div className="type-caption text-text-muted mt-0.5">
                      {step.subtitle}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
