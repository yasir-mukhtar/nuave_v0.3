"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconPencil, IconX, IconPlus, IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { ButtonSpinner } from "@/components/ButtonSpinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ProgressBar({ active }: { active: number }) {
  return (
    <div className="flex gap-1 max-w-[200px] w-full">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn("h-[3px] flex-1 rounded-full", i < active ? "bg-brand" : "bg-border-default")}
        />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-4">
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="field-label mb-1.5">
      {children}
    </label>
  );
}

function PurpleChip({ label, showX = true }: { label: string; showX?: boolean }) {
  return (
    <span className="inline-flex items-center bg-[var(--purple-light)] text-brand rounded-full px-3 py-1 type-caption font-medium">
      {label}
      {showX && (
        <button className="bg-transparent border-none text-brand ml-1.5 cursor-pointer p-0 flex items-center">
          <IconX size={14} stroke={2} />
        </button>
      )}
    </span>
  );
}

function GrayChip({ label, showX = true }: { label: string; showX?: boolean }) {
  return (
    <span className="inline-flex items-center bg-surface-raised text-text-body rounded-full px-3 py-1 type-caption font-medium">
      {label}
      {showX && (
        <button className="bg-transparent border-none text-text-muted ml-1.5 cursor-pointer p-0 flex items-center">
          <IconX size={14} stroke={2} />
        </button>
      )}
    </span>
  );
}

function AddChip() {
  return (
    <button className="inline-flex items-center gap-1 bg-transparent text-text-muted rounded-full px-3 py-1 type-caption font-medium border border-dashed border-[var(--border-strong)] cursor-pointer hover:text-text-body transition-colors">
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
  const [brandId, setBrandId] = useState("");
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

    const pendingUrl = sessionStorage.getItem('nuave_pending_url');
    const website_url = profileData.website_url || data.website_url || pendingUrl || "";

    setProfile({ ...profileData, website_url });
    setBrandId(data.brand_id ?? "");
  }, []);

  async function handleGeneratePrompts() {
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      if (!brandId) {
        throw new Error("ID brand tidak ditemukan. Silakan coba ulangi analisis.");
      }
      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, profile }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        return;
      }

      const stored = sessionStorage.getItem("nuave_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.profile = profile;
        sessionStorage.setItem("nuave_profile", JSON.stringify(parsed));
      }

      sessionStorage.setItem("nuave_prompts", JSON.stringify(data));
      router.push("/onboarding/prompts");
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Permintaan melebihi batas waktu. Silakan coba lagi.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Kesalahan jaringan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page type-body text-text-muted">
        Memuat profil…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page px-8 py-10">
      <div className="max-w-[960px] mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 type-body text-text-muted bg-transparent border-none cursor-pointer hover:text-text-body transition-colors p-0"
          >
            <IconArrowLeft size={18} stroke={1.5} /> Kembali
          </button>
          <ProgressBar active={3} />
          <div className="w-14" />
        </div>

        {/* Section header */}
        <div className="mb-6">
          <h1 className="text-[length:var(--text-2xl)] m-0">Detail Perusahaan</h1>
          <p className="type-body text-text-muted mt-1 mb-0">Tinjau dan edit sebelum melanjutkan.</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1fr_400px] gap-10">

          {/* LEFT: editable form */}
          <div className="flex flex-col gap-6">

            {/* Company name */}
            <div>
              <FieldLabel>Nama perusahaan</FieldLabel>
              <div className="flex flex-row gap-2 items-center">
                <input
                  type="text"
                  defaultValue={profile.brand_name}
                  className="flex-1 type-body text-text-body bg-white border border-border-default rounded-[var(--radius-md)] px-3.5 py-2.5 outline-none box-border"
                />
                <button className="flex items-center bg-transparent border-none text-text-muted cursor-pointer p-1 hover:text-text-body transition-colors">
                  <IconPencil size={18} stroke={1.5} />
                </button>
              </div>
            </div>

            {/* Logo */}
            <div>
              <FieldLabel>Logo</FieldLabel>
              <div className="w-[120px] h-[120px] border border-border-default rounded-[var(--radius-md)] bg-surface flex items-center justify-center text-[32px] text-text-muted">
                {profile.brand_name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Company overview */}
            <div>
              <FieldLabel>Company overview</FieldLabel>
              <textarea
                rows={5}
                defaultValue={profile.company_overview}
                className="w-full type-body text-text-body bg-white border border-border-default rounded-[var(--radius-md)] px-3.5 py-2.5 outline-none resize-y box-border leading-relaxed font-[inherit]"
              />
            </div>

            {/* Differentiators */}
            <div>
              <FieldLabel>Keunggulan brand kamu?</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.differentiators.map((d) => (
                  <PurpleChip key={d} label={d} />
                ))}
                <AddChip />
              </div>
            </div>

            {/* Competitors */}
            <div>
              <FieldLabel>Kompetitor utama</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.competitors.map((c) => (
                  <GrayChip key={c} label={c} />
                ))}
                <AddChip />
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-right">
              {error && (
                <p className="type-caption text-error mb-2.5">{error}</p>
              )}
              <Button variant="brand" size="lg" onClick={handleGeneratePrompts} disabled={loading}>
                {loading ? (
                  <><ButtonSpinner size={16} /> Menyiapkan…</>
                ) : (
                  <>Buat Prompt <IconArrowRight size={18} stroke={1.5} /></>
                )}
              </Button>
            </div>
          </div>

          {/* RIGHT: sticky preview card */}
          <div className="sticky top-10 self-start">
            <div className="bg-white border border-border-default rounded-[var(--radius-lg)] p-6">
              <SectionLabel>Preview</SectionLabel>

              {/* Logo + name */}
              <div className="flex flex-row gap-3 items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--purple-light)] flex items-center justify-center text-[20px] font-bold text-brand shrink-0">
                  {profile.brand_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[18px] font-bold text-text-heading">
                  {profile.brand_name}
                </span>
              </div>

              {/* Overview */}
              <p className="type-sm text-text-body leading-relaxed m-0 mb-4">
                {profile.company_overview}
              </p>

              {/* Differentiators */}
              <SectionLabel>Differentiators</SectionLabel>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.differentiators.map((d) => (
                  <PurpleChip key={d} label={d} showX={false} />
                ))}
              </div>

              {/* Competitors */}
              <SectionLabel>Kompetitor</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {profile.competitors.map((c) => (
                  <GrayChip key={c} label={c} showX={false} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
