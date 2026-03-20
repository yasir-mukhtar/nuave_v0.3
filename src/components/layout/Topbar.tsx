'use client';

import { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import {
  Coins,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useCreditsBalance } from "@/hooks/useCreditsBalance";
import { useActiveWorkspace } from "@/hooks/useActiveWorkspace";

export default function Topbar() {
  const { credits } = useCreditsBalance();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useActiveWorkspace();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const workspaceName = activeWorkspace?.brand_name ?? "Select Workspace";

  function closeDropdown() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div className="flex items-center justify-between h-[52px] px-8 border-b border-border-light">
      {/* Left: workspace/brand selector */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => open ? closeDropdown() : setOpen(true)}
          className="flex items-center gap-1.5 bg-transparent border border-border-light rounded-sm px-3 py-1.5 cursor-pointer font-medium text-sm text-text-heading shadow-app-subtle"
        >
          {workspaceName}
          {open ? (
            <ChevronUp size={14} strokeWidth={2} />
          ) : (
            <ChevronDown size={14} strokeWidth={2} />
          )}
        </button>

        {open && (
          <div
            className={cn(
              closing ? "popover-down-out" : "popover-down",
              "absolute top-[calc(100%+4px)] left-0 min-w-[220px] bg-white border border-border-light rounded-sm shadow-app-modal z-30 overflow-hidden"
            )}
          >
            {/* Workspace list */}
            <div className="py-1 max-h-[400px] overflow-y-auto">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      closeDropdown();
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full px-3.5 py-2.5 bg-transparent border-none cursor-pointer text-sm text-text-heading text-left",
                      isActive ? "font-semibold" : "font-normal"
                    )}
                  >
                    <span className="w-[18px] shrink-0">
                      {isActive && <Check size={16} strokeWidth={2.5} />}
                    </span>
                    {ws.brand_name}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border-light" />

            {/* Add brand */}
            <div className="py-1">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 font-medium text-sm text-text-heading no-underline"
              >
                <Plus size={16} strokeWidth={2} />
                Tambah brand
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right: credits + buy button */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium text-sm text-brand">
          <Coins size={18} strokeWidth={2} />
          <span>{credits ?? "—"} credit</span>
        </div>

        <Link
          href="/dashboard/credits"
          className="flex items-center gap-1 px-3 py-1.5 font-medium text-sm text-text-heading bg-transparent border border-border-light rounded-sm no-underline shadow-app-subtle cursor-pointer"
        >
          Beli
          <ArrowUpRight size={16} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
