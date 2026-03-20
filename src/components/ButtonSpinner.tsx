"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Inline spinner for buttons — renders a small spinning circle.
 */
export function ButtonSpinner({
  size = 16,
  color = "#ffffff",
  className,
}: {
  size?: number;
  /** Spinner accent color — defaults to white (for brand buttons). */
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block shrink-0 animate-spin rounded-full", className)}
      style={{
        width: size,
        height: size,
        border: `2px solid ${color === "#ffffff" ? "rgba(255,255,255,0.3)" : "#E5E7EB"}`,
        borderTopColor: color,
      }}
    />
  );
}

/** Spinner keyframes — include once per page that uses ButtonSpinner */
export const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;
