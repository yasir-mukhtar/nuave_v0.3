"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconArrowRight } from '@tabler/icons-react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              background: "var(--purple)",
              borderRadius: "3px",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-heading)" }}>
            Nuave
          </span>
        </div>

        {/* Nav buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              background: "transparent",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: "7px 16px",
              cursor: "pointer",
            }}
          >
            Log in
          </button>
          <button
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#ffffff",
              background: "var(--purple)",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "7px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Start free audit <IconArrowRight size={18} stroke={1.5} />
          </button>
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
          <div className="card card-container" style={{ width: "100%", gap: "16px" }}>
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
    </>
  );
}
