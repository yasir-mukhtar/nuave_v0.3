"use client";

import { useEffect, useState } from "react";
import { useRouter } from "navigation";
import { IconCheck, IconLoader2 } from '@tabler/icons-react';

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
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "480px", width: "100%", padding: "40px 24px" }}>

          {/* Progress bar */}
          <div style={{ marginBottom: "40px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Menganalisis brand kamu
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Langkah 2 dari 4
              </span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "3px",
                    flex: 1,
                    borderRadius: "999px",
                    background: i < 2 ? "var(--purple)" : "var(--border-default)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Step list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {error ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ color: 'var(--red)', marginBottom: '16px' }}>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'var(--purple)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Coba lagi
                </button>
              </div>
            ) : steps.map((step) => {
              const isDone = step.state === "done";
              const isActive = step.state === "active";

              return (
                <div
                  key={step.label}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    background: isActive ? "var(--bg-surface)" : "#ffffff",
                    border: "1px solid var(--border-default)",
                    borderLeft: isDone
                      ? "3px solid var(--green)"
                      : isActive
                      ? "3px solid var(--purple)"
                      : "1px solid var(--border-default)",
                  }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDone
                        ? "var(--green-light)"
                        : isActive
                        ? "transparent"
                        : "var(--bg-surface-raised)",
                      border: isActive ? "2px solid var(--purple)" : "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {isDone && <IconCheck size={16} stroke={2.5} color="var(--green)" />}
                    {isActive && <IconLoader2 size={18} stroke={2.5} color="var(--purple)" className="animate-spin" />}
                  </div>

                  {/* Label + subtitle */}
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: isDone || isActive ? (isActive ? 600 : 500) : 400,
                        color: step.state === "pending" ? "var(--text-placeholder)" : "var(--text-heading)",
                      }}
                    >
                      {step.label}
                    </div>
                    {"subtitle" in step && step.subtitle && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
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
    </>
  );
}
