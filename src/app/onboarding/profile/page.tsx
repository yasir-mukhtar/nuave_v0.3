"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconPencil, IconX, IconPlus, IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

function ProgressBar({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", gap: "4px", maxWidth: "200px", width: "100%" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: "3px",
            flex: 1,
            borderRadius: "999px",
            background: i < active ? "var(--purple)" : "var(--border-default)",
          }}
        />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-muted)",
        marginBottom: "16px",
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="field-label" style={{ marginBottom: "6px" }}>
      {children}
    </label>
  );
}

function PurpleChip({ label, showX = true }: { label: string; showX?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--purple-light)",
        color: "var(--purple)",
        borderRadius: "var(--radius-full)",
        padding: "4px 12px",
        fontSize: "13px",
        fontWeight: 500,
      }}
    >
      {label}
      {showX && (
        <button
          style={{
            background: "none",
            border: "none",
            color: "var(--purple)",
            marginLeft: "6px",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconX size={14} stroke={2} />
        </button>
      )}
    </span>
  );
}

function GrayChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--bg-surface-raised)",
        color: "var(--text-body)",
        borderRadius: "var(--radius-full)",
        padding: "4px 12px",
        fontSize: "13px",
        fontWeight: 500,
      }}
    >
      {label}
      <button
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          marginLeft: "6px",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconX size={14} stroke={2} />
      </button>
    </span>
  );
}

function AddChip() {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "transparent",
        color: "var(--text-muted)",
        borderRadius: "var(--radius-full)",
        padding: "4px 12px",
        fontSize: "13px",
        fontWeight: 500,
        border: "1px dashed var(--border-strong)",
        cursor: "pointer",
        gap: "4px",
      }}
    >
      <IconPlus size={14} stroke={2} /> Tambah
    </button>
  );
}

interface Profile {
  brand_name: string;
  company_overview: string;
  industry: string;
  differentiators: string[];
  competitors: string[];
  target_audience?: string;
  language?: string;
  website_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("nuave_profile");
    if (!stored) {
      router.push("/");
      return;
    }
    const data = JSON.parse(stored);
    const profileData = data.profile || {};

    if (typeof profileData.differentiators === 'string') {
      profileData.differentiators = profileData.differentiators
        .split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (typeof profileData.competitors === 'string') {
      profileData.competitors = profileData.competitors
        .split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    
    // Get website_url from API response or pending data
    const pendingUrl = sessionStorage.getItem('nuave_pending_url');
    const website_url = profileData.website_url || data.website_url || pendingUrl || "";
    
    setProfile({
      ...profileData,
      website_url
    });
    setWorkspaceId(data.workspace_id);
  }, []);

  async function handleGeneratePrompts() {
    console.log('workspace_id:', workspaceId);
    console.log('profile:', profile);
    setError(null);
    setLoading(true);
    try {
      if (!workspaceId) {
        throw new Error("ID workspace tidak ditemukan. Silakan coba ulangi audit.");
      }
      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        return;
      }
      // Update nuave_profile with the latest profile data (which now includes website_url)
      const stored = sessionStorage.getItem("nuave_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.profile = profile;
        sessionStorage.setItem("nuave_profile", JSON.stringify(parsed));
      }
      
      sessionStorage.setItem("nuave_prompts", JSON.stringify(data));
      router.push("/onboarding/prompts");
    } catch {
      setError("Kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-page)",
          fontSize: "var(--text-base)",
          color: "var(--text-muted)",
        }}
      >
        Memuat profil…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        padding: "40px 32px",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <IconArrowLeft size={18} stroke={1.5} /> Kembali
          </button>
          <ProgressBar active={3} />
          <div style={{ width: "56px" }} />
        </div>

        {/* Section header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "var(--text-2xl)",
              fontWeight: 700,
              color: "var(--text-heading)",
              margin: 0,
            }}
          >
            Detail Perusahaan
          </h1>
          <p
            style={{
              fontSize: "var(--text-base)",
              color: "var(--text-muted)",
              marginTop: "4px",
              marginBottom: 0,
            }}
          >
            Tinjau dan edit sebelum melanjutkan.
          </p>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: "40px",
          }}
        >
          {/* LEFT: editable form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Company name */}
            <div>
              <FieldLabel>Nama perusahaan</FieldLabel>
              <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  defaultValue={profile.brand_name}
                  style={{
                    flex: 1,
                    fontSize: "14px",
                    color: "var(--text-body)",
                    background: "#ffffff",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IconPencil size={18} stroke={1.5} />
                </button>
              </div>
            </div>

            {/* Logo */}
            <div>
              <FieldLabel>Logo</FieldLabel>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  color: "var(--text-muted)",
                }}
              >
                {profile.brand_name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Company overview */}
            <div>
              <FieldLabel>Company overview</FieldLabel>
              <textarea
                rows={5}
                defaultValue={profile.company_overview}
                style={{
                  width: "100%",
                  fontSize: "14px",
                  color: "var(--text-body)",
                  background: "#ffffff",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Differentiators */}
            <div>
              <FieldLabel>Keunggulan brand kamu?</FieldLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {profile.differentiators.map((d) => (
                  <PurpleChip key={d} label={d} />
                ))}
                <AddChip />
              </div>
            </div>

            {/* Competitors */}
            <div>
              <FieldLabel>Kompetitor utama</FieldLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {profile.competitors.map((c) => (
                  <GrayChip key={c} label={c} />
                ))}
                <AddChip />
              </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: "32px", textAlign: "right" }}>
              {error && (
                <p style={{ fontSize: "13px", color: "#e53e3e", marginBottom: "10px" }}>{error}</p>
              )}
              <button
                onClick={handleGeneratePrompts}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "#ffffff",
                  background: "var(--purple)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 24px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Menyiapkan…" : (
                  <>
                    Buat Prompt <IconArrowRight size={18} stroke={1.5} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: sticky preview card */}
          <div style={{ position: "sticky", top: "40px", alignSelf: "start" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
              }}
            >
              <SectionLabel>Preview</SectionLabel>

              {/* Logo + name */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--purple-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--purple)",
                    flexShrink: 0,
                  }}
                >
                  {profile.brand_name.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-heading)",
                  }}
                >
                  {profile.brand_name}
                </span>
              </div>

              {/* Overview */}
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-body)",
                  lineHeight: 1.6,
                  margin: "0 0 16px 0",
                }}
              >
                {profile.company_overview}
              </p>

              {/* Differentiators */}
              <SectionLabel>Differentiators</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                {profile.differentiators.map((d) => (
                  <PurpleChip key={d} label={d} showX={false} />
                ))}
              </div>

              {/* Competitors */}
              <SectionLabel>Kompetitor</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {profile.competitors.map((c) => (
                  <span
                    key={c}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "var(--bg-surface-raised)",
                      color: "var(--text-body)",
                      borderRadius: "var(--radius-full)",
                      padding: "4px 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
