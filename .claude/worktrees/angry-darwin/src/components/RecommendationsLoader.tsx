"use client";

import { useState, useEffect, useRef } from "react";
import { LOTTIE_DATA } from "./lottie/recommendations-loader-data";

const steps = [
  {
    id: 1,
    label: "Menganalisis hasil audit kamu",
    duration: 3000,
    subtasks: [
      { label: "Memproses 10 respons GPT-4o", duration: 800 },
      { label: "Memetakan pola penyebutan brand", duration: 1000 },
      { label: "Menilai kehadiran kompetitor", duration: 1200 },
    ],
  },
  {
    id: 2,
    label: "Menyiapkan rekomendasi",
    duration: 7000,
    subtasks: [
      { label: "Mengidentifikasi celah web copy", duration: 1500 },
      { label: "Menganalisis meta & struktur", duration: 2000 },
      { label: "Mencari peluang konten", duration: 2000 },
      { label: "Menyusun saran perbaikan", duration: 1500 },
    ],
  },
  {
    id: 3,
    label: "Memprioritaskan dampak",
    duration: 3000,
    subtasks: [
      { label: "Ranking berdasarkan dampak AEO", duration: 1200 },
      { label: "Menyesuaikan dengan profil brand", duration: 1000 },
      { label: "Finalisasi rekomendasi", duration: 800 },
    ],
  },
];

const TOTAL_DURATION = steps.reduce((a, s) => a + s.duration, 0);

function useProgress() {
  const [elapsed, setElapsed] = useState(0);
  const [started] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const e = Date.now() - started;
      setElapsed(Math.min(e, TOTAL_DURATION));
    }, 50);
    return () => clearInterval(interval);
  }, [started]);

  let currentStepIdx = 0;
  let stepsElapsed = 0;
  for (let i = 0; i < steps.length; i++) {
    if (elapsed >= stepsElapsed + steps[i].duration) {
      stepsElapsed += steps[i].duration;
      currentStepIdx = i + 1;
    } else {
      currentStepIdx = i;
      break;
    }
  }

  const currentStep = steps[Math.min(currentStepIdx, steps.length - 1)];
  const stepStart = steps.slice(0, currentStepIdx).reduce((a, s) => a + s.duration, 0);
  const stepElapsed = elapsed - stepStart;

  let subtaskIdx = 0;
  let subtaskElapsed = 0;
  for (let i = 0; i < currentStep.subtasks.length; i++) {
    if (stepElapsed >= subtaskElapsed + currentStep.subtasks[i].duration) {
      subtaskElapsed += subtaskElapsed + currentStep.subtasks[i].duration;
      subtaskIdx = i + 1;
    } else {
      subtaskIdx = i;
      break;
    }
  }

  const overallProgress = (elapsed / TOTAL_DURATION) * 100;
  const elapsed_seconds = Math.floor(elapsed / 1000);
  const done = elapsed >= TOTAL_DURATION;

  return { 
    currentStepIdx: Math.min(currentStepIdx, steps.length - 1), 
    subtaskIdx, 
    overallProgress, 
    elapsed_seconds, 
    done 
  };
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="7" fill="#22C55E" />
    <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpinnerDot = () => (
  <span style={{
    display: "inline-block", width: 14, height: 14, borderRadius: "50%",
    border: "2px solid #EDE9FF", borderTopColor: "var(--purple)",
    animation: "spin 0.7s linear infinite", flexShrink: 0
  }} />
);

const QueueDot = () => (
  <span style={{
    display: "inline-block", width: 14, height: 14, borderRadius: "50%",
    border: "2px solid #E5E7EB", flexShrink: 0
  }} />
);

function LottiePlayer({ animationData, size = 120 }: { animationData: any, size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lottie, setLottie] = useState<any>(null);

  useEffect(() => {
    // Dynamically load lottie-web from CDN
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
    script.onload = () => setLottie((window as any).lottie);
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
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

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
    />
  );
}

export default function RecommendationsLoader() {
  const { currentStepIdx, subtaskIdx, overallProgress, elapsed_seconds, done } = useProgress();

  return (
    <div style={{
      minHeight: "100vh", background: "#FFFFFF", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      fontFamily: "'Inter', system-ui, sans-serif", padding: "80px 20px 40px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .subtask-row { animation: fadeIn 0.3s ease both; }
      `}</style>

      {/* Lottie animation */}
      <div style={{ marginBottom: 24 }}>
        <LottiePlayer animationData={LOTTIE_DATA} size={120} />
      </div>

      {/* Headline */}
      <h2 style={{
        margin: "0 0 4px", fontSize: 20, fontWeight: 600,
        color: "#111827", letterSpacing: "-0.3px", textAlign: "center"
      }}>
        {done ? "Rekomendasi siap" : "Menyiapkan rekomendasi kamu\u2026"}
      </h2>
      <p style={{ margin: "0 0 32px", fontSize: 13, color: "#6B7280", textAlign: "center" }}>
        {done ? "Mengalihkan halaman sekarang" : `${elapsed_seconds} detik berlalu`}
      </p>

      {/* Progress bar */}
      <div style={{
        width: "100%", maxWidth: 480, height: 4, background: "#F3F4F6",
        borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: 32
      }}>
        <div style={{
          height: "100%", background: "var(--purple)", borderRadius: "var(--radius-full)",
          width: `${overallProgress}%`, transition: "width 0.15s linear"
        }} />
      </div>

      {/* Steps */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 4 }}>
        {steps.map((step, si) => {
          const isComplete = si < currentStepIdx || done;
          const isActive = si === currentStepIdx && !done;

          return (
            <div key={step.id} style={{
              borderRadius: 10,
              border: isActive ? "1px solid #EDE9FF" : "1px solid transparent",
              background: isActive ? "#FAFAFF" : "transparent",
              padding: isActive ? "14px 16px" : "10px 16px",
              transition: "all 0.3s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600,
                  background: isComplete ? "transparent" : isActive ? "#EDE9FF" : "#F3F4F6",
                  color: isActive ? "var(--purple)" : "#9CA3AF",
                }}>
                  {isComplete ? <CheckIcon /> : step.id}
                </div>

                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: isComplete ? "#6B7280" : isActive ? "#111827" : "#9CA3AF",
                  flex: 1,
                }}>
                  {step.label}
                </span>

                {isActive && (
                  <span style={{
                    fontSize: 11, color: "var(--purple)", fontWeight: 500,
                    animation: "pulse 1.5s ease infinite"
                  }}>
                    Langkah {si + 1} dari {steps.length}
                  </span>
                )}
              </div>

              {isActive && (
                <div style={{ marginTop: 10, marginLeft: 32, display: "flex", flexDirection: "column", gap: 8 }}>
                  {step.subtasks.map((sub, ti) => {
                    const subDone = ti < subtaskIdx;
                    const subActive = ti === subtaskIdx;

                    return (
                      <div key={ti} className="subtask-row" style={{
                        display: "flex", alignItems: "center", gap: 8,
                        animationDelay: `${ti * 60}ms`
                      }}>
                        {subDone ? <CheckIcon /> : subActive ? <SpinnerDot /> : <QueueDot />}
                        <span style={{
                          fontSize: 12,
                          color: subDone ? "#9CA3AF" : subActive ? "#374151" : "#D1D5DB",
                          textDecoration: subDone ? "line-through" : "none",
                        }}>
                          {sub.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
