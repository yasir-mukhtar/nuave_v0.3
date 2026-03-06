"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      textAlign: "center",
      padding: "24px 16px",
      fontSize: "13px",
      color: "var(--text-muted)",
      borderTop: "1px solid var(--border-default)",
      marginTop: "48px",
    }}>
      <Link href="/privacy" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
        Kebijakan Privasi
      </Link>
      {" · "}
      <Link href="/terms" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
        Syarat &amp; Ketentuan
      </Link>
      {" · "}
      <a href="mailto:hello@nuave.id" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
        Kontak
      </a>
    </footer>
  );
}
