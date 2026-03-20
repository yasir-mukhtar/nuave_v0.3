"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import WizardLayout from "@/components/new-project/WizardLayout";
import SearchableSelect from "@/components/new-project/SearchableSelect";
import { ButtonSpinner } from "@/components/ButtonSpinner";
import { cn } from "@/lib/utils";

const REQUEST_TIMEOUT_MS = 60_000;

const COUNTRIES = [
  { code: "GLOBAL", name: "Global", flag: "🌐" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
];

const LANGUAGES = [
  { code: "id", name: "Indonesian" },
  { code: "en", name: "English" },
  { code: "ms", name: "Malay" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "nl", name: "Dutch" },
  { code: "pt", name: "Portuguese" },
  { code: "ar", name: "Arabic" },
  { code: "th", name: "Thai" },
  { code: "tl", name: "Filipino" },
  { code: "vi", name: "Vietnamese" },
];


function isValidUrlInput(value: string): boolean {
  return value.includes(".") && !value.includes(" ") && value.trim().length > 3;
}

export default function NewProjectPage() {
  const router = useRouter();

  // Restore form state from sessionStorage (read once via useRef)
  const restoredRef = useRef(
    typeof window !== "undefined"
      ? (() => { const raw = sessionStorage.getItem("nuave_new_project"); return raw ? JSON.parse(raw) : null; })()
      : null
  );
  const restored = restoredRef.current as Record<string, any> | null;

  const [url, setUrl] = useState(restored?.url?.replace(/^https?:\/\//, "") || "");
  const [brandName, setBrandName] = useState(restored?.brandName || "");
  const [country, setCountry] = useState(restored?.country || "");
  const [language, setLanguage] = useState(restored?.language || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill state
  const [prefetching, setPrefetching] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(restored?.url ? `https://www.google.com/s2/favicons?domain=${restored.url.replace(/^https?:\/\//, "")}&sz=128` : null);
  const [faviconVisible, setFaviconVisible] = useState(!!restored);
  const touchedFields = useRef(restored ? new Set<string>(["brandName", "country", "language"]) : new Set<string>());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Track the last URL that triggered a prefetch to avoid re-fetching on mount
  const lastPrefetchedUrl = useRef<string>(restored?.url?.replace(/^https?:\/\//, "") || "");

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

    // If workspace already exists and URL hasn't changed, skip scrape and go to step 2
    if (restored?.workspaceId && restored.url === fullUrl) {
      // Update sessionStorage with any field changes (brand name, country, language)
      const projectData = {
        ...restored,
        brandName: brandName.trim(),
        country,
        language,
        faviconUrl: faviconUrl || restored.faviconUrl || null,
      };
      sessionStorage.setItem("nuave_new_project", JSON.stringify(projectData));
      router.push("/new-project/topics");
      return;
    }

    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website_url: fullUrl, brand_name: brandName.trim() }),
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
        workspaceId: data.workspace_id,
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

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={3}
      onClose={() => router.push("/dashboard")}
    >
      <form onSubmit={handleSubmit}>
        {/* Heading */}
        <h1 className="font-heading text-[24px] leading-[32px] font-semibold text-text-heading mb-2 tracking-[-0.02em]">
          Mulai Audit Brand Anda
        </h1>
        <p className="font-body text-[15px] leading-[24px] text-text-muted mb-9">
          Kami akan menganalisis visibilitas brand Anda di AI.
        </p>

        {/* Website field */}
        <div className="mb-6">
          <label className="block font-body text-[14px] leading-[20px] font-medium text-text-heading mb-1.5">
            Website
          </label>
          <div className="relative flex">
            <span className="flex items-center px-3 font-body text-[14px] leading-[20px] text-text-muted bg-surface border border-border-default border-r-0 rounded-l-md select-none">
              https://
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="contoh.com"
                className={cn(
                  "w-full h-[44px] px-3.5 font-body text-[14px] leading-[20px] text-text-heading border border-border-default rounded-r-md outline-none bg-white",
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
          <label className="block font-body text-[14px] leading-[20px] font-medium text-text-heading mb-1.5">
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
                "w-full h-[44px] font-body text-[14px] leading-[20px] text-text-heading border border-border-default rounded-md outline-none bg-white",
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
            <label className="block font-body text-[14px] leading-[20px] font-medium text-text-heading mb-1.5">
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
            <label className="block font-body text-[14px] leading-[20px] font-medium text-text-heading mb-1.5">
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
          <p className="font-body text-[13px] leading-[18px] text-error mb-3">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || loading}
          className={cn(
            "w-full h-12 rounded-md border-none font-body text-[15px] leading-[22px] font-medium text-white transition-colors duration-100 ease-in-out",
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
