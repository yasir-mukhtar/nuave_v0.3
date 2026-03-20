'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  MessageSquare,
  FileText,
  Sparkles,
  ChevronsUpDown,
  LogOut,
} from 'lucide-react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SidebarProps = {
  credits: number;
  userName: string;
  userEmail: string;
  workspaceName: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Prompt", href: "/prompt", icon: MessageSquare },
  { label: "Konten", href: "/content", icon: FileText },
  { label: "Brand", href: "/brand", icon: Sparkles },
];

const bottomLinks = [
  { label: "Bantuan", href: "/support" },
];

function getInitial(name: string) {
  if (!name) return "N";
  return (name.trim()[0] ?? "N").toUpperCase();
}

export function Sidebar({ userName, userEmail, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initial = getInitial(userName);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverClosing, setPopoverClosing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  function closePopover() {
    setPopoverClosing(true);
    setTimeout(() => {
      setPopoverOpen(false);
      setPopoverClosing(false);
    }, 200);
  }

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closePopover();
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 z-10 pt-6 px-4 pb-4 flex flex-col bg-[#F5F5F5] border-r border-border-default">
      {/* Logo area */}
      <Link
        href="/"
        className="flex items-center gap-2 no-underline mb-8"
      >
        <img src="/logo-nuave.svg" alt="Nuave" width="28" height="28" className="block" />
        <span className="font-semibold text-[17px] text-text-heading">Nuave</span>
      </Link>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="no-underline"
            >
              <div
                className={cn(
                  "flex items-center gap-2.5 h-9 px-2 rounded-sm cursor-pointer bg-transparent transition-[color] duration-150",
                  isActive
                    ? "text-text-heading"
                    : "text-text-muted hover:text-text-body"
                )}
              >
                <Icon size={18} strokeWidth={2} />
                <span
                  className={cn(
                    "text-sm",
                    isActive ? "font-semibold" : "font-normal"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto flex flex-col">
        {/* Secondary links */}
        <nav className="flex flex-col gap-0.5 mb-5">
          {bottomLinks.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm no-underline block py-1.5 px-2 rounded-sm transition-[color] duration-150",
                  isActive
                    ? "font-semibold text-text-heading"
                    : "font-normal text-text-muted hover:text-text-body"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile with popover */}
        <div ref={popoverRef} className="relative">

          {/* Popover */}
          {popoverOpen && (
            <div
              className={cn(
                "absolute bottom-[calc(100%+4px)] left-0 w-max min-w-full bg-white border border-border-default rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.1)] overflow-hidden z-20",
                popoverClosing ? "popover-up-out" : "popover-up"
              )}
            >
              {/* User info */}
              <div className="py-3 px-3.5 border-b border-border-default">
                <p className="text-[13px] leading-4 font-semibold text-text-heading m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                  {userName}
                </p>
                <p className="text-xs text-text-muted mt-0.5 mb-0 ml-0 mr-0">
                  {userEmail}
                </p>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full py-2.5 px-3.5 text-[13px] leading-4 text-text-muted bg-transparent border-none cursor-pointer text-left hover:bg-surface hover:text-text-heading"
              >
                <LogOut size={16} strokeWidth={1.5} />
                Keluar
              </button>
            </div>
          )}

          {/* User card trigger */}
          <div
            onClick={() => popoverOpen ? closePopover() : setPopoverOpen(true)}
            className="flex items-center gap-2.5 p-2.5 cursor-pointer rounded-md bg-white border border-border-default shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow duration-150 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
          >
            <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
              {initial}
            </div>
            <div className="flex flex-col gap-px flex-1 min-w-0">
              <span className="text-[13px] leading-4 font-medium text-text-heading whitespace-nowrap overflow-hidden text-ellipsis">
                {userName}
              </span>
            </div>
            <ChevronsUpDown
              size={16}
              strokeWidth={2}
              className="text-text-muted shrink-0"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
