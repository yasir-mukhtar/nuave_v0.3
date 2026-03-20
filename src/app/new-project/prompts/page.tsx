"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconChevronUp, IconChevronDown, IconPlus } from "@tabler/icons-react";
import WizardLayout from "@/components/new-project/WizardLayout";
import { ButtonSpinner } from "@/components/ButtonSpinner";

const REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_SELECTION = 10;
const MIN_PER_TOPIC = 2;

interface Prompt {
  id: string;
  text: string;
  checked: boolean;
  core_keyword?: string;
  demand_tier?: string;
}

interface TopicGroup {
  id: string;
  name: string;
  prompts: Prompt[];
  expanded: boolean;
}

const TIER_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: "#EDE9FE", color: "#7C3AED", label: "Volume tinggi" },
  medium: { bg: "#FEF3C7", color: "#D97706", label: "Volume sedang" },
  low: { bg: "#F3F4F6", color: "#374151", label: "Volume rendah" },
};

const TIER_PRIORITY: Record<string, number> = { high: 3, medium: 2, low: 1 };

/** Auto-select top N prompts by demand tier, ensuring ≥MIN_PER_TOPIC per topic */
function autoSelectPrompts(groups: TopicGroup[], maxSelect: number): TopicGroup[] {
  // Flatten all prompts with their group index
  const all: { groupIdx: number; promptIdx: number; tier: number; order: number }[] = [];
  groups.forEach((g, gi) => {
    g.prompts.forEach((p, pi) => {
      all.push({
        groupIdx: gi,
        promptIdx: pi,
        tier: TIER_PRIORITY[p.demand_tier || "medium"] || 2,
        order: pi,
      });
    });
  });

  const totalPrompts = all.length;
  const selectCount = Math.min(maxSelect, totalPrompts);

  // Sort by tier descending, then by order ascending
  all.sort((a, b) => {
    if (b.tier !== a.tier) return b.tier - a.tier;
    return a.order - b.order;
  });

  // Select top N
  const selected = new Set<string>();
  for (let i = 0; i < selectCount; i++) {
    selected.add(`${all[i].groupIdx}-${all[i].promptIdx}`);
  }

  // Topic balance: ensure ≥MIN_PER_TOPIC per topic
  const topicCounts: Record<number, number> = {};
  groups.forEach((_, gi) => { topicCounts[gi] = 0; });
  selected.forEach((key) => {
    const gi = parseInt(key.split("-")[0]);
    topicCounts[gi] = (topicCounts[gi] || 0) + 1;
  });

  // Find underrepresented topics
  for (const gi of Object.keys(topicCounts).map(Number)) {
    while (topicCounts[gi] < MIN_PER_TOPIC) {
      // Find highest-tier unselected prompt from this topic
      const candidates = all.filter(
        (a) => a.groupIdx === gi && !selected.has(`${a.groupIdx}-${a.promptIdx}`)
      );
      if (candidates.length === 0) break;
      candidates.sort((a, b) => b.tier - a.tier || a.order - b.order);
      const toAdd = candidates[0];

      // Find the topic with the most selected prompts (that has >MIN_PER_TOPIC)
      let maxTopic = -1;
      let maxCount = 0;
      for (const [tgi, count] of Object.entries(topicCounts)) {
        const tgiNum = parseInt(tgi);
        if (tgiNum !== gi && count > MIN_PER_TOPIC && count > maxCount) {
          maxTopic = tgiNum;
          maxCount = count;
        }
      }
      if (maxTopic === -1) break; // Can't swap

      // Find lowest-tier selected prompt from that topic to swap out
      const swapCandidates = all.filter(
        (a) => a.groupIdx === maxTopic && selected.has(`${a.groupIdx}-${a.promptIdx}`)
      );
      swapCandidates.sort((a, b) => a.tier - b.tier || b.order - a.order);
      const toRemove = swapCandidates[0];

      selected.delete(`${toRemove.groupIdx}-${toRemove.promptIdx}`);
      selected.add(`${toAdd.groupIdx}-${toAdd.promptIdx}`);
      topicCounts[gi]++;
      topicCounts[maxTopic]--;
    }
  }

  // Apply selection to groups
  return groups.map((g, gi) => ({
    ...g,
    prompts: g.prompts.map((p, pi) => ({
      ...p,
      checked: selected.has(`${gi}-${pi}`),
    })),
  }));
}

export default function PromptsPage() {
  const router = useRouter();
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState<number | null>(null);

  // Fetch user credits
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/credits");
        const data = await res.json();
        if (typeof data.credits === "number") setCredits(data.credits);
      } catch {
        // Credits unknown — don't block
      }
    })();
  }, []);

  // Load topics from session and fetch AI-generated prompts (sessionStorage cache → DB cache → AI)
  useEffect(() => {
    const topicsData = sessionStorage.getItem("nuave_new_project_topics");
    const projectData = sessionStorage.getItem("nuave_new_project");
    if (!topicsData || !projectData) {
      router.replace("/new-project");
      return;
    }
    const topics: { id: string; name: string }[] = JSON.parse(topicsData);
    const project = JSON.parse(projectData);
    const cacheKey = `nuave_cached_prompts_${project.workspaceId || "default"}`;

    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedGroups: TopicGroup[] = JSON.parse(cached);
        if (cachedGroups.length > 0 && cachedGroups.some((g) => g.prompts.length > 0)) {
          setTopicGroups(cachedGroups);
          setLoadingPrompts(false);
          return;
        }
      } catch { /* fall through to API */ }
    }

    (async () => {
      try {
        const res = await fetch("/api/generate-topic-prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand_name: project.brandName,
            topics: topics.map((t) => t.name),
            language: project.language || "id",
            workspace_id: project.workspaceId,
          }),
        });
        const data = await res.json();

        if (data.success && data.prompts) {
          let groups: TopicGroup[] = topics.map((t, i) => {
            const topicPrompts = data.prompts[t.name] || [];
            return {
              id: t.id,
              name: t.name,
              prompts: topicPrompts.map((item: string | { text: string; core_keyword?: string; demand_tier?: string }, j: number) => {
                if (typeof item === "string") {
                  return { id: `${i}-${j}`, text: item, checked: true };
                }
                return {
                  id: `${i}-${j}`,
                  text: item.text,
                  checked: true,
                  core_keyword: item.core_keyword,
                  demand_tier: item.demand_tier || "medium",
                };
              }),
              expanded: i === 0,
            };
          });
          // Auto-select top 10 by volume tier
          groups = autoSelectPrompts(groups, DEFAULT_SELECTION);
          setTopicGroups(groups);
          // Save to sessionStorage cache
          sessionStorage.setItem(cacheKey, JSON.stringify(groups));
        } else {
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

  // Persist prompt state to sessionStorage cache whenever it changes
  useEffect(() => {
    if (topicGroups.length === 0 || topicGroups.every((g) => g.prompts.length === 0)) return;
    const projectData = sessionStorage.getItem("nuave_new_project");
    if (!projectData) return;
    const project = JSON.parse(projectData);
    const cacheKey = `nuave_cached_prompts_${project.workspaceId || "default"}`;
    sessionStorage.setItem(cacheKey, JSON.stringify(topicGroups));
  }, [topicGroups]);

  const totalPrompts = topicGroups.reduce((sum, g) => sum + g.prompts.length, 0);
  const totalSelected = topicGroups.reduce(
    (sum, g) => sum + g.prompts.filter((p) => p.checked).length,
    0
  );
  const insufficientCredits = credits !== null && credits < totalSelected;

  const toggleExpand = (groupId: string) => {
    setTopicGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, expanded: !g.expanded } : g))
    );
  };

  const togglePrompt = (groupId: string, promptId: string) => {
    setTopicGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const target = g.prompts.find((p) => p.id === promptId);
        if (!target) return g;

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

    setTopicGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          prompts: [
            ...g.prompts,
            { id: `custom-${Date.now()}`, text, checked: true, demand_tier: "medium" },
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
    if (totalSelected === 0 || loading || insufficientCredits) return;
    setLoading(true);
    setError("");

    const selectedPrompts = topicGroups.flatMap((g) =>
      g.prompts
        .filter((p) => p.checked)
        .map((p) => ({
          topicId: g.id,
          topicName: g.name,
          prompt: p.text,
          core_keyword: p.core_keyword,
          demand_tier: p.demand_tier || "medium",
        }))
    );
    sessionStorage.setItem("nuave_new_project_prompts", JSON.stringify(selectedPrompts));

    const projectRaw = sessionStorage.getItem("nuave_new_project");
    if (!projectRaw) { router.replace("/new-project"); return; }
    const project = JSON.parse(projectRaw);

    const prompts = selectedPrompts.map((p, i) => ({
      id: p.topicId + "-" + i,
      prompt_text: p.prompt,
      stage: "awareness",
      language: project.language || "id",
      display_order: i,
      core_keyword: p.core_keyword,
      demand_tier: p.demand_tier,
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Prompts are already saved to DB by /api/generate-topic-prompts — skip redundant generation
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
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const auditData = await auditRes.json();

      if (auditData.success && auditData.audit_id) {
        router.push(`/new-project/running?audit_id=${auditData.audit_id}`);
      } else {
        setError(auditData.error || "Gagal menjalankan audit. Silakan coba lagi.");
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Permintaan melebihi batas waktu. Silakan coba lagi.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
      setLoading(false);
    }
  };

  const canSubmit = totalSelected > 0 && !loading && !insufficientCredits;

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
          color: "var(--text-muted)",
        }}>
          {totalSelected} dari {totalPrompts} prompt dipilih · {totalSelected} kredit
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36, ...(loadingPrompts ? { display: "none" } : {}) }}>
        {topicGroups.map((group) => (
            <div
              key={group.id}
              style={{ position: "relative" }}
            >
              {/* Prompts container (behind, wider) */}
              {group.expanded && (
                <div style={{
                  position: "absolute",
                  top: 24,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  pointerEvents: "none",
                }} />
              )}

              {/* Topic header card (on top) */}
              <button
                type="button"
                onClick={() => toggleExpand(group.id)}
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "14px 16px",
                  background: "#ffffff",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
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

              {/* Expanded content (inside the wider container) */}
              {group.expanded && (
                <div style={{ position: "relative", zIndex: 0, padding: "12px 12px 16px" }}>
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
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 14,
                            color: "#111827",
                            lineHeight: 1.5,
                            display: "block",
                          }}>
                            {prompt.text}
                          </span>
                          {(() => {
                            const tier = prompt.demand_tier || "medium";
                            const style = TIER_STYLES[tier];
                            if (!style) return null;
                            const isLow = tier === "low";
                            return (
                              <span style={{
                                display: "inline-block",
                                marginTop: 4,
                                padding: isLow ? 0 : "2px 8px",
                                borderRadius: isLow ? 0 : 6,
                                backgroundColor: isLow ? "transparent" : style.bg,
                                fontFamily: "var(--font-body)",
                                fontSize: 11,
                                fontWeight: isLow ? 400 : 600,
                                color: style.color,
                                lineHeight: "16px",
                              }}>
                                {style.label}
                              </span>
                            );
                          })()}
                        </div>
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
                        disabled={!customPrompt.trim()}
                        style={{
                          height: 40,
                          padding: "0 14px",
                          borderRadius: 6,
                          border: "none",
                          backgroundColor: customPrompt.trim() ? "var(--purple)" : "#D1D5DB",
                          color: "#fff",
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: customPrompt.trim() ? "pointer" : "not-allowed",
                        }}
                      >
                        Tambah
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAddingTo(group.id); setCustomPrompt(""); }}
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
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: "var(--text-muted)",
                        transition: "border-color 0.15s ease, color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--purple)";
                        e.currentTarget.style.color = "var(--purple)";
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

      {/* Warnings */}
      {totalSelected === 0 && !loadingPrompts && (
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--amber, #F59E0B)",
          marginBottom: 12,
        }}>
          Pilih minimal 1 prompt untuk menjalankan audit
        </p>
      )}
      {insufficientCredits && (
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--red, #EF4444)",
          marginBottom: 12,
        }}>
          Kredit tidak cukup. Anda butuh {totalSelected} kredit.{" "}
          <a href="/dashboard/credits" style={{ color: "var(--purple)", textDecoration: "underline" }}>
            Tambah kredit
          </a>
        </p>
      )}

      {/* Error message */}
      {error && (
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--red, #EF4444)",
          marginBottom: 12,
        }}>
          {error}
        </p>
      )}

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
          disabled={!canSubmit}
          style={{
            height: 48,
            borderRadius: 8,
            border: "none",
            backgroundColor: canSubmit ? "var(--purple)" : "#D1D5DB",
            color: "#ffffff",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 500,
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (canSubmit) e.currentTarget.style.backgroundColor = "var(--purple-dark)";
          }}
          onMouseLeave={(e) => {
            if (canSubmit) e.currentTarget.style.backgroundColor = "var(--purple)";
          }}
        >
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading && <ButtonSpinner size={16} />}
            {loading ? "Memproses..." : `Jalankan Audit — ${totalSelected} kredit`}
          </span>
        </button>
      </div>
    </WizardLayout>
  );
}
