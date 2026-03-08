'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconSmartHome,
  IconMessageDots,
  IconArticle,
  IconRosetteAsterisk,
  IconChevronUp,
} from '@tabler/icons-react';

type SidebarProps = {
  credits: number;
  userName: string;
  workspaceName: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconSmartHome },
  { label: "Prompt", href: "/dashboard/prompts", icon: IconMessageDots },
  { label: "Konten", href: "/content", icon: IconArticle },
  { label: "Brand", href: "/brand", icon: IconRosetteAsterisk },
];

const bottomLinks = [
  { label: "Bantuan", href: "/bantuan" },
  { label: "Panduan", href: "/panduan" },
  { label: "Pengaturan", href: "/settings" },
];

function getInitials(name: string) {
  if (!name) return "YM";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  const initials = (first + last).toUpperCase();
  return initials || "YM";
}

export function Sidebar({ userName, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(userName);

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

        {/* User profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px",
            borderTop: "1px solid var(--border-default)",
            paddingTop: "16px",
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
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {workspaceName}
            </span>
          </div>
          <IconChevronUp size={16} stroke={2} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
