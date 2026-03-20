"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import WizardLayout from "@/components/new-project/WizardLayout";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  name: string;
  checked: boolean;
}

export default function TopicsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Load project data and fetch AI-generated topics (sessionStorage cache → DB cache → AI)
  useEffect(() => {
    const raw = sessionStorage.getItem("nuave_new_project");
    if (!raw) {
      router.replace("/new-project");
      return;
    }

    const project = JSON.parse(raw);
    const cacheKey = `nuave_cached_topics_${project.workspaceId || "default"}`;

    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedTopics: Topic[] = JSON.parse(cached);
        if (cachedTopics.length > 0) {
          setTopics(cachedTopics);
          setLoadingTopics(false);
          return;
        }
      } catch { /* fall through to API */ }
    }

    (async () => {
      try {
        const res = await fetch("/api/generate-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand_name: project.brandName,
            company_overview: project.profile?.company_overview || "",
            industry: project.profile?.industry || "",
            language: project.language || "id",
            workspace_id: project.workspaceId,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.topics)) {
          const topicsList: Topic[] = data.topics.map((name: string, i: number) => ({
            id: `topic-${i}`,
            name,
            checked: true,
          }));
          setTopics(topicsList);
          // Save to sessionStorage cache
          sessionStorage.setItem(cacheKey, JSON.stringify(topicsList));
        }
      } catch {
        // Fallback: empty list, user can add custom topics
      }
      setLoadingTopics(false);
    })();
  }, [router]);

  const selectedCount = topics.filter((t) => t.checked).length;

  const toggleTopic = (id: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  const addCustomTopic = () => {
    const name = customName.trim();
    if (!name) return;
    setTopics((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name, checked: true },
    ]);
    setCustomName("");
    setAddingCustom(false);
  };

  // Persist topic state to sessionStorage cache whenever it changes
  useEffect(() => {
    if (topics.length === 0) return;
    const raw = sessionStorage.getItem("nuave_new_project");
    if (!raw) return;
    const project = JSON.parse(raw);
    const cacheKey = `nuave_cached_topics_${project.workspaceId || "default"}`;
    sessionStorage.setItem(cacheKey, JSON.stringify(topics));
  }, [topics]);

  const handleSubmit = () => {
    const selected = topics.filter((t) => t.checked);
    if (selected.length === 0) return;

    sessionStorage.setItem(
      "nuave_new_project_topics",
      JSON.stringify(selected.map((t) => ({ id: t.id, name: t.name })))
    );
    router.push("/new-project/prompts");
  };

  return (
    <WizardLayout
      currentStep={2}
      totalSteps={3}
      onClose={() => router.push("/dashboard")}
    >
      {/* Heading */}
      <h1 className="font-heading text-[24px] leading-[32px] font-semibold text-text-heading mb-2 tracking-[-0.02em]">
        Tentukan Topik Audit
      </h1>
      <p className="font-body text-[15px] leading-[24px] text-text-muted mb-9">
        Pilih topik yang ingin Anda kuasai di hasil AI. Kami akan menguji apakah brand Anda muncul di sana.
      </p>

      {/* Topic label + counter */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-body text-[13px] leading-[18px] text-text-muted">
          Topik
        </span>
        <span className="font-body text-[13px] leading-[18px] text-text-muted">
          {selectedCount}/{topics.length}
        </span>
      </div>

      {/* Loading state */}
      {loadingTopics && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-[3px] border-border-default border-t-brand rounded-full animate-spin mx-auto mb-3" />
          <p className="font-body text-[13px] leading-[18px] text-text-muted">
            Menganalisis topik yang relevan...
          </p>
          {/* NOTE: Embedded @keyframes spin — consider moving to global CSS */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Topic list */}
      <div className={cn("flex flex-col gap-2 mb-2", loadingTopics && "hidden")}>
        {topics.map((topic) => (
          <div
            key={topic.id}
            role="button"
            tabIndex={0}
            onClick={() => toggleTopic(topic.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTopic(topic.id); } }}
            className="flex items-center gap-3 w-full py-3.5 px-4 rounded-md border border-border-default bg-white cursor-pointer text-left transition-colors duration-100 ease-in-out hover:border-border-strong"
          >
            <Checkbox
              checked={topic.checked}
              className="h-[18px] w-[18px] rounded"
            />

            <span className="font-body text-[14px] leading-[20px] text-text-heading">
              {topic.name}
            </span>
          </div>
        ))}
      </div>

      {/* Add custom topic */}
      {addingCustom ? (
        <div className="flex gap-2 py-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addCustomTopic(); }
              if (e.key === "Escape") { setAddingCustom(false); setCustomName(""); }
            }}
            placeholder="Nama topik..."
            autoFocus
            className="flex-1 h-10 px-3 font-body text-[14px] leading-[20px] text-text-heading border border-brand rounded-sm outline-none shadow-app-focus"
          />
          <button
            type="button"
            onClick={addCustomTopic}
            disabled={!customName.trim()}
            className={cn(
              "h-10 px-3.5 rounded-sm border-none font-body text-[13px] leading-[18px] font-medium text-white",
              customName.trim()
                ? "bg-brand cursor-pointer"
                : "bg-border-strong cursor-not-allowed"
            )}
          >
            Tambah
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCustom(true)}
          className="flex items-center justify-center gap-1.5 w-full py-3.5 px-4 rounded-md border-[1.5px] border-dashed border-border-strong bg-transparent cursor-pointer font-body text-[14px] leading-[20px] text-text-muted transition-colors duration-100 ease-in-out hover:border-brand hover:text-brand"
        >
          <IconPlus size={16} stroke={2} />
          Tambah topik
        </button>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mt-9">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-12 rounded-md border border-border-default bg-white text-text-heading font-body text-[15px] leading-[22px] font-medium cursor-pointer transition-colors duration-100 ease-in-out hover:border-border-strong"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedCount === 0}
          className={cn(
            "h-12 rounded-md border-none font-body text-[15px] leading-[22px] font-medium text-white transition-colors duration-100 ease-in-out",
            selectedCount > 0
              ? "bg-brand cursor-pointer hover:bg-brand-dark"
              : "bg-border-strong cursor-not-allowed"
          )}
        >
          Lanjutkan
        </button>
      </div>
    </WizardLayout>
  );
}
