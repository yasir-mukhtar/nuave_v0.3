import { NextRequest, NextResponse } from "next/server";

interface PrefetchMetaResponse {
  brand_name: string | null;
  language: string | null;
  country: string | null;
  logo_url: string | null;
  favicon_url: string;
  description: string | null;
  error?: string;
}

const SUPPORTED_LANGUAGES = ["id", "en", "ms", "ja", "ko", "zh", "hi", "de", "fr", "nl", "pt", "ar", "th", "tl", "vi"];

const TLD_COUNTRY_MAP: Record<string, string> = {
  ".co.id": "ID", ".id": "ID",
  ".com.my": "MY", ".my": "MY",
  ".sg": "SG",
  ".co.uk": "GB", ".uk": "GB",
  ".com.au": "AU", ".au": "AU",
  ".jp": "JP", ".co.jp": "JP",
  ".kr": "KR", ".co.kr": "KR",
  ".in": "IN", ".co.in": "IN",
  ".de": "DE",
  ".fr": "FR",
  ".nl": "NL",
  ".com.br": "BR", ".br": "BR",
  ".ae": "AE",
  ".sa": "SA",
  ".co.th": "TH", ".th": "TH",
  ".ph": "PH", ".com.ph": "PH",
  ".vn": "VN", ".com.vn": "VN",
};

const LANG_COUNTRY_MAP: Record<string, string> = {
  id: "ID",
  ms: "MY",
  ja: "JP",
  ko: "KR",
  zh: "SG",
  hi: "IN",
  de: "DE",
  fr: "FR",
  nl: "NL",
  pt: "BR",
  ar: "SA",
  th: "TH",
  tl: "PH",
  vi: "VN",
};

const TITLE_SUFFIXES = [
  / \| Home$/i, / - Home$/i, / \| Homepage$/i, / - Homepage$/i,
  / \| Official Site$/i, / - Official Site$/i,
  / \| Official Website$/i, / - Official Website$/i,
  / – Homepage$/i, / – Official Site$/i, / – Official Website$/i,
  / \| Beranda$/i, / - Beranda$/i, / – Beranda$/i,
  / \| Situs Resmi$/i, / - Situs Resmi$/i,
];

function extractHead(html: string): string {
  const headMatch = html.match(/<head[\s>]([\s\S]*?)<\/head>/i);
  return headMatch ? headMatch[1] : "";
}

function extractMeta(head: string, property: string): string | null {
  // Try property="..." (og tags)
  const propRegex = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  let match = head.match(propRegex);
  if (match) return match[1];

  // Try content before property
  const propRegex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i");
  match = head.match(propRegex2);
  if (match) return match[1];

  // Try name="..." (standard meta)
  const nameRegex = new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  match = head.match(nameRegex);
  if (match) return match[1];

  const nameRegex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i");
  match = head.match(nameRegex2);
  if (match) return match[1];

  return null;
}

function extractTitle(head: string): string | null {
  const match = head.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractLinkHref(head: string, rel: string): string | null {
  const regex = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, "i");
  const match = head.match(regex);
  if (match) return match[1];

  // Try href before rel
  const regex2 = new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${rel}["']`, "i");
  const match2 = head.match(regex2);
  return match2 ? match2[1] : null;
}

function extractLang(html: string): string | null {
  // Check first 500 chars for <html lang="...">
  const snippet = html.slice(0, 500);
  const match = snippet.match(/<html[^>]+lang=["']([a-zA-Z-]+)["']/i);
  if (!match) return null;

  // Normalize: "id-ID" → "id", "en-US" → "en"
  const lang = match[1].split("-")[0].toLowerCase();
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : null;
}

function guessCountryFromTLD(hostname: string): string | null {
  // Check longer TLDs first (e.g. .co.id before .id)
  const sorted = Object.keys(TLD_COUNTRY_MAP).sort((a, b) => b.length - a.length);
  for (const tld of sorted) {
    if (hostname.endsWith(tld)) return TLD_COUNTRY_MAP[tld];
  }
  return null;
}

function cleanBrandName(raw: string, hostname: string): string {
  let name = raw;

  // Strip known suffixes
  for (const suffix of TITLE_SUFFIXES) {
    name = name.replace(suffix, "");
  }

  // Strip common separators and everything after
  const separators = [" | ", " - ", " – ", " — ", " :: "];
  for (const sep of separators) {
    const idx = name.indexOf(sep);
    if (idx > 0) {
      name = name.substring(0, idx);
      break;
    }
  }

  return name.trim();
}

function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

export async function POST(request: NextRequest) {
  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let { url } = body;
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Prepend https:// if missing
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Only http/https URLs are supported" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const domain = parsedUrl.hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  const nullResponse: PrefetchMetaResponse = {
    brand_name: null,
    language: null,
    country: null,
    logo_url: null,
    favicon_url: faviconUrl,
    description: null,
    error: "fetch_failed",
  };

  // Fetch the URL with timeout and redirect limit
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(nullResponse);
    }

    // Read only first 50KB
    const reader = response.body?.getReader();
    if (!reader) return NextResponse.json(nullResponse);

    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    const MAX_SIZE = 50 * 1024;

    while (totalSize < MAX_SIZE) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
    }
    reader.cancel();

    const decoder = new TextDecoder("utf-8", { fatal: false });
    html = decoder.decode(Buffer.concat(chunks).slice(0, MAX_SIZE));
  } catch {
    return NextResponse.json(nullResponse);
  }

  // Parse
  const head = extractHead(html);
  const lang = extractLang(html);

  // Brand name: prefer og:site_name > title > domain name fallback
  const ogSiteName = extractMeta(head, "og:site_name");
  const rawTitle = extractTitle(head);
  let brandName: string | null = null;
  if (ogSiteName) {
    brandName = ogSiteName.trim();
  } else if (rawTitle) {
    brandName = cleanBrandName(rawTitle, domain);
  }
  // Fallback: capitalize domain name (e.g. "figma.com" → "Figma")
  if (!brandName) {
    const domainBase = domain.replace(/^www\./, "").split(".")[0];
    if (domainBase.length > 1) {
      brandName = domainBase.charAt(0).toUpperCase() + domainBase.slice(1);
    }
  }

  // Country: TLD > lang > GLOBAL fallback
  let country = guessCountryFromTLD(domain);
  if (!country && lang) {
    country = LANG_COUNTRY_MAP[lang] || "GLOBAL";
  }
  if (!country) {
    country = "GLOBAL";
  }

  // Logo: og:image > apple-touch-icon > google favicon
  const ogImage = extractMeta(head, "og:image");
  const appleTouchIcon = extractLinkHref(head, "apple-touch-icon");
  let logoUrl: string | null = null;
  if (ogImage) {
    logoUrl = resolveUrl(ogImage, url);
  } else if (appleTouchIcon) {
    logoUrl = resolveUrl(appleTouchIcon, url);
  } else {
    logoUrl = faviconUrl;
  }

  // Description
  const description = extractMeta(head, "og:description") || extractMeta(head, "description");

  const result: PrefetchMetaResponse = {
    brand_name: brandName,
    language: lang,
    country,
    logo_url: logoUrl,
    favicon_url: faviconUrl,
    description: description || null,
  };

  return NextResponse.json(result);
}
