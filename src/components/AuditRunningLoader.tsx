"use client";

import { useState, useEffect, useRef } from "react";
import { LOTTIE_DATA } from "./lottie/recommendations-loader-data";
import { cn } from "@/lib/utils";

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

const MESSAGE_INTERVAL = 2500;

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

export default function AuditRunningLoader({ status }: AuditRunningLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
        setVisible(true);
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Lottie animation */}
      <div className="mb-6">
        <LottiePlayer animationData={LOTTIE_DATA} size={120} />
      </div>

      {/* Headline */}
      <h2 className={cn(
        "m-0 mb-2 text-[20px] font-semibold tracking-[-0.3px] text-center",
        isFailed ? "text-error" : "text-text-heading"
      )}>
        {headline}
      </h2>

      {/* Thinking message with fade */}
      <p
        className="type-body text-text-muted text-center m-0 mb-8 h-[22px]"
        style={{
          opacity: isDone || isFailed ? 1 : visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        {subline}
      </p>

      {/* Indeterminate shimmer progress bar */}
      {!isFailed && !isDone && (
        <div className="w-full max-w-[320px] h-[3px] bg-surface-raised rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 left-0 w-1/2 h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #533AFD, transparent)",
              animation: "shimmer 1.8s ease-in-out infinite",
            }}
          />
        </div>
      )}
    </div>
  );
}
