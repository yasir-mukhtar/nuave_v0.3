"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconChevronUp, IconChevronDown, IconPlus } from "@tabler/icons-react";
import WizardLayout from "@/components/new-project/WizardLayout";

interface Prompt {
  id: string;
  text: string;
  checked: boolean;
}

interface TopicGroup {
  id: string;
  name: string;
  prompts: Prompt[];
  expanded: boolean;
}

const MAX_PROMPTS = 10;

export default function PromptsPage() {
  const router = useRouter();
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  // Load topics from session and fetch AI-generated prompts
  useEffect(() => {
    const topicsData = sessionStorage.getItem("nuave_new_project_topics");
    const projectData = sessionStorage.getItem("nuave_new_project");
    if (!topicsData || !projectData) {
      router.replace("/new-project");
      return;
    }
    const topics: { id: string; name: string }[] = JSON.parse(topicsData);
    const project = JSON.parse(projectData);

    (async () => {
      try {
        const res = await fetch("/api/generate-topic-prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand_name: project.brandName,
            topics: topics.map((t) => t.name),
            language: project.language || "id",
          }),
        });
        const data = await res.json();

        if (data.success && data.prompts) {
          const groups: TopicGroup[] = topics.map((t, i) => {
            const topicPrompts: string[] = data.prompts[t.name] || [];
            return {
              id: t.id,
              name: t.name,
              prompts: topicPrompts.map((text: string, j: number) => ({
                id: `${i}-${j}`,
                text,
                checked: true,
              })),
              expanded: i === 0,
            };
          });
          setTopicGroups(groups);
        } else {
          // Fallback: empty prompts, user can add manually
          setTopicGroups(topics.map((t, i) => ({
            id: t.id,
            name: t.name,
            prompts: [],
            expanded: i === 0,
          })));
        }
      } catch {
        setTopicGroups(topics.map((t, i) => ({
          id: t.id,
          name: t.name,
          prompts: [],
          expanded: i === 0,
        })));
      }
      setLoadingPrompts(false);
    })();
  }, [router]);

  const totalSelected = topicGroups.reduce(
    (sum, g) => sum + g.prompts.filter((p) => p.checked).length,
    0
  );

  const toggleExpand = (groupId: string) => {
    setTopicGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, expanded: !g.expanded } : g))
    );
  };

  const togglePrompt = (groupId: string, promptId: string) => {
    setTopicGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        // Count currently selected across all groups excluding this toggle
        const otherSelected = prev
          .filter((og) => og.id !== groupId)
          .reduce((s, og) => s + og.prompts.filter((p) => p.checked).length, 0);
        const thisGroupSelected = g.prompts.filter((p) => p.checked).length;
        const target = g.prompts.find((p) => p.id === promptId);
        if (!target) return g;

        // If trying to check and already at max, don't allow
        if (!target.checked && otherSelected + thisGroupSelected >= MAX_PROMPTS) return g;

        return {
          ...g,
          prompts: g.prompts.map((p) =>
            p.id === promptId ? { ...p, checked: !p.checked } : p
          ),
        };
      })
    );
  };

  const addCustomPrompt = (groupId: string) => {
    const text = customPrompt.trim();
    if (!text) return;
    if (totalSelected >= MAX_PROMPTS) return;

    setTopicGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          prompts: [
            ...g.prompts,
            { id: `custom-${Date.now()}`, text, checked: true },
          ],
        };
      })
    );
    setCustomPrompt("");
    setAddingTo(null);
  };

  const selectedCountForGroup = (group: TopicGroup) =>
    group.prompts.filter((p) => p.checked).length;

  const handleSubmit = async () => {
    if (totalSelected === 0 || loading) return;
    setLoading(true);

    const selectedPrompts = topicGroups.flatMap((g) =>
      g.prompts
        .filter((p) => p.checked)
        .map((p) => ({ topicId: g.id, topicName: g.name, prompt: p.text }))
    );
    sessionStorage.setItem("nuave_new_project_prompts", JSON.stringify(selectedPrompts));

    const projectRaw = sessionStorage.getItem("nuave_new_project");
    if (!projectRaw) { router.replace("/new-project"); return; }
    const project = JSON.parse(projectRaw);

    // Build prompts array for the audit API
    const prompts = selectedPrompts.map((p, i) => ({
      id: p.topicId + "-" + i,
      prompt_text: p.prompt,
      stage: "awareness",
      language: project.language || "id",
      display_order: i,
    }));

    try {
      // Save prompts to DB
      await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: project.workspaceId,
          profile: {
            ...project.profile,
            brand_name: project.brandName,
            website_url: project.url,
          },
        }),
      });

      // Run the audit
      const auditRes = await fetch("/api/run-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: project.workspaceId,
          prompts,
          brand_name: project.brandName,
          website_url: project.url,
          profile: project.profile,
        }),
      });
      const auditData = await auditRes.json();

      if (auditData.success && auditData.audit_id) {
        router.push(`/new-project/running?audit_id=${auditData.audit_id}`);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <WizardLayout
      currentStep={3}
      totalSteps={3}
      onClose={() => router.push("/dashboard")}
    >
      {/* Heading */}
      <h1 style={{
        fontFamily: "var(--font-heading)",
        fontSize: 24,
        fontWeight: 600,
        color: "#111827",
        marginBottom: 8,
        letterSpacing: "-0.02em",
      }}>
        Tentukan Pertanyaan
      </h1>
      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: 15,
        color: "var(--text-muted)",
        marginBottom: 36,
        lineHeight: 1.6,
      }}>
        Kami akan mengajukan pertanyaan ini ke AI untuk melihat apakah brand Anda direkomendasikan.
      </p>

      {/* Label + counter */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--text-muted)",
        }}>
          Topik
        </span>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: totalSelected >= MAX_PROMPTS ? "var(--purple)" : "var(--text-muted)",
          fontWeight: totalSelected >= MAX_PROMPTS ? 600 : 400,
        }}>
          {totalSelected}/{MAX_PROMPTS}
        </span>
      </div>

      {/* Loading state */}
      {loadingPrompts && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{
            width: 32, height: 32,
            border: "3px solid #E5E7EB", borderTop: "3px solid var(--purple)",
            borderRadius: "50%", animation: "spin 1s linear infinite",
            margin: "0 auto 12px",
          }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>
            Membuat pertanyaan audit...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Topic accordions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36, ...(loadingPrompts ? { display: "none" } : {}) }}>
        {topicGroups.map((group) => (
          <div
            key={group.id}
            style={{
              border: group.expanded ? "1.5px solid var(--purple)" : "1px solid var(--border-default)",
              borderRadius: 8,
              overflow: "hidden",
              transition: "border-color 0.15s ease",
            }}
          >
            {/* Accordion header */}
            <button
              type="button"
              onClick={() => toggleExpand(group.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "14px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#111827",
                }}>
                  {group.name}
                </span>
                <span style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}>
                  -  {selectedCountForGroup(group)} {group.expanded ? "prompts dipilih" : "dipilih"}
                </span>
              </div>
              {group.expanded ? (
                <IconChevronUp size={18} stroke={1.5} color="var(--text-muted)" />
              ) : (
                <IconChevronDown size={18} stroke={1.5} color="var(--text-muted)" />
              )}
            </button>

            {/* Expanded content */}
            {group.expanded && (
              <div style={{ padding: "0 16px 16px" }}>
                {/* Prompts label */}
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 12,
                }}>
                  Prompts
                </p>

                {/* Prompt list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => togglePrompt(group.id, prompt.id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        width: "100%",
                        padding: "10px 0",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: prompt.checked ? "none" : "1.5px solid var(--border-strong)",
                        backgroundColor: prompt.checked ? "var(--purple)" : "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                        transition: "background-color 0.15s ease",
                      }}>
                        {prompt.checked && (
                          <svg width="10" height="8" viewBox="0 0 12 9" fill="none">
                            <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        color: "#111827",
                        lineHeight: 1.5,
                      }}>
                        {prompt.text}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Add custom prompt */}
                {addingTo === group.id ? (
                  <div style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                  }}>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addCustomPrompt(group.id); }
                        if (e.key === "Escape") { setAddingTo(null); setCustomPrompt(""); }
                      }}
                      placeholder="Tulis pertanyaan..."
                      autoFocus
                      style={{
                        flex: 1,
                        height: 40,
                        padding: "0 12px",
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        color: "#111827",
                        border: "1px solid var(--purple)",
                        borderRadius: 6,
                        outline: "none",
                        boxShadow: "var(--shadow-focus)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addCustomPrompt(group.id)}
                      disabled={!customPrompt.trim() || totalSelected >= MAX_PROMPTS}
                      style={{
                        height: 40,
                        padding: "0 14px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: customPrompt.trim() && totalSelected < MAX_PROMPTS ? "var(--purple)" : "#D1D5DB",
                        color: "#fff",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: customPrompt.trim() && totalSelected < MAX_PROMPTS ? "pointer" : "not-allowed",
                      }}
                    >
                      Tambah
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingTo(group.id); setCustomPrompt(""); }}
                    disabled={totalSelected >= MAX_PROMPTS}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      width: "100%",
                      padding: "12px 16px",
                      marginTop: 8,
                      borderRadius: 6,
                      border: "1.5px dashed var(--border-strong)",
                      background: "none",
                      cursor: totalSelected >= MAX_PROMPTS ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--text-muted)",
                      opacity: totalSelected >= MAX_PROMPTS ? 0.5 : 1,
                      transition: "border-color 0.15s ease, color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (totalSelected < MAX_PROMPTS) {
                        e.currentTarget.style.borderColor = "var(--purple)";
                        e.currentTarget.style.color = "var(--purple)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-strong)";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    <IconPlus size={14} stroke={2} />
                    Tambah pertanyaan
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
      }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            height: 48,
            borderRadius: 8,
            border: "1px solid var(--border-default)",
            background: "#ffffff",
            color: "#111827",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={totalSelected === 0 || loading}
          style={{
            height: 48,
            borderRadius: 8,
            border: "none",
            backgroundColor: totalSelected > 0 && !loading ? "var(--purple)" : "#D1D5DB",
            color: "#ffffff",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 500,
            cursor: totalSelected > 0 && !loading ? "pointer" : "not-allowed",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (totalSelected > 0 && !loading) e.currentTarget.style.backgroundColor = "var(--purple-dark)";
          }}
          onMouseLeave={(e) => {
            if (totalSelected > 0 && !loading) e.currentTarget.style.backgroundColor = "var(--purple)";
          }}
        >
          {loading ? "Memproses..." : "Jalankan audit"}
        </button>
      </div>
    </WizardLayout>
  );
}
