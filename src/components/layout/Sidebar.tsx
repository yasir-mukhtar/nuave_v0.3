'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconSmartHome,
  IconMessageDots,
  IconArticle,
  IconRosetteAsterisk,
  IconCoins,
  IconArrowUpRight,
  IconSelector,
  IconMail,
  IconPlus,
  IconLogout,
} from '@tabler/icons-react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { clearNuaveProjectSession } from "@/lib/session";

type SidebarProps = {
  credits: number;
  userName: string;
  userEmail: string;
  workspaceName: string;
  projectName: string;
  websiteUrl?: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconSmartHome },
  { label: "Prompt", href: "/prompt", icon: IconMessageDots },
  { label: "Konten", href: "/content", icon: IconArticle },
  { label: "Brand", href: "/brand", icon: IconRosetteAsterisk },
];

function getInitial(name: string) {
  if (!name) return "N";
  return (name.trim()[0] ?? "N").toUpperCase();
}

function getFaviconUrl(websiteUrl?: string): string | null {
  if (!websiteUrl) return null;
  try {
    const domain = new URL(websiteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

export function Sidebar({ credits, userName, userEmail, workspaceName, projectName, websiteUrl }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverClosing, setPopoverClosing] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const faviconSrc = getFaviconUrl(websiteUrl);

  function closePopover() {
    setPopoverClosing(true);
    setTimeout(() => {
      setPopoverOpen(false);
      setPopoverClosing(false);
    }, 150);
  }

  useEffect(() => {
    if (!popoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closePopover();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 z-10 flex flex-col bg-[#f5f5f5] border-r border-[#ececec]">
      {/* TOP: Workspace switcher */}
      <div ref={popoverRef} className="relative px-4 pt-4">
        <div
          onClick={() => popoverOpen ? closePopover() : setPopoverOpen(true)}
          className="flex items-center gap-2.5 p-2.5 cursor-pointer rounded-md bg-white border border-[#ececec]"
        >
          {faviconSrc && !faviconError ? (
            <div className="w-7 h-7 rounded-full bg-white border border-[#ececec] flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={faviconSrc}
                alt={workspaceName}
                width={18}
                height={18}
                className="block"
                style={{ objectFit: "contain" }}
                onError={() => setFaviconError(true)}
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-white border border-[#ececec] flex items-center justify-center text-[11px] font-semibold text-[#0d0d0d] shrink-0">
              {getInitial(workspaceName)}
            </div>
          )}
          <span className="text-[14px] font-medium text-[#0d0d0d] truncate flex-1">{workspaceName}</span>
          <IconSelector size={16} stroke={2} className="text-[#8b8b8b] shrink-0" />
        </div>

        {/* Workspace popover */}
        {popoverOpen && (
          <div
            className={cn(
              "absolute top-full left-4 right-4 mt-1 bg-white border border-[#ececec] rounded-[6px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] z-20 overflow-hidden",
              popoverClosing ? "animate-popover-out" : "animate-popover-in"
            )}
          >
            {/* Email */}
            <div className="px-3 py-2 flex items-center gap-2">
              <IconMail size={20} stroke={1.5} className="text-[#374151] shrink-0" />
              <span className="text-[12px] text-[#374151] truncate">{userEmail}</span>
            </div>

            <div className="border-t border-[#ececec]" />

            {/* Workspace section */}
            <div className="px-3 py-5 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white border border-[#ececec] flex items-center justify-center shrink-0 overflow-hidden">
                  {faviconSrc && !faviconError ? (
                    <img src={faviconSrc} alt={workspaceName} width={14} height={14} className="block" style={{ objectFit: "contain" }} />
                  ) : (
                    <span className="text-[8px] font-semibold text-[#0d0d0d]">{getInitial(workspaceName)}</span>
                  )}
                </div>
                <span className="text-[14px] font-medium text-[#374151] truncate">{workspaceName}</span>
              </div>

              <button
                onClick={() => {
                  clearNuaveProjectSession();
                  closePopover();
                  router.push("/new-project");
                }}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
              >
                <IconPlus size={20} stroke={1.5} className="text-[#374151]" />
                <span className="text-[14px] font-medium text-[#374151]">Buat proyek baru</span>
              </button>
            </div>

            <div className="border-t border-[#ececec]" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-[#f9f9f9]"
            >
              <IconLogout size={20} stroke={1.5} className="text-[#374151]" />
              <span className="text-[14px] font-medium text-[#374151]">Keluar</span>
            </button>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="mt-10 px-6 flex flex-col gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} className="no-underline group flex items-center gap-2">
              <Icon
                size={20}
                stroke={1.5}
                className={cn("transition-colors", isActive ? "text-foreground" : "text-[#8b8b8b] group-hover:text-foreground")}
              />
              <span className={cn("text-[14px] font-medium transition-colors", isActive ? "text-foreground" : "text-[#8b8b8b] group-hover:text-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto flex flex-col px-6 pb-6">
        {/* Secondary links */}
        <div className="flex flex-col gap-6 mb-6">
          <Link href="/support" className="text-[14px] font-medium text-[#6b7280] no-underline transition-colors hover:text-foreground">
            Bantuan
          </Link>
          <Link href="/settings" className="text-[14px] font-medium text-[#6b7280] no-underline transition-colors hover:text-foreground">
            Pengaturan
          </Link>
        </div>

        {/* Credits row */}
        <Link href="/dashboard/credits" className="group mb-6 h-5 flex items-center justify-between no-underline">
          <div className="flex items-center gap-1.5">
            <IconCoins size={16} stroke={1.5} className="text-[#533afd]" />
            <span className="text-[14px]">
              <span className="text-[#533afd] font-semibold">{credits}</span>
              <span className="text-[#6b7280] transition-colors group-hover:text-foreground"> kredit</span>
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-[14px] font-medium text-[#6b7280] transition-colors group-hover:text-foreground">
            Beli
            <IconArrowUpRight size={16} stroke={1.5} />
          </div>
        </Link>

        {/* Muted Nuave logo */}
        <div className="flex items-center gap-1.5">
          <svg width={24} height={24} viewBox="0 0 262 262" fill="none" className="block text-[#6B7280]">
            <path d="M172.197 202.668L130.999 131.02L89.1807 206H8L89.8027 59.332L130.999 130.98L172.818 56H254L172.197 202.668Z" fill="currentColor"/>
          </svg>
          <span className="text-[16px] font-semibold text-[#6B7280]">Nuave</span>
        </div>
      </div>

      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popoverOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-4px) scale(0.98); }
        }
        .animate-popover-in { animation: popoverIn 150ms ease-out forwards; }
        .animate-popover-out { animation: popoverOut 150ms ease-in forwards; }
      `}</style>
    </aside>
  );
}
