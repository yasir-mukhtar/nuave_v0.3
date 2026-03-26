"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconChevronUp, IconChevronDown, IconPlus } from "@tabler/icons-react";
import WizardLayout from "@/components/new-project/WizardLayout";
import { ButtonSpinner } from "@/components/ButtonSpinner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    const cacheKey = `nuave_cached_prompts_${project.projectId || "default"}`;

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
            brand_id: project.projectId,
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
    const cacheKey = `nuave_cached_prompts_${project.projectId || "default"}`;
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
          brand_id: project.projectId,
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
      <h1 className="font-heading text-[24px] leading-[32px] font-semibold text-text-heading mb-2 tracking-[-0.02em]">
        Tentukan Pertanyaan
      </h1>
      <p className="font-body text-[15px] leading-[24px] text-text-muted mb-9">
        Kami akan mengajukan pertanyaan ini ke AI untuk melihat apakah brand Anda direkomendasikan.
      </p>

      {/* Label + counter */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-body text-[13px] leading-[18px] text-text-muted">
          Topik
        </span>
        <span className="font-body text-[13px] leading-[18px] text-text-muted">
          {totalSelected} dari {totalPrompts} prompt dipilih · {totalSelected} kredit
        </span>
      </div>

      {/* Loading state */}
      {loadingPrompts && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-[3px] border-border-default border-t-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="font-body text-[13px] leading-[18px] text-text-muted">
            Membuat pertanyaan audit...
          </p>
          {/* NOTE: Embedded @keyframes spin — consider moving to global CSS */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Topic accordions */}
      <div className={cn("flex flex-col gap-3 mb-9", loadingPrompts && "hidden")}>
        {topicGroups.map((group) => (
            <div
              key={group.id}
              className="relative"
            >
              {/* Prompts container (behind, wider) */}
              {group.expanded && (
                <div className="absolute top-6 left-0 right-0 bottom-0 border border-border-default rounded-[10px] pointer-events-none" />
              )}

              {/* Topic header card (on top) */}
              <button
                type="button"
                onClick={() => toggleExpand(group.id)}
                className="relative z-[1] flex items-center justify-between w-full py-3.5 px-4 bg-white border border-border-default rounded-md cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-body text-[14px] leading-[20px] font-medium text-text-heading">
                    {group.name}
                  </span>
                  <span className="font-body text-[13px] leading-[18px] text-text-muted">
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
                <div className="relative z-0 px-3 pb-4 pt-3">
                  {/* Prompts label */}
                  <p className="font-body text-[12px] leading-[16px] text-text-muted mb-3">
                    Prompts
                  </p>

                  {/* Prompt list */}
                  <div className="flex flex-col gap-2">
                    {group.prompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        onClick={() => togglePrompt(group.id, prompt.id)}
                        className="flex items-start gap-2.5 w-full py-2.5 px-0 bg-transparent border-none cursor-pointer text-left"
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 mt-px transition-colors duration-100 ease-in-out",
                            prompt.checked
                              ? "bg-brand border-none"
                              : "bg-white border-[1.5px] border-border-strong"
                          )}
                        >
                          {prompt.checked && (
                            <svg width="10" height="8" viewBox="0 0 12 9" fill="none">
                              <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-body text-[14px] leading-[21px] text-text-heading block">
                            {prompt.text}
                          </span>
                          {(() => {
                            const tier = prompt.demand_tier || "medium";
                            const tierStyle = TIER_STYLES[tier];
                            if (!tierStyle) return null;
                            const isLow = tier === "low";
                            return (
                              <span
                                className={cn(
                                  "inline-block mt-1 font-body text-[11px] leading-[16px]",
                                  isLow ? "p-0 rounded-none bg-transparent font-normal" : "px-2 py-0.5 rounded-sm font-semibold"
                                )}
                                style={{
                                  backgroundColor: isLow ? undefined : tierStyle.bg,
                                  color: tierStyle.color,
                                }}
                              >
                                {tierStyle.label}
                              </span>
                            );
                          })()}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Add custom prompt */}
                  {addingTo === group.id ? (
                    <div className="flex gap-2 mt-2">
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
                        className="flex-1 h-10 px-3 font-body text-[14px] leading-[20px] text-text-heading border border-brand rounded-sm outline-none shadow-app-focus"
                      />
                      <button
                        type="button"
                        onClick={() => addCustomPrompt(group.id)}
                        disabled={!customPrompt.trim()}
                        className={cn(
                          "h-10 px-3.5 rounded-[var(--btn-radius)] border-none type-caption font-[var(--btn-font-weight)] text-white",
                          customPrompt.trim()
                            ? "bg-[var(--btn-brand-bg)] cursor-pointer hover:bg-[var(--btn-brand-bg-hover)]"
                            : "bg-border-strong cursor-not-allowed"
                        )}
                      >
                        Tambah
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAddingTo(group.id); setCustomPrompt(""); }}
                      className="flex items-center justify-center gap-1.5 w-full py-3 px-4 mt-2 rounded-sm border-[1.5px] border-dashed border-border-strong bg-transparent cursor-pointer font-body text-[13px] leading-[18px] text-text-muted transition-colors duration-100 ease-in-out hover:border-brand hover:text-brand"
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
        <p className="font-body text-[13px] leading-[18px] text-warning mb-3">
          Pilih minimal 1 prompt untuk menjalankan audit
        </p>
      )}
      {insufficientCredits && (
        <p className="font-body text-[13px] leading-[18px] text-error mb-3">
          Kredit tidak cukup. Anda butuh {totalSelected} kredit.{" "}
          <a href="/dashboard/credits" className="text-brand underline">
            Tambah kredit
          </a>
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="font-body text-[13px] leading-[18px] text-error mb-3">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="default" size="lg" className="w-full" onClick={() => router.back()}>
          Kembali
        </Button>
        <Button variant="brand" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
          {loading && <ButtonSpinner size={16} />}
          {loading ? "Memproses..." : `Jalankan Audit — ${totalSelected} kredit`}
        </Button>
      </div>
    </WizardLayout>
  );
}
