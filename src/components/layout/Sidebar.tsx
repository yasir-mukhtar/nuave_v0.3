'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  credits: number;
  userName: string;
  workspaceName: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Prompts", href: "/prompts" },
  { label: "Content", href: "/content" },
  { label: "Settings", href: "/settings" },
];

function getInitials(name: string) {
  if (!name) return "YM";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  const initials = (first + last).toUpperCase();
  return initials || "YM";
}

function CoinIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 7v10M9.5 9.5h3.5a2 2 0 0 1 0 4H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type NavIconProps = {
  active?: boolean;
};

function DashboardIcon({ active }: NavIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="3"
        width="8"
        height="8"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="13"
        y="3"
        width="8"
        height="5"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="13"
        y="10"
        width="8"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="13"
        width="8"
        height="8"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function PromptsIcon({ active }: NavIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 9h8M8 13h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ContentIcon({ active }: NavIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 8h8M8 12h6M8 16h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon({ active }: NavIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 9a1 1 0 0 0 .2-1.1l-1.2-2.1a1 1 0 0 0-1.1-.5l-1.4.4a6 6 0 0 0-1.8-1l-.3-1.4A1 1 0 0 0 12 2h-2.4a1 1 0 0 0-1 .8L8.3 4.2a6 6 0 0 0-1.8 1L5.1 4.3a1 1 0 0 0-1.1.5L2.8 6.9a1 1 0 0 0 .2 1.1l1.1 1a6 6 0 0 0-.1 2l-1.1 1a1 1 0 0 0-.2 1.1l1.2 2.1a1 1 0 0 0 1.1.5l1.4-.4a6 6 0 0 0 1.8 1l.3 1.4a1 1 0 0 0 1 .8H12a1 1 0 0 0 1-.8l.3-1.4a6 6 0 0 0 1.8-1l1.4.4a1 1 0 0 0 1.1-.5l1.2-2.1a1 1 0 0 0-.2-1.1l-1.1-1a6 6 0 0 0 .1-2l1.1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sidebar({ credits, userName, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(userName);

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
      <div
        style={{
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "3px",
            background: "var(--purple)",
          }}
        />
        <span
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text-heading)",
          }}
        >
          Nuave
        </span>
      </div>

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
                {item.label === "Dashboard" && (
                  <DashboardIcon active={isActive} />
                )}
                {item.label === "Prompts" && <PromptsIcon active={isActive} />}
                {item.label === "Content" && <ContentIcon active={isActive} />}
                {item.label === "Settings" && (
                  <SettingsIcon active={isActive} />
                )}
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
          <CoinIcon />
          <span>{credits} credits</span>
        </div>
      </div>
    </aside>
  );
}

