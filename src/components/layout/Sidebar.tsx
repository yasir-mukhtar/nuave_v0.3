'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconSmartHome,
  IconMessageDots,
  IconArticle,
  IconRosetteAsterisk,
  IconChevronUp,
  IconLogout,
} from '@tabler/icons-react';
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SidebarProps = {
  credits: number;
  userName: string;
  userEmail: string;
  workspaceName: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconSmartHome },
  { label: "Prompt", href: "/dashboard/prompts", icon: IconMessageDots },
  { label: "Konten", href: "/content", icon: IconArticle },
  { label: "Brand", href: "/brand", icon: IconRosetteAsterisk },
];

const bottomLinks = [
  { label: "Bantuan", href: "/support" },
];

function getInitials(name: string) {
  if (!name) return "YM";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  const initials = (first + last).toUpperCase();
  return initials || "YM";
}

export function Sidebar({ userName, userEmail, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = getInitials(userName);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
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
    <aside
      style={{
        width: "200px",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 10,
        padding: "24px 16px 16px",
        display: "flex",
        flexDirection: "column",
        background: "#F5F5F5",
        borderRight: "1px solid var(--border-default)",
      }}
    >
      {/* Logo area */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          marginBottom: "32px",
        }}
      >
        <img src="/logo-nuave.svg" alt="Nuave" width="28" height="28" style={{ display: 'block' }} />
        <span style={{ fontWeight: 700, fontSize: '17px', color: 'var(--text-heading)' }}>Nuave</span>
      </Link>

      {/* Primary nav */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
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
              style={{
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  height: "36px",
                  padding: "0 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: isActive ? "var(--text-heading)" : "var(--text-muted)",
                  background: "transparent",
                  transition: "var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-body)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
              >
                <Icon size={18} stroke={2} />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0px" }}>
        {/* Secondary links */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            marginBottom: "20px",
          }}
        >
          {bottomLinks.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  display: "block",
                  padding: "6px 8px",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--text-heading)" : "var(--text-muted)",
                  borderRadius: "6px",
                  transition: "var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-body)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile with popover */}
        <div ref={popoverRef} style={{ position: "relative" }}>

          {/* Popover */}
          {popoverOpen && (
            <div
              className="popover-up"
              style={{
                position: "absolute",
                bottom: "calc(100% + 4px)",
                left: 0,
                width: "max-content",
                minWidth: "100%",
                background: "#ffffff",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              {/* User info */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-default)" }}>
                <p style={{
                  fontSize: "13px", fontWeight: 600, color: "var(--text-heading)",
                  margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {userName}
                </p>
                <p style={{
                  fontSize: "12px", color: "var(--text-muted)",
                  margin: "2px 0 0 0",
                }}>
                  {userEmail}
                </p>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  width: "100%", padding: "10px 14px",
                  fontSize: "13px", color: "var(--text-muted)",
                  background: "none", border: "none", cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface)";
                  e.currentTarget.style.color = "var(--text-heading)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <IconLogout size={16} stroke={1.5} />
                Keluar
              </button>
            </div>
          )}

          {/* User card trigger */}
          <div
            onClick={() => setPopoverOpen(!popoverOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              cursor: "pointer",
              borderRadius: "8px",
              background: "#ffffff",
              border: "1px solid var(--border-default)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--purple)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-heading)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName}
              </span>
            </div>
            <IconChevronUp
              size={16}
              stroke={2}
              style={{
                color: "var(--text-muted)",
                flexShrink: 0,
                transform: popoverOpen ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
