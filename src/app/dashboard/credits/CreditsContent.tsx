"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

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
    // For now, show placeholder
    await new Promise((r) => setTimeout(r, 800));
    alert("Pembayaran akan segera tersedia. Terima kasih atas kesabaran Anda!");
    setPaying(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border-default)",
        padding: "0 32px", height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" style={{ display: 'block' }} />
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>Nuave</span>
          </div>
        </Link>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>

        {/* Back button + Title */}
        <div style={{ marginBottom: "40px" }}>
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/dashboard");
              }
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "13px", color: "var(--text-muted)", background: "none",
              border: "none", cursor: "pointer", padding: 0, marginBottom: "16px",
            }}
          >
            <IconArrowLeft size={16} stroke={1.5} />
            Kembali ke dashboard
          </button>
          <h1 style={{ fontSize: "28px", margin: "0 0 8px 0" }}>
            Beli Kredit
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: 0 }}>
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>

          {/* Package selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "20px 24px", borderRadius: 'var(--radius-lg)', cursor: "pointer",
                  background: selected === pkg.id ? "var(--purple-light)" : "#ffffff",
                  border: `2px solid ${selected === pkg.id ? "var(--purple)" : "var(--border-default)"}`,
                  textAlign: "left", transition: "all 150ms ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {/* Radio */}
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    border: `2px solid ${selected === pkg.id ? "var(--purple)" : "#D1D5DB"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {selected === pkg.id && (
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--purple)" }} />
                    )}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-heading)" }}>{pkg.name}</span>
                      {pkg.popular && (
                        <span style={{
                          fontSize: "10px", fontWeight: 700, color: "var(--purple)",
                          background: "var(--purple-light)", padding: "2px 8px",
                          borderRadius: 'var(--radius-full)', letterSpacing: "0.05em",
                        }}>POPULER</span>
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>{pkg.description}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "16px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: selected === pkg.id ? "var(--purple)" : "var(--text-heading)" }}>
                    {pkg.price}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{pkg.credits} kredit</div>
                </div>
              </button>
            ))}
          </div>

          {/* Order summary */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-default)",
            borderRadius: 'var(--radius-xl)', padding: "28px", position: "sticky", top: "72px",
          }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 20px 0" }}>
              Ringkasan Pesanan
            </h2>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Paket</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-heading)" }}>{selectedPkg.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Kredit</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-heading)" }}>{selectedPkg.credits} kredit</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>Masa berlaku</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-heading)" }}>Tidak kadaluarsa</span>
            </div>

            <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-heading)" }}>Total</span>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--purple)" }}>{selectedPkg.price}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              style={{
                width: "100%", padding: "14px", borderRadius: 'var(--radius-md)',
                fontSize: "15px", fontWeight: 600, color: "#ffffff",
                background: paying ? "#9CA3AF" : "var(--purple)",
                border: "none", cursor: paying ? "not-allowed" : "pointer",
                transition: "all 150ms ease", marginBottom: "12px",
              }}
            >
              {paying ? "Memproses..." : `Bayar ${selectedPkg.price} →`}
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Pembayaran aman via Midtrans</span>
            </div>

            <div style={{ marginTop: "20px", borderTop: "1px solid var(--border-default)", paddingTop: "16px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px 0", fontWeight: 600 }}>Metode pembayaran:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["Virtual Account", "GoPay", "OVO", "QRIS", "Indomaret"].map((m) => (
                  <span key={m} style={{
                    fontSize: "11px", color: "var(--text-muted)",
                    background: "#ffffff", border: "1px solid var(--border-default)",
                    borderRadius: 'var(--radius-xs)', padding: "2px 8px",
                  }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
