"use client";

const prompts = [
  "What companies provide secure banknote printing services in Southeast Asia?",
  "Which government-certified security document printers operate in Indonesia?",
  "What solutions exist for preventing passport and identity document fraud?",
  "How do central banks choose their banknote printing partners?",
  "What are the best options for high-security stamp and certificate printing?",
  "Which companies produce tamper-proof government documents in ASEAN?",
  "Apa perusahaan percetakan dokumen keamanan terpercaya di Indonesia?",
  "Bagaimana cara memilih vendor cetak uang dan dokumen resmi pemerintah?",
  "What technology is used in modern banknote security features?",
  "Which printers specialize in holographic and watermark security features?",
];

const DONE_COUNT = 7;
const ACTIVE_INDEX = 7; // 0-based, row 8

function getRowState(index: number): "done" | "active" | "pending" {
  if (index < DONE_COUNT) return "done";
  if (index === ACTIVE_INDEX) return "active";
  return "pending";
}

export default function AuditRunningPage() {
  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50%       { opacity: 0.2; transform: scale(1.06); }
        }
        @keyframes dotPulse {
          from { opacity: 1; }
          to   { opacity: 0.3; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "32px",
          }}
        >
          {/* 1. Pulsing circle */}
          <div style={{ position: "relative", width: "200px", height: "200px" }}>
            {/* Outer ring */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "3px solid var(--purple)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            {/* Inner icon */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--purple)",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>

          {/* 2. Text block */}
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <h1
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color: "var(--text-heading)",
                margin: 0,
              }}
            >
              Testing your brand visibility...
            </h1>
            <p
              style={{
                fontSize: "var(--text-base)",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Asking ChatGPT 10 targeted questions about your brand
            </p>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-placeholder)",
                margin: "4px 0 0",
              }}
            >
              7 / 10 prompts completed
            </p>
          </div>

          {/* 3. Prompt mini-list */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
            {prompts.map((prompt, i) => {
              const state = getRowState(i);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    height: "36px",
                    padding: "0 4px",
                  }}
                >
                  {/* Status dot */}
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        state === "done"
                          ? "var(--green)"
                          : state === "active"
                          ? "var(--purple)"
                          : "var(--border-default)",
                      animation: state === "active" ? "dotPulse 1s ease-in-out infinite alternate" : "none",
                    }}
                  />
                  {/* Prompt text */}
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: state === "active" ? 500 : 400,
                      color:
                        state === "done"
                          ? "var(--text-muted)"
                          : state === "active"
                          ? "var(--text-body)"
                          : "var(--text-placeholder)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {prompt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
