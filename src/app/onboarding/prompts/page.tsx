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

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ProgressBar({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", gap: "4px", maxWidth: "200px", width: "100%" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: "3px",
            flex: 1,
            borderRadius: "999px",
            background: i < active ? "var(--purple)" : "var(--border-default)",
          }}
        />
      ))}
    </div>
  );
}

export default function PromptsPage() {
  return (
    <>
      <style>{`
        .prompt-row {
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }
        .prompt-row:hover {
          border-color: var(--purple) !important;
          background: #FAFBFF !important;
        }
        .prompt-row:hover .pencil-btn {
          color: var(--purple);
        }
        .pencil-btn {
          color: var(--text-placeholder);
          transition: color var(--transition-fast);
        }
        .back-btn:hover, .regen-btn:hover {
          color: var(--text-heading);
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
          padding: "40px 32px 80px",
        }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "32px",
            }}
          >
            <button
              className="back-btn"
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "color var(--transition-fast)",
              }}
            >
              ← Back
            </button>

            <ProgressBar active={4} />

            <button
              className="regen-btn"
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "color var(--transition-fast)",
              }}
            >
              ↺ Regenerate
            </button>
          </div>

          {/* Section header */}
          <div style={{ marginBottom: "24px" }}>
            <h1
              style={{
                fontSize: "var(--text-2xl)",
                fontWeight: 700,
                color: "var(--text-heading)",
                margin: 0,
              }}
            >
              Prompt suggestions
            </h1>
            <p
              style={{
                fontSize: "var(--text-base)",
                color: "var(--text-muted)",
                marginTop: "4px",
                marginBottom: 0,
              }}
            >
              We will ask these to ChatGPT to measure your brand visibility.
            </p>
          </div>

          {/* Prompt list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {prompts.map((prompt, i) => (
              <div
                key={i}
                className="prompt-row"
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--text-body)",
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {prompt}
                </span>
                <button
                  className="pencil-btn"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <PencilIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#ffffff",
          borderTop: "1px solid var(--border-default)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <button
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "#ffffff",
            background: "var(--purple)",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "10px 24px",
            cursor: "pointer",
          }}
        >
          Show results →
        </button>
      </div>
    </>
  );
}
