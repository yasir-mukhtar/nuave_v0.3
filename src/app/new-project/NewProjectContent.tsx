"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WizardLayout from "@/components/new-project/WizardLayout";
import SearchableSelect from "@/components/new-project/SearchableSelect";
import { ButtonSpinner } from "@/components/ButtonSpinner";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { COUNTRIES, LANGUAGES } from "@/lib/constants";

const REQUEST_TIMEOUT_MS = 60_000;


function isValidUrlInput(value: string): boolean {
  return value.includes(".") && !value.includes(" ") && value.trim().length > 3;
}

export default function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);

  // Auth guard — redirect to /auth if not logged in
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth?next=/new-project");
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  const [url, setUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill state
  const [prefetching, setPrefetching] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconVisible, setFaviconVisible] = useState(false);
  const touchedFields = useRef(new Set<string>());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastPrefetchedUrl = useRef<string>("");
  const restoredRef = useRef(false);

  // Restore form state from sessionStorage on mount (client-only, avoids hydration mismatch)
  // If ?new=1 is present, clear all previous session data and start fresh
  useEffect(() => {
    const isNewFlow = searchParams.get("new") === "1";

    if (isNewFlow) {
      // Clear all wizard session data for a fresh start
      sessionStorage.removeItem("nuave_new_project");
      sessionStorage.removeItem("nuave_new_project_topics");
      sessionStorage.removeItem("nuave_new_project_prompts");
      sessionStorage.removeItem("nuave_audit_result");
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("nuave_cached_topics_") || key?.startsWith("nuave_cached_prompts_")) {
          sessionStorage.removeItem(key);
        }
      }
      // Remove ?new=1 from URL without triggering navigation
      router.replace("/new-project", { scroll: false });
      return;
    }

    const raw = sessionStorage.getItem("nuave_new_project");
    if (raw) {
      // Restore in-progress wizard state
      const restored = JSON.parse(raw);
      restoredRef.current = true;
      const restoredUrl = restored.url?.replace(/^https?:\/\//, "") || "";
      setUrl(restoredUrl);
      setBrandName(restored.brandName || "");
      setCountry(restored.country || "");
      setLanguage(restored.language || "");
      lastPrefetchedUrl.current = restoredUrl;
      touchedFields.current = new Set(["brandName", "country", "language"]);
      if (restored.url) {
        const domain = restored.url.replace(/^https?:\/\//, "");
        setFaviconUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
        setFaviconVisible(true);
      }
    }
  }, [searchParams, router]);

  const isValid = url.trim().length > 0 && brandName.trim().length > 0 && country !== "" && language !== "";

  const handlePrefetch = useCallback(async (urlValue: string) => {
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();

    if (!isValidUrlInput(urlValue)) {
      setPrefetching(false);
      return;
    }

    // Reset touched fields on new URL fetch — always overwrite
    touchedFields.current.clear();

    const controller = new AbortController();
    abortRef.current = controller;
    setPrefetching(true);

    try {
      const fullUrl = urlValue.startsWith("http") ? urlValue : `https://${urlValue}`;
      const res = await fetch("/api/prefetch-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
        signal: controller.signal,
      });
      const data = await res.json();

      if (controller.signal.aborted) return;

      // Auto-fill all fields from prefetch (clear old values if null)
      setBrandName(data.brand_name || "");
      setLanguage(data.language || "");
      setCountry(data.country || "");

      // Set favicon
      if (data.favicon_url) {
        setFaviconUrl(data.favicon_url);
        setFaviconVisible(false);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Silently fail — auto-fill is optional
    } finally {
      if (!controller.signal.aborted) {
        setPrefetching(false);
      }
    }
  }, []);

  // Debounced URL change handler — skip if URL hasn't changed from restored/last-fetched value
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = url.trim();

    if (!trimmed) {
      setPrefetching(false);
      setFaviconUrl(null);
      setFaviconVisible(false);
      return;
    }

    // Skip if URL is the same as what we already have data for
    if (trimmed === lastPrefetchedUrl.current) {
      return;
    }

    debounceTimer.current = setTimeout(() => {
      lastPrefetchedUrl.current = trimmed;
      handlePrefetch(trimmed);
    }, 800);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [url, handlePrefetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    const fullUrl = url.startsWith("http") ? url : `https://${url}`;

    // If a cached brand exists for this URL, verify it still exists in the DB before skipping scrape.
    // Stale sessionStorage (e.g. from a previous Supabase project) would cause FK errors downstream.
    const existingRaw = sessionStorage.getItem("nuave_new_project");
    const existing = existingRaw ? JSON.parse(existingRaw) : null;
    if (existing?.projectId && existing.url === fullUrl) {
      const checkRes = await fetch(`/api/brands/${existing.projectId}`, { method: "HEAD" }).catch(() => null);
      if (checkRes?.ok) {
        const projectData = {
          ...existing,
          brandName: brandName.trim(),
          country,
          language,
          faviconUrl: faviconUrl || existing.faviconUrl || null,
        };
        sessionStorage.setItem("nuave_new_project", JSON.stringify(projectData));
        router.push("/new-project/topics");
        return;
      }
      // Brand not found in DB — clear stale cache and fall through to re-scrape
      sessionStorage.removeItem("nuave_new_project");
    }

    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Get active workspace_id from localStorage
      const activeWsId = localStorage.getItem("nuave_active_workspace") || undefined;

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website_url: fullUrl, brand_name: brandName.trim(), workspace_id: activeWsId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Gagal menganalisis website.");
        setLoading(false);
        return;
      }

      const projectData = {
        url: fullUrl,
        brandName: data.profile?.brand_name || brandName.trim(),
        country,
        language,
        projectId: data.brand_id,
        workspaceId: activeWsId,
        profile: data.profile,
        faviconUrl: faviconUrl || null,
      };
      sessionStorage.setItem("nuave_new_project", JSON.stringify(projectData));
      router.push("/new-project/topics");
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Permintaan melebihi batas waktu. Silakan coba lagi.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-text-muted">Memuat...</p>
      </div>
    );
  }

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={3}
      onClose={() => router.push("/dashboard")}
    >
      <form onSubmit={handleSubmit}>
        {/* Heading */}
        <h1 className="type-heading-sm text-text-heading mb-2 tracking-[-0.02em]">
          Mulai Audit Brand Anda
        </h1>
        <p className="type-body text-text-muted mb-9">
          Kami akan menganalisis visibilitas brand Anda di AI.
        </p>

        {/* Website field */}
        <div className="mb-6">
          <label className="block type-body font-medium text-text-heading mb-1.5">
            Website
          </label>
          <div className="relative flex">
            <span className="flex items-center px-3 type-body text-text-muted bg-surface border border-border-default border-r-0 rounded-l-md select-none">
              https://
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="contoh.com"
                className={cn(
                  "w-full h-[44px] px-3.5 type-body text-text-heading border border-border-default rounded-r-md outline-none bg-white",
                  "transition-[border-color,box-shadow] duration-100 ease-in-out",
                  "focus:border-brand focus:shadow-app-focus"
                )}
                style={prefetching ? { paddingRight: 36 } : undefined}
              />
              {/* Loading spinner inside URL input */}
              {prefetching && (
                <div className="absolute right-3 top-0 bottom-0 flex items-center">
                  <div className="w-4 h-4 border-2 border-border-default border-t-brand rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Brand name field */}
        <div className="mb-6">
          <label className="block type-body font-medium text-text-heading mb-1.5">
            Nama Brand
          </label>
          <div className="relative flex items-center">
            {/* Favicon inline */}
            {faviconUrl && faviconVisible && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-[1] flex items-center justify-center transition-opacity duration-100 ease-in-out">
                <img
                  src={faviconUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-xs block"
                  onError={() => setFaviconVisible(false)}
                />
              </div>
            )}
            <input
              type="text"
              value={brandName}
              onChange={(e) => {
                touchedFields.current.add("brandName");
                setBrandName(e.target.value);
              }}
              placeholder="Masukkan nama brand"
              className={cn(
                "w-full h-[44px] type-body text-text-heading border border-border-default rounded-md outline-none bg-white",
                "transition-[border-color,box-shadow,padding-left] duration-100 ease-in-out",
                "focus:border-brand focus:shadow-app-focus"
              )}
              style={{ paddingLeft: faviconUrl && faviconVisible ? 40 : 14 }}
            />
          </div>
          {/* Hidden img to trigger favicon load */}
          {faviconUrl && !faviconVisible && (
            <img
              src={faviconUrl}
              alt=""
              width={0}
              height={0}
              className="absolute opacity-0 pointer-events-none"
              onLoad={() => setFaviconVisible(true)}
              onError={() => setFaviconVisible(false)}
            />
          )}
        </div>

        {/* Target Pasar + Bahasa Utama */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block type-body font-medium text-text-heading mb-1.5">
              Target Pasar
            </label>
            <SearchableSelect
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }))}
              value={country}
              onChange={(val) => {
                touchedFields.current.add("country");
                setCountry(val);
              }}
              placeholder="Pilih negara"
              searchPlaceholder="Cari negara..."
            />
          </div>
          <div>
            <label className="block type-body font-medium text-text-heading mb-1.5">
              Bahasa Utama
            </label>
            <SearchableSelect
              options={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
              value={language}
              onChange={(val) => {
                touchedFields.current.add("language");
                setLanguage(val);
              }}
              placeholder="Pilih bahasa"
              searchPlaceholder="Cari bahasa..."
            />
          </div>
        </div>

        {/* Spacing before button */}
        <div className="mt-3" />

        {/* Error message */}
        {error && (
          <p className="type-body text-error mb-3">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || loading}
          className={cn(
            "w-full h-12 rounded-md border-none type-body font-medium text-white transition-colors duration-100 ease-in-out",
            isValid && !loading
              ? "bg-brand cursor-pointer hover:bg-brand-dark"
              : "bg-border-strong cursor-not-allowed"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {loading && <ButtonSpinner size={16} />}
            {loading ? "Memproses..." : "Lanjutkan"}
          </span>
        </button>
      </form>

      {/* NOTE: Embedded @keyframes spin — used by prefetch spinner. Consider moving to global CSS. */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </WizardLayout>
  );
}
