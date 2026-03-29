'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconSmartHome,
  IconMessageDots,
  IconArticle,
  IconRosetteAsterisk,
  IconSparkles,
  IconArrowUpRight,
  IconSelector,
  IconMail,
  IconLogout,
} from '@tabler/icons-react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";


type SidebarProps = {
  planLabel: string;
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
  // { label: "Brand", href: "/brand", icon: IconRosetteAsterisk },
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

export function Sidebar({ planLabel, userName, userEmail, workspaceName, projectName, websiteUrl }: SidebarProps) {
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
          className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer rounded-md bg-white border border-[#ececec]"
        >
          {faviconSrc && !faviconError ? (
            <div className="w-7 h-7 rounded-full bg-white border border-[#ececec] flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={faviconSrc}
                alt={workspaceName}
                width={18}
                height={18}
                className="block object-contain"
                onError={() => setFaviconError(true)}
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-white border border-[#ececec] flex items-center justify-center type-caption font-semibold text-text-heading shrink-0">
              {getInitial(workspaceName)}
            </div>
          )}
          <span className="type-body font-medium text-text-heading truncate flex-1">{workspaceName}</span>
          <IconSelector size={16} stroke={2} className="text-[#8b8b8b] shrink-0" />
        </div>

        {/* Workspace popover */}
        {popoverOpen && (
          <div
            className={cn(
              "absolute top-full left-4 mt-1 w-max max-w-[280px] bg-white border border-[#ececec] rounded-[6px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] z-20 overflow-hidden",
              popoverClosing ? "animate-popover-out" : "animate-popover-in"
            )}
          >
            {/* Email */}
            <Link
              href="/settings?tab=profil"
              onClick={() => closePopover()}
              className="px-3 py-2 flex items-center gap-2 no-underline hover:bg-surface transition-colors"
            >
              <IconMail size={20} stroke={1.5} className="text-[#374151] shrink-0" />
              <span className="type-caption text-text-body truncate">{userEmail}</span>
            </Link>

            <div className="border-t border-[#ececec]" />

            {/* Brand section */}
            <div className="px-3 py-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white border border-[#ececec] flex items-center justify-center shrink-0 overflow-hidden">
                  {faviconSrc && !faviconError ? (
                    <img src={faviconSrc} alt={workspaceName} width={14} height={14} className="block object-contain" />
                  ) : (
                    <span className="text-[8px] font-semibold text-text-heading">{getInitial(workspaceName)}</span>
                  )}
                </div>
                <span className="type-body font-medium text-text-body truncate">{workspaceName}</span>
              </div>
            </div>

            <div className="border-t border-[#ececec]" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-surface transition-colors"
            >
              <IconLogout size={20} stroke={1.5} className="text-[#374151]" />
              <span className="type-body font-medium text-text-body">Keluar</span>
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
            <Link key={item.href} href={item.href} data-active={isActive} className="nav-item no-underline group flex items-center gap-2">
              <Icon
                size={20}
                stroke={1.5}
                className={cn("transition-colors", isActive ? "text-foreground" : "text-[#8b8b8b] group-hover:text-foreground")}
              />
              <span className={cn("type-nav", isActive ? "text-foreground" : "text-[#8b8b8b] group-hover:text-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto flex flex-col px-6 pb-[24px]">
        {/* Muted Nuave logo */}
        <div className="mb-6">
          <svg width={24} height={24} viewBox="0 0 262 262" fill="none" className="block text-[#8b8b8b]">
            <path d="M172.197 202.668L130.999 131.02L89.1807 206H8L89.8027 59.332L130.999 130.98L172.818 56H254L172.197 202.668Z" fill="currentColor"/>
          </svg>
        </div>

        {/* Secondary links */}
        <div className="flex flex-col gap-6 mb-6">
          <Link href="/support" className="type-body font-medium text-[#8b8b8b] no-underline transition-colors hover:text-foreground">
            Bantuan
          </Link>
          <Link href="/settings" className="type-body font-medium text-[#8b8b8b] no-underline transition-colors hover:text-foreground">
            Pengaturan
          </Link>
        </div>

        {/* Plan row */}
        <Link href="/settings?tab=langganan" className="group h-5 flex items-center justify-between no-underline">
          <div className="flex items-center gap-1.5">
            <IconSparkles size={16} stroke={1.5} className="text-[#533afd]" />
            <span className="type-body">
              <span className="text-text-muted transition-colors group-hover:text-foreground">Paket: </span>
              <span className="text-[#533afd] font-semibold capitalize">{planLabel}</span>
            </span>
          </div>
          <div className="flex items-center gap-0.5 type-body font-medium text-text-muted transition-colors group-hover:text-foreground">
            <IconArrowUpRight size={16} stroke={1.5} />
          </div>
        </Link>
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
