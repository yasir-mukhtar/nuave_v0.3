import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a Google Favicon URL for the given domain or competitor name.
 * If a domain is provided, uses it directly. Otherwise guesses from the name.
 */
export function getFaviconUrl(nameOrDomain: string, websiteUrl?: string | null): string {
  const domain = websiteUrl || `${nameOrDomain.toLowerCase().replace(/\s+/g, "")}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}
