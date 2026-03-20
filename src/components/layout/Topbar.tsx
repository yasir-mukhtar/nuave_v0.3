'use client';

import { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import {
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconPlus,
} from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { useActiveProject } from "@/hooks/useActiveProject";
import { clearNuaveProjectSession } from "@/lib/session";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const { projects, activeProjectId, setActiveProjectId, activeProject } = useActiveProject();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const projectName = activeProject?.name ?? "Pilih proyek";

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
    <div className="flex items-center justify-end h-[52px] px-8 border-b border-border-light">
      {/* Right: project switcher */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => open ? closeDropdown() : setOpen(true)}
          className="flex items-center gap-1.5 bg-transparent border border-border-light rounded-sm px-3 py-1.5 cursor-pointer font-medium text-sm text-text-heading shadow-app-subtle"
        >
          {projectName}
          {open ? (
            <IconChevronUp size={14} stroke={2} />
          ) : (
            <IconChevronDown size={14} stroke={2} />
          )}
        </button>

        {open && (
          <div
            className={cn(
              closing ? "popover-down-out" : "popover-down",
              "absolute top-[calc(100%+4px)] right-0 min-w-[220px] bg-white border border-border-light rounded-sm shadow-app-modal z-30 overflow-hidden"
            )}
          >
            {/* Project list */}
            <div className="py-1 max-h-[400px] overflow-y-auto">
              {projects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      closeDropdown();
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full px-3.5 py-2.5 bg-transparent border-none cursor-pointer text-sm text-text-heading text-left",
                      isActive ? "font-semibold" : "font-normal"
                    )}
                  >
                    <span className="w-[18px] shrink-0">
                      {isActive && <IconCheck size={16} stroke={2.5} />}
                    </span>
                    {proj.name}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border-light" />

            {/* Add project */}
            <div className="py-1">
              <button
                onClick={() => {
                  clearNuaveProjectSession();
                  closeDropdown();
                  router.push("/new-project");
                }}
                className="flex items-center gap-2 w-full px-3.5 py-2.5 font-medium text-sm text-text-heading bg-transparent border-none cursor-pointer text-left"
              >
                <IconPlus size={16} stroke={2} />
                Tambah proyek
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
