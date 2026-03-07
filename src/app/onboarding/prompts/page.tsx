"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconPencil, IconArrowLeft, IconRefresh, IconArrowRight } from '@tabler/icons-react';

interface Prompt {
  id: string;
  prompt_text: string;
  stage: string;
  language: string;
  workspace_id?: string;
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
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedPrompts = sessionStorage.getItem("nuave_prompts");
    if (!storedPrompts) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(storedPrompts);
      if (parsed.success && Array.isArray(parsed.prompts)) {
        setPrompts(parsed.prompts);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to parse prompts from sessionStorage", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleRunAudit = () => {
    setError(null);

    try {
      const profileStr = sessionStorage.getItem("nuave_profile");
      const profileData = profileStr ? JSON.parse(profileStr) : null;
      
      const workspace_id = profileData?.workspace_id || crypto.randomUUID();
      const brand_name = profileData?.profile?.brand_name || "";
      const website_url = profileData?.profile?.website_url || profileData?.website_url || "";

      const { prompts: storedPrompts } = JSON.parse(
        sessionStorage.getItem("nuave_prompts") || '{"prompts":[]}'
      );

      // Start audit in background (don't await)
      fetch("/api/run-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workspace_id, 
          prompts: storedPrompts,
          brand_name,
          website_url,
          profile: profileData?.profile
        }),
      }).then(async (res) => {
        const data = await res.json();
        if (data.audit_id) {
          // Save the audit_id immediately for the running screen
          sessionStorage.setItem("nuave_pending_audit_id", data.audit_id);
        }
      }).catch(err => {
        console.error("Audit error:", err);
      });

      // Immediately redirect to running screen
      router.push("/audit/temp/running");
      
    } catch (err: any) {
      console.error("Audit error:", err);
      setError(err.message || "An unexpected error occurred during the audit.");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-page)",
        }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading prompts...</p>
      </div>
    );
  }

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
              onClick={() => router.back()}
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "color var(--transition-fast)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <IconArrowLeft size={18} stroke={1.5} /> Back
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
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <IconRefresh size={18} stroke={1.5} /> Regenerate
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

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                marginBottom: "24px",
                color: "#991B1B",
                fontSize: "var(--text-sm)",
              }}
            >
              {error}
            </div>
          )}

          {/* Prompt list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {prompts.map((prompt, index) => (
              <div
                key={prompt.id || index}
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
                  {prompt.prompt_text}
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
                  <IconPencil size={18} stroke={1.5} />
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
          onClick={handleRunAudit}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "#ffffff",
            background: "var(--purple)",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "10px 24px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Show results <IconArrowRight size={18} stroke={1.5} />
        </button>
      </div>
    </>
  );
}
