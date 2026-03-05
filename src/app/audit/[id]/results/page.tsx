const rows: { prompt: string; mentioned: boolean }[] = [
  {
    prompt: "What companies provide secure banknote printing services in Southeast Asia?",
    mentioned: false,
  },
  {
    prompt: "Which government-certified security document printers operate in Indonesia?",
    mentioned: true,
  },
  {
    prompt: "What solutions exist for preventing passport and identity document fraud?",
    mentioned: false,
  },
  {
    prompt: "How do central banks choose their banknote printing partners?",
    mentioned: true,
  },
  {
    prompt: "What are the best options for high-security stamp and certificate printing?",
    mentioned: false,
  },
  {
    prompt: "Which companies produce tamper-proof government documents in ASEAN?",
    mentioned: true,
  },
  {
    prompt: "Apa perusahaan percetakan dokumen keamanan terpercaya di Indonesia?",
    mentioned: true,
  },
  {
    prompt: "Bagaimana cara memilih vendor cetak uang dan dokumen resmi pemerintah?",
    mentioned: false,
  },
  {
    prompt: "What technology is used in modern banknote security features?",
    mentioned: false,
  },
  {
    prompt: "Which printers specialize in holographic and watermark security features?",
    mentioned: false,
  },
];

const competitors = ["De La Rue", "Giesecke+Devrient", "Canadian Bank Note Co."];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12 l4 4 l6-6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function ResultsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Page title */}
        <h1
          style={{
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
            color: "var(--text-heading)",
            textAlign: "center",
            marginBottom: "32px",
            marginTop: 0,
          }}
        >
          Your AI Visibility Score
        </h1>

        {/* 1. Score hero card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border-default)",
            borderRadius: "16px",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Score circle */}
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="68" fill="none" stroke="#E5E7EB" strokeWidth="10" />
            <circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="170.9 256.4"
              transform="rotate(-90 80 80)"
            />
            <text x="80" y="75" textAnchor="middle" fontSize="42" fontWeight="700" fill="#111827" fontFamily="inherit">
              40
            </text>
            <text x="80" y="98" textAnchor="middle" fontSize="13" fill="#F59E0B" fontWeight="600" fontFamily="inherit">
              Partially Visible
            </text>
          </svg>

          {/* Caption */}
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
            4 of 10 prompts mentioned your brand
          </p>

          {/* Competitor strip */}
          <div
            style={{
              borderTop: "1px solid var(--border-default)",
              paddingTop: "16px",
              marginTop: "8px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "10px", marginTop: 0 }}>
              ChatGPT mentioned these competitors instead:
            </p>
            <div>
              {competitors.map((c) => (
                <span
                  key={c}
                  style={{
                    display: "inline-flex",
                    background: "var(--bg-surface-raised)",
                    color: "var(--text-body)",
                    borderRadius: "var(--radius-full)",
                    padding: "4px 12px",
                    fontSize: "13px",
                    margin: "0 4px",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Prompt results card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-default)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--text-heading)" }}>
              Prompt Results
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              10 tested
            </span>
          </div>

          {/* Result rows */}
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 20px",
                borderBottom: i < rows.length - 1 ? "1px solid var(--bg-surface-raised)" : "none",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: row.mentioned ? "var(--green-light)" : "var(--red-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {row.mentioned ? <CheckIcon /> : <XIcon />}
              </div>

              {/* Prompt text */}
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-body)",
                  flex: 1,
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {row.prompt}
              </span>

              {/* Badge */}
              <span
                style={{
                  flexShrink: 0,
                  borderRadius: "var(--radius-full)",
                  padding: "3px 10px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: row.mentioned ? "var(--green-light)" : "var(--red-light)",
                  color: row.mentioned ? "#16A34A" : "var(--red)",
                  whiteSpace: "nowrap",
                }}
              >
                {row.mentioned ? "Mentioned" : "Not mentioned"}
              </span>
            </div>
          ))}
        </div>

        {/* 3. CTA bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
          <button
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--text-body)",
              background: "#ffffff",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Save report
          </button>
          <button
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "#ffffff",
              background: "var(--purple)",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            See recommendations →
          </button>
        </div>
      </div>
    </div>
  );
}
