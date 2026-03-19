"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  icon?: string; // emoji or text prefix
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  style?: React.CSSProperties;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  style,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative", ...style }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          height: 44,
          padding: "0 14px",
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: selected ? "#111827" : "var(--text-placeholder)",
          border: open ? "1px solid var(--purple)" : "1px solid var(--border-default)",
          borderRadius: 8,
          outline: "none",
          backgroundColor: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          textAlign: "left",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          boxShadow: open ? "var(--shadow-focus)" : "none",
        }}
      >
        {selected?.icon && (
          <span style={{ fontSize: 16, lineHeight: 1 }}>{selected.icon}</span>
        )}
        <span style={{ flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        {/* Chevron up/down icon */}
        <svg
          width="12"
          height="16"
          viewBox="0 0 12 16"
          fill="none"
          style={{ flexShrink: 0, opacity: 0.4 }}
        >
          <path d="M2.5 6L6 3L9.5 6" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 10L6 13L9.5 10" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          onWheel={(e) => {
            // Prevent page scroll when hovering over the dropdown
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid var(--border-default)",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search input */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderBottom: "1px solid var(--border-default)",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
              <circle cx="7" cy="7" r="5.5" stroke="#6B7280" strokeWidth="1.5" />
              <path d="M11 11L14 14" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "#111827",
                backgroundColor: "transparent",
              }}
            />
          </div>

          {/* Options list */}
          <div style={{
            maxHeight: 280,
            overflowY: "auto",
            padding: "4px 0",
          }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: "12px 14px",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--text-muted)",
              }}>
                Tidak ditemukan
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    border: "none",
                    background: option.value === value ? "var(--bg-surface)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "#111827",
                    textAlign: "left",
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (option.value !== value)
                      e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                  }}
                  onMouseLeave={(e) => {
                    if (option.value !== value)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {option.icon && (
                    <span style={{ fontSize: 18, lineHeight: 1, width: 24, textAlign: "center" }}>
                      {option.icon}
                    </span>
                  )}
                  <span>{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
