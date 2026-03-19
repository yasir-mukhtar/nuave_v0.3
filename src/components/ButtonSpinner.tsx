"use client";

import React from "react";

/**
 * Inline spinner for buttons — matches existing project spinner style.
 * Renders a small spinning circle next to button text.
 */
export function ButtonSpinner({
  size = 16,
  color = "#ffffff",
}: {
  size?: number;
  /** Spinner accent color — defaults to white (for purple buttons). Use "var(--purple)" for light buttons. */
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2px solid ${color === "#ffffff" ? "rgba(255,255,255,0.3)" : "#E5E7EB"}`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

/** Spinner keyframes — include once per page that uses ButtonSpinner */
export const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;
