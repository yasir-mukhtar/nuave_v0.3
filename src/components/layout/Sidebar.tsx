'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  IconLayoutDashboard, 
  IconList, 
  IconFileDescription, 
  IconSettings, 
  IconCoins 
} from '@tabler/icons-react';
import { useCreditsBalance } from "@/hooks/useCreditsBalance";

type SidebarProps = {
  credits: number;
  userName: string;
  workspaceName: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "Prompts", href: "/dashboard/prompts", icon: IconList },
  { label: "Content", href: "/content", icon: IconFileDescription },
  { label: "Settings", href: "/settings", icon: IconSettings },
];

function getInitials(name: string) {
  if (!name) return "YM";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  const initials = (first + last).toUpperCase();
  return initials || "YM";
}

export function Sidebar({ credits: initialCredits, userName, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(userName);
  const { credits } = useCreditsBalance();

  return (
    <aside
      style={{
        width: "240px",
        height: "100vh",
        position: "sticky",
        top: 0,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-default)",
      }}
    >
      {/* Logo area */}
      <Link
        href="/"
        style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo-nuave.svg" alt="Nuave" width="32" height="32" style={{ display: 'block' }} />
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>Nuave</span>
        </div>
      </Link>

      {/* Nav */}
      <nav
        style={{
          marginTop: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);

          const baseColor = "var(--text-muted)";
          const activeColor = "var(--purple)";
          const hoverColor = "var(--text-heading)";

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
                  padding: "0 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: isActive ? activeColor : baseColor,
                  background: isActive ? "#ffffff" : "transparent",
                  boxShadow: isActive ? "var(--shadow-card)" : "none",
                  transition: "var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    "#ffffff";
                  (e.currentTarget as HTMLDivElement).style.color = hoverColor;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    isActive ? "#ffffff" : "transparent";
                  (e.currentTarget as HTMLDivElement).style.color = isActive
                    ? activeColor
                    : baseColor;
                }}
              >
                <Icon size={18} stroke={1.5} />
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom area */}
      <div
        style={{
          marginTop: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--purple)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {initials}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-heading)",
              }}
            >
              {userName}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              {workspaceName}
            </span>
          </div>
        </div>

        {/* Credits chip */}
        <div
          style={{
            marginTop: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            background: "var(--purple-light)",
            color: "var(--purple)",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <IconCoins size={14} stroke={1.5} />
          <span>{credits ?? "—"} credits</span>
        </div>
      </div>
    </aside>
  );
}
