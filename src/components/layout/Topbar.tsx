'use client';

import { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import {
  IconCoins,
  IconArrowUpRight,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconPlus,
} from '@tabler/icons-react';
import { useCreditsBalance } from "@/hooks/useCreditsBalance";
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";

export default function Topbar() {
  const { credits } = useCreditsBalance();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useActiveWorkspace();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const workspaceName = activeWorkspace?.brand_name ?? "Select Workspace";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "52px",
        padding: "0 32px",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      {/* Left: workspace/brand selector */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "1px solid var(--border-light)",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-heading)",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          {workspaceName}
          {open ? (
            <IconChevronUp size={14} stroke={2} />
          ) : (
            <IconChevronDown size={14} stroke={2} />
          )}
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              minWidth: "220px",
              background: "#ffffff",
              border: "1px solid var(--border-light)",
              borderRadius: "6px",
              boxShadow: "var(--shadow-modal)",
              zIndex: 30,
              overflow: "hidden",
            }}
          >
            {/* Workspace list */}
            <div
              className="scroll-subtle"
              style={{ padding: "4px 0", maxHeight: "400px", overflowY: "auto" }}
            >
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: isActive ? 600 : 400,
                      color: "var(--text-heading)",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ width: "18px", flexShrink: 0 }}>
                      {isActive && <IconCheck size={16} stroke={2.5} />}
                    </span>
                    {ws.brand_name}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border-light)" }} />

            {/* Add brand */}
            <div style={{ padding: "4px 0" }}>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-heading)",
                  textDecoration: "none",
                }}
              >
                <IconPlus size={16} stroke={2} />
                Tambah brand
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right: credits + buy button */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--purple)",
          }}
        >
          <IconCoins size={18} stroke={2} />
          <span>{credits ?? "—"} credit</span>
        </div>

        <Link
          href="/dashboard/credits"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-heading)",
            background: "none",
            border: "1px solid var(--border-light)",
            borderRadius: "6px",
            textDecoration: "none",
            boxShadow: "var(--shadow-subtle)",
            cursor: "pointer",
          }}
        >
          Beli
          <IconArrowUpRight size={16} stroke={2} />
        </Link>
      </div>
    </div>
  );
}
