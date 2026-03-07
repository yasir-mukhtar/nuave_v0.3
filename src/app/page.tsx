"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCheck, IconArrowRight } from '@tabler/icons-react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  async function handleSubmit() {
    console.log('handleSubmit called');
    setError(null);
    setLoading(true);

    try {
      // 1. Save input to sessionStorage
      sessionStorage.setItem('nuave_pending_brand', brandName);
      sessionStorage.setItem('nuave_pending_url', websiteUrl);

      // 2. Check if user is already logged in
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // 3. If session exists -> go straight to scrape flow
        router.push('/onboarding/analyze');
      } else {
        // 4. If no session -> redirect to auth
        router.push('/auth');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Header */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "56px",
          background: "#ffffff",
          borderBottom: "1px solid var(--border-default)",
          padding: "0 32px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <Link 
          href="/"
          style={{ 
            display: "flex", 
            flexDirection: "row", 
            gap: "8px", 
            alignItems: "center",
            textDecoration: "none"
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" style={{ display: 'block' }} />
            <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>Nuave</span>
          </div>
        </Link>

        {/* Nav buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/harga"
            style={{ fontSize: "14px", color: "var(--text-body)", textDecoration: "none", padding: "8px 16px" }}
          >
            Harga
          </Link>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              style={{
                fontSize: "14px", fontWeight: 500, color: "#ffffff",
                background: "var(--purple)", textDecoration: "none",
                padding: "8px 20px", borderRadius: "8px",
              }}
            >
              Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/auth"
                style={{ 
                  fontSize: "14px", fontWeight: 500, color: "var(--purple)",
                  background: "transparent", textDecoration: "none",
                  padding: "8px 20px", borderRadius: "8px",
                  border: "1.5px solid var(--purple)",
                }}
              >
                Masuk
              </Link>
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.querySelector('form') || document.getElementById('audit-form');
                  if (form) form.scrollIntoView({ behavior: 'smooth' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  fontSize: "14px", fontWeight: 500, color: "#ffffff",
                  background: "var(--purple)", textDecoration: "none",
                  padding: "8px 20px", borderRadius: "8px",
                }}
              >
                Daftar gratis →
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="hero-section">
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            padding: "0 16px",
          }}
        >
          {/* Pill */}
          <span
            style={{
              display: "inline-flex",
              background: "var(--purple-light)",
              color: "var(--purple)",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "var(--radius-full)",
              padding: "4px 14px",
            }}
          >
            Free AI Visibility Audit
          </span>

          {/* Headline */}
          <h1
            className="display-heading"
            style={{
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Does ChatGPT know your brand?
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: "var(--text-lg)",
              color: "#6B7280",
              maxWidth: "440px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Find out in 2 minutes. See your visibility score, discover what competitors rank for,
            and get a roadmap to improve.
          </p>

          {/* Form card */}
          <div className="card card-container" style={{ width: "100%", gap: "16px" }} id="audit-form">
            <div className="form-field">
              <label>Brand Name</label>
              <input
                className="input-large"
                type="text"
                placeholder="e.g. Nuave"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Website URL</label>
              <input
                className="input-large"
                type="url"
                placeholder="e.g. https://nuave.id"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            {error && (
              <p style={{ fontSize: "13px", color: "#e53e3e", margin: 0 }}>{error}</p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                fontSize: "var(--text-base)",
                fontWeight: 600,
                color: "#ffffff",
                background: "var(--purple)",
                border: "none",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Analyzing…" : (
                <>
                  Start Free Audit <IconArrowRight size={18} stroke={1.5} />
                </>
              )}
            </button>
          </div>

          {/* Trust line */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#9CA3AF" }}>
              <IconCheck size={16} stroke={2} color="var(--purple)" /> Free
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#9CA3AF" }}>
              <IconCheck size={16} stroke={2} color="var(--purple)" /> No sign up required
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#9CA3AF" }}>
              <IconCheck size={16} stroke={2} color="var(--purple)" /> Results in 60 seconds
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
