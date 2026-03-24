"use client";

import { useState, useEffect, useRef } from "react";
import { LOTTIE_DATA } from "./lottie/recommendations-loader-data";

// --- Thinking messages that cycle during the audit ---
const THINKING_MESSAGES = [
  "Mengirim pertanyaan ke ChatGPT...",
  "Mencari informasi di web...",
  "Menganalisis hasil pencarian...",
  "Memeriksa apakah AI menyebut brand Anda...",
  "Membandingkan dengan kompetitor...",
  "Memindai respons dari AI...",
  "Menghitung visibility score...",
  "Menyusun laporan audit...",
  "Hampir selesai...",
];

const MESSAGE_INTERVAL = 2500; // ms between messages

interface AuditRunningLoaderProps {
  completedPrompts: number;
  totalPrompts: number;
  status: "running" | "complete" | "failed";
}

function LottiePlayer({ animationData, size = 120 }: { animationData: any; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lottie, setLottie] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
    script.onload = () => setLottie((window as any).lottie);
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!lottie || !containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "canvas",
      loop: true,
      autoplay: true,
      animationData,
    });
    return () => anim.destroy();
  }, [lottie, animationData]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

export default function AuditRunningLoader({
  status,
}: AuditRunningLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Cycle through thinking messages with fade transition
  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setVisible(false); // fade out
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
        setVisible(true); // fade in
      }, 300);
    }, MESSAGE_INTERVAL);

    return () => clearInterval(interval);
  }, [status]);

  const isDone = status === "complete";
  const isFailed = status === "failed";

  const headline = isFailed
    ? "Terjadi kesalahan"
    : isDone
      ? "Audit selesai!"
      : "Menjalankan audit\u2026";

  const subline = isFailed
    ? "Audit gagal. Silakan coba lagi."
    : isDone
      ? "Menyiapkan hasil Anda\u2026"
      : THINKING_MESSAGES[msgIndex];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "40px 20px",
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Lottie animation */}
      <div style={{ marginBottom: 24 }}>
        <LottiePlayer animationData={LOTTIE_DATA} size={120} />
      </div>

      {/* Headline */}
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: 20,
          fontWeight: 600,
          color: isFailed ? "#EF4444" : "#111827",
          letterSpacing: "-0.3px",
          textAlign: "center",
        }}
      >
        {headline}
      </h2>

      {/* Thinking message with fade */}
      <p
        style={{
          margin: "0 0 32px",
          fontSize: 14,
          color: "#6B7280",
          textAlign: "center",
          height: 22,
          opacity: isDone || isFailed ? 1 : visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        {subline}
      </p>

      {/* Indeterminate shimmer progress bar */}
      {!isFailed && !isDone && (
        <div
          style={{
            width: "100%",
            maxWidth: 320,
            height: 3,
            background: "#F3F4F6",
            borderRadius: 999,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "50%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, #533AFD, transparent)",
              borderRadius: 999,
              animation: "shimmer 1.8s ease-in-out infinite",
            }}
          />
        </div>
      )}
    </div>
  );
}
