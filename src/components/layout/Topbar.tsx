'use client';

import { useState, useRef, useEffect } from 'react';
import {
  IconSelector,
  IconCheck,
  IconPlus,
  IconRadar,
} from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useActiveProject } from "@/hooks/useActiveProject";

import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const { projects, activeProjectId, setActiveProjectId, activeProject } = useActiveProject();

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Monitoring state
  const monitoringEnabled = activeProject?.monitoring_enabled ?? false;
  const monitoringPaused = activeProject?.monitoring_paused_at !== null && activeProject?.monitoring_paused_at !== undefined && monitoringEnabled;
  const [toggling, setToggling] = useState(false);
  const { refreshProjects } = useActiveProject();

  const MAX_LABEL_LEN = 28;
  const rawName = activeProject?.name ?? "Pilih proyek";
  const projectName = rawName.length > MAX_LABEL_LEN
    ? rawName.slice(0, Math.ceil(MAX_LABEL_LEN / 2)) + "\u2026" + rawName.slice(-(Math.floor(MAX_LABEL_LEN / 2) - 1))
    : rawName;

  function closeDropdown() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  }

  async function handleToggleMonitoring(checked: boolean) {
    if (!activeProjectId || toggling) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/brands/${activeProjectId}/monitoring`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked }),
      });
      if (res.ok) {
        await refreshProjects();
      }
    } finally {
      setToggling(false);
    }
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

  // Monitoring status label
  const monitoringLabel = monitoringPaused
    ? "Dijeda"
    : monitoringEnabled
      ? "Aktif"
      : "Nonaktif";

  return (
    <div className="flex items-center justify-between h-[52px] px-8 border-b border-border-light">
      {/* Left: project switcher */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => open ? closeDropdown() : setOpen(true)}
          className="flex items-center gap-1.5 max-w-[280px] bg-transparent border border-border-light rounded-sm px-3 py-1.5 cursor-pointer type-body font-medium text-text-heading shadow-app-subtle"
          title={rawName}
        >
          <span className="truncate">{projectName}</span>
          <IconSelector size={16} stroke={2} className="text-[#8b8b8b]" />
        </button>

        {open && (
          <div
            className={cn(
              closing ? "popover-down-out" : "popover-down",
              "absolute top-[calc(100%+4px)] left-0 min-w-[220px] bg-white border border-border-light rounded-sm shadow-app-modal z-30 overflow-hidden"
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
                      "flex items-center gap-2 w-full px-3.5 py-2.5 bg-transparent border-none cursor-pointer type-body text-text-heading text-left",
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
                  closeDropdown();
                  router.push("/new-project?new=1");
                }}
                className="flex items-center gap-2 w-full px-3.5 py-2.5 type-body font-medium text-text-heading bg-transparent border-none cursor-pointer text-left"
              >
                <IconPlus size={16} stroke={2} />
                Tambah proyek
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: monitoring toggle */}
      {activeProjectId && (
        <div className="flex items-center gap-2.5">
          <IconRadar
            size={16}
            className={cn(
              monitoringEnabled && !monitoringPaused ? "text-success" : "text-text-muted"
            )}
          />
          <span className="text-[14px] font-medium leading-none text-text-muted">
            Monitoring Harian:
          </span>
          <span className={cn(
            "text-[14px] font-medium leading-none",
            monitoringPaused
              ? "text-warning"
              : monitoringEnabled
                ? "text-text-heading"
                : "text-text-muted"
          )}>
            {monitoringLabel}
          </span>

          <Switch
            checked={monitoringEnabled}
            onCheckedChange={handleToggleMonitoring}
            disabled={toggling}
          />
        </div>
      )}
    </div>
  );
}
