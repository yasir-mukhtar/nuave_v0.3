"use client";
import { useState } from "react";
import Link from "next/link";
import { IconBrandX, IconBrandInstagram, IconBrandLinkedin } from "@tabler/icons-react";

const LOGO_SVG = "https://framerusercontent.com/images/r9wYEZlQeEIZBKytCeKUn5f1QGw.svg";
const PURPLE = "#6C3FF5";

const NAV_LINKS = [
  { label: "Syarat dan Ketentuan", href: "/terms" },
  { label: "Kebijakan Privasi", href: "/privacy" },
  { label: "Kontak", href: "/support" },
];

const SOCIAL = [
  { icon: IconBrandX, href: "https://x.com/nuaveAI", label: "X" },
  { icon: IconBrandInstagram, href: "https://instagram.com/nuave.ai", label: "Instagram" },
  { icon: IconBrandLinkedin, href: "https://linkedin.com/company/nuave", label: "LinkedIn" },
];

function NavLink({ label, href }: { label: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 400,
        fontSize: 14,
        lineHeight: "20px",
        color: hovered ? PURPLE : "#6B7280",
        textDecoration: "none",
        transition: "color 0.15s ease",
      }}
    >
      {label}
    </Link>
  );
}

function SocialIcon({ icon: Icon, href, label }: { icon: typeof IconBrandX; href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: hovered ? PURPLE : "#111827",
        color: "#ffffff",
        textDecoration: "none",
        flexShrink: 0,
        transition: "background-color 0.15s ease",
      }}
    >
      <Icon size={18} stroke={1.5} />
    </a>
  );
}

export default function Footer() {
  return (
    <footer style={{ padding: "110px 32px", background: "#ffffff" }}>
      <div style={{ maxWidth: 1045, margin: "0 auto" }}>

        {/* Row 1: Footer menu + Social icons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 72,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {NAV_LINKS.map((link) => (
              <NavLink key={link.label} {...link} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              lineHeight: "20px",
              color: "#111827",
              marginRight: 4,
            }}>
              Ikuti Kami
            </span>
            {SOCIAL.map((s) => (
              <SocialIcon key={s.label} {...s} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#E5E7EB" }} />

        {/* Row 2: Logo + tagline + copyright */}
        <div style={{
          marginTop: 56,
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={LOGO_SVG} alt="Nuave" width={28} height={28} style={{ objectFit: "contain" }} />
            <span style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 18,
              color: "#111827",
            }}>
              Nuave
            </span>
          </div>

          <p style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "20px",
            color: "#374151",
            margin: 0,
          }}>
            Nuave membantu brand Anda muncul dalam pencarian di ChatGPT
          </p>

          <p style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "20px",
            color: "#374151",
            margin: 0,
            marginLeft: "auto",
          }}>
            © {new Date().getFullYear()} Nuave · Hak cipta dilindungi
          </p>
        </div>

      </div>
    </footer>
  );
}
