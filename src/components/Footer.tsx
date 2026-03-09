"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-default)",
      marginTop: "48px",
      padding: "32px 16px",
      background: "var(--surface)",
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" style={{ display: 'block' }} />
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>Nuave</span>
        </div>

        {/* Contact & Social */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href="mailto:hello.nuave@gmail.com"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            hello.nuave@gmail.com
          </a>

          <a
            href="https://instagram.com/nuave.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
            </svg>
            @nuave.ai
          </a>

          <a
            href="https://x.com/nuaveAI"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            @nuaveAI
          </a>
        </div>

        {/* Legal Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
          <Link href="/harga" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
            Harga
          </Link>
          <span>·</span>
          <Link href="/support" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
            Bantuan
          </Link>
          <span>·</span>
          <Link href="/privacy" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
            Kebijakan Privasi
          </Link>
          <span>·</span>
          <Link href="/terms" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
            Syarat &amp; Ketentuan
          </Link>
        </div>

        {/* Copyright */}
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
          © {new Date().getFullYear()} Nuave. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
