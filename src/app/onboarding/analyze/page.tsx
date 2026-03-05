"use client";

const steps = [
  { state: "done", label: "Scraping website" },
  { state: "done", label: "Detecting language", subtitle: "Detected: Indonesian" },
  { state: "active", label: "Analyzing your product" },
  { state: "pending", label: "Generating differentiators" },
  { state: "pending", label: "Finding competitors" },
  { state: "pending", label: "Creating company profile" },
] as const;

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12 l4 4 l6-6" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.9s linear infinite" }}>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="var(--purple)"
        strokeWidth="2.5"
        strokeDasharray="40 60"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AnalyzePage() {
  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "480px", width: "100%", padding: "40px 24px" }}>

          {/* Progress bar */}
          <div style={{ marginBottom: "40px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Analyzing your brand
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Step 2 of 4
              </span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "3px",
                    flex: 1,
                    borderRadius: "999px",
                    background: i < 2 ? "var(--purple)" : "var(--border-default)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Step list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {steps.map((step) => {
              const isDone = step.state === "done";
              const isActive = step.state === "active";

              return (
                <div
                  key={step.label}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    background: isActive ? "var(--bg-surface)" : "#ffffff",
                    border: "1px solid var(--border-default)",
                    borderLeft: isDone
                      ? "3px solid var(--green)"
                      : isActive
                      ? "3px solid var(--purple)"
                      : "1px solid var(--border-default)",
                  }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDone
                        ? "var(--green-light)"
                        : isActive
                        ? "transparent"
                        : "var(--bg-surface-raised)",
                      border: isActive ? "2px solid var(--purple)" : "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {isDone && <CheckIcon />}
                    {isActive && <SpinnerIcon />}
                  </div>

                  {/* Label + subtitle */}
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: isDone || isActive ? (isActive ? 600 : 500) : 400,
                        color: step.state === "pending" ? "var(--text-placeholder)" : "var(--text-heading)",
                      }}
                    >
                      {step.label}
                    </div>
                    {"subtitle" in step && step.subtitle && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {step.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
