"use client";

import { useState, useEffect, useRef } from "react";
import { LOTTIE_DATA } from "./lottie/recommendations-loader-data";

// --- Step definitions ---
// Step 1 gets ~80% of the progress bar (it IS the bulk of the work)
// Steps 2 & 3 share the remaining ~20%
const STEP1_WEIGHT = 0.80;
const STEP2_WEIGHT = 0.10;
const STEP3_WEIGHT = 0.10;
const STEP2_DURATION = 2000; // ms — simulated animation for step 2
const STEP3_DURATION = 2000; // ms — simulated animation for step 3

// Prompt-to-stage mapping: 3 awareness + 4 consideration + 3 decision = 10
const AWARENESS_COUNT = 3;
const CONSIDERATION_COUNT = 4;
// decision = the rest

interface AuditRunningLoaderProps {
  completedPrompts: number;
  totalPrompts: number;
  status: "running" | "complete" | "failed";
}

interface ProgressState {
  currentStepIdx: number;
  subtaskIdx: number;
  overallProgress: number;
  elapsed_seconds: number;
  done: boolean;
  step1Waiting: boolean;
  promptLabel: string;
}

function useProgress(
  completedPrompts: number,
  totalPrompts: number,
  status: "running" | "complete" | "failed"
): ProgressState {
  const [started] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Step 2 & 3 start times (gated by real progress)
  const [step2Start, setStep2Start] = useState<number | null>(null);
  const [step2Elapsed, setStep2Elapsed] = useState(0);
  const [step3Start, setStep3Start] = useState<number | null>(null);
  const [step3Elapsed, setStep3Elapsed] = useState(0);

  const allPromptsDone = completedPrompts >= totalPrompts && totalPrompts > 0;

  // Start step 2 when all prompts are done
  useEffect(() => {
    if (allPromptsDone && !step2Start) {
      setStep2Start(Date.now());
    }
  }, [allPromptsDone, step2Start]);

  // Start step 3 when step 2 animation finishes AND status is complete
  useEffect(() => {
    if (step2Elapsed >= STEP2_DURATION && status === "complete" && !step3Start) {
      setStep3Start(Date.now());
    }
  }, [step2Elapsed, status, step3Start]);

  // Tick timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - started);
      if (step2Start) setStep2Elapsed(Math.min(Date.now() - step2Start, STEP2_DURATION));
      if (step3Start) setStep3Elapsed(Math.min(Date.now() - step3Start, STEP3_DURATION));
    }, 50);
    return () => clearInterval(interval);
  }, [started, step2Start, step3Start]);

  // --- Derive state ---
  const step1Progress = totalPrompts > 0 ? completedPrompts / totalPrompts : 0; // 0..1
  const step2Done = step2Elapsed >= STEP2_DURATION;
  const step3Done = step3Elapsed >= STEP3_DURATION;
  const done = step3Done;

  // Current step index
  let currentStepIdx: number;
  if (!allPromptsDone) {
    currentStepIdx = 0;
  } else if (!step2Done) {
    currentStepIdx = 1;
  } else {
    currentStepIdx = 2;
  }

  // Step 1 is "waiting" if last poll had same count (no visible progress for a while)
  // We detect this by checking if progress < 1 and enough time has passed
  const step1Waiting = !allPromptsDone && elapsed > 15000 && step1Progress < 1;

  // Subtask index for step 1 — based on which prompt stage we're in
  let subtaskIdx = 0;
  if (currentStepIdx === 0) {
    if (completedPrompts < AWARENESS_COUNT) {
      subtaskIdx = 0;
    } else if (completedPrompts < AWARENESS_COUNT + CONSIDERATION_COUNT) {
      subtaskIdx = 1;
    } else {
      subtaskIdx = 2;
    }
  } else if (currentStepIdx === 1) {
    // Step 2 subtasks by elapsed time
    const sub2 = [
      { duration: 700 },
      { duration: 700 },
      { duration: 600 },
    ];
    let acc = 0;
    subtaskIdx = 0;
    for (let i = 0; i < sub2.length; i++) {
      if (step2Elapsed >= acc + sub2[i].duration) {
        acc += sub2[i].duration;
        subtaskIdx = i + 1;
      } else {
        subtaskIdx = i;
        break;
      }
    }
  } else {
    // Step 3 subtasks by elapsed time
    const sub3 = [
      { duration: 700 },
      { duration: 700 },
      { duration: 600 },
    ];
    let acc = 0;
    subtaskIdx = 0;
    for (let i = 0; i < sub3.length; i++) {
      if (step3Elapsed >= acc + sub3[i].duration) {
        acc += sub3[i].duration;
        subtaskIdx = i + 1;
      } else {
        subtaskIdx = i;
        break;
      }
    }
  }

  // Overall progress
  let overallProgress: number;
  if (currentStepIdx === 0) {
    overallProgress = step1Progress * STEP1_WEIGHT * 100;
  } else if (currentStepIdx === 1) {
    overallProgress = (STEP1_WEIGHT + (step2Elapsed / STEP2_DURATION) * STEP2_WEIGHT) * 100;
  } else {
    overallProgress = (STEP1_WEIGHT + STEP2_WEIGHT + (step3Elapsed / STEP3_DURATION) * STEP3_WEIGHT) * 100;
  }
  overallProgress = Math.min(overallProgress, 100);

  // Dynamic prompt label
  let promptLabel = "";
  if (currentStepIdx === 0 && totalPrompts > 0) {
    promptLabel = `${completedPrompts} dari ${totalPrompts} pertanyaan`;
  }

  return {
    currentStepIdx,
    subtaskIdx,
    overallProgress,
    elapsed_seconds: Math.floor(elapsed / 1000),
    done,
    step1Waiting,
    promptLabel,
  };
}

// --- Shared visual components (unchanged) ---
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
    <div ref={containerRef} style={{ width: size, height: size }} />
  );
}

// --- Step definitions for rendering ---
const steps = [
  {
    id: 1,
    label: "Mengirim pertanyaan ke ChatGPT",
    subtasks: [
      { label: "Menguji pertanyaan awareness..." },
      { label: "Menguji pertanyaan consideration..." },
      { label: "Menguji pertanyaan decision..." },
    ],
  },
  {
    id: 2,
    label: "Menganalisis brand mentions",
    subtasks: [
      { label: "Memindai respons untuk brand Anda..." },
      { label: "Mendeteksi brand mentions kompetitor..." },
      { label: "Menghitung frekuensi brand mentions..." },
    ],
  },
  {
    id: 3,
    label: "Menghitung visibility score",
    subtasks: [
      { label: "Merangkum jumlah brand mentions..." },
      { label: "Menghitung visibility score..." },
      { label: "Menyiapkan hasil audit Anda..." },
    ],
  },
];

export default function AuditRunningLoader({
  completedPrompts,
  totalPrompts,
  status,
}: AuditRunningLoaderProps) {
  const {
    currentStepIdx,
    subtaskIdx,
    overallProgress,
    elapsed_seconds,
    done,
    step1Waiting,
    promptLabel,
  } = useProgress(completedPrompts, totalPrompts, status);

  const headline = status === "failed"
    ? "Terjadi kesalahan"
    : done
    ? "Audit selesai"
    : "Berkomunikasi dengan ChatGPT\u2026";

  const subline = status === "failed"
    ? "Audit gagal. Silakan coba lagi."
    : done
    ? "Menyiapkan hasil Anda"
    : step1Waiting
    ? `Masih memproses\u2026 ${elapsed_seconds} detik`
    : promptLabel
    ? `${promptLabel} \u2022 ${elapsed_seconds} detik`
    : `${elapsed_seconds} detik berlalu`;

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
        color: status === "failed" ? "#EF4444" : "#111827",
        letterSpacing: "-0.3px", textAlign: "center"
      }}>
        {headline}
      </h2>
      <p style={{ margin: "0 0 32px", fontSize: 13, color: "#6B7280", textAlign: "center" }}>
        {subline}
      </p>

      {/* Progress bar */}
      {status !== "failed" && (
        <div style={{
          width: "100%", maxWidth: 480, height: 4, background: "#F3F4F6",
          borderRadius: 99, overflow: "hidden", marginBottom: 32
        }}>
          <div style={{
            height: "100%", background: "var(--purple)", borderRadius: 99,
            width: `${overallProgress}%`, transition: "width 0.3s ease"
          }} />
        </div>
      )}

      {/* Steps */}
      {status !== "failed" && (
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
                      {si === 0 && promptLabel
                        ? promptLabel
                        : `Langkah ${si + 1} dari ${steps.length}`}
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
      )}
    </div>
  );
}
