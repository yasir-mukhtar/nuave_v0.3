"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconPencil, IconCheck, IconX } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import WizardLayout from "@/components/new-project/WizardLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editRowRef = useRef<HTMLDivElement>(null);

  // Click outside editing row → save
  useEffect(() => {
    if (!editingId) return;
    function handleClickOutside(e: MouseEvent) {
      if (editRowRef.current && !editRowRef.current.contains(e.target as Node)) {
        // Save if there's valid text, otherwise revert
        const trimmed = editingName.trim();
        if (trimmed) {
          setTopics((prev) =>
            prev.map((t) => (t.id === editingId ? { ...t, name: trimmed } : t))
          );
        }
        setEditingId(null);
        setEditingName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingId, editingName]);

  // Load project data and fetch AI-generated topics (sessionStorage cache → DB cache → AI)
  useEffect(() => {
    const raw = sessionStorage.getItem("nuave_new_project");
    if (!raw) {
      router.replace("/new-project");
      return;
    }

    const project = JSON.parse(raw);
    const cacheKey = `nuave_cached_topics_${project.projectId || "default"}`;

    // Check sessionStorage cache first — validate that names are strings (guard against stale object-shaped cache)
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedTopics: Topic[] = JSON.parse(cached);
        const valid = cachedTopics.length > 0 && cachedTopics.every((t) => typeof t.name === "string");
        if (valid) {
          setTopics(cachedTopics);
          setLoadingTopics(false);
          return;
        }
        // Stale/malformed cache — delete it and fall through to API
        sessionStorage.removeItem(cacheKey);
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
            brand_id: project.projectId,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.topics)) {
          // v3: topics are {id, name, display_order} objects (not plain strings)
          const topicsList: Topic[] = data.topics.map(
            (t: { id: string | null; name: string; display_order: number }, i: number) => ({
              id: t.id ?? `topic-${i}`,
              name: t.name,
              checked: true,
            })
          );
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

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditingName(topic.name);
  };

  const saveEdit = () => {
    const name = editingName.trim();
    if (!name || !editingId) return;
    setTopics((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, name } : t))
    );
    setEditingId(null);
    setEditingName("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
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
    const cacheKey = `nuave_cached_topics_${project.projectId || "default"}`;
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
            ref={editingId === topic.id ? editRowRef : undefined}
            className="group/topic flex items-center gap-3 w-full py-3.5 px-4 rounded-md border border-border-default bg-white text-left transition-colors duration-100 ease-in-out hover:border-border-strong"
          >
            {editingId === topic.id ? (
              <>
                <Checkbox
                  checked={topic.checked}
                  className="h-[18px] w-[18px] rounded shrink-0"
                />
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  className="flex-1 font-body text-[14px] leading-[20px] text-text-heading bg-transparent border-none outline-none p-0"
                />
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={!editingName.trim()}
                  className="bg-transparent border-none cursor-pointer p-0.5 text-success shrink-0"
                >
                  <IconCheck size={16} stroke={2} />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-transparent border-none cursor-pointer p-0.5 text-text-muted shrink-0"
                >
                  <IconX size={16} stroke={2} />
                </button>
              </>
            ) : (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleTopic(topic.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTopic(topic.id); } }}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <Checkbox
                    checked={topic.checked}
                    className="h-[18px] w-[18px] rounded shrink-0"
                  />
                  <span className="font-body text-[14px] leading-[20px] text-text-heading">
                    {topic.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEdit(topic); }}
                  className="bg-transparent border-none cursor-pointer p-0.5 text-text-muted opacity-0 group-hover/topic:opacity-100 hover:text-foreground transition-all shrink-0"
                >
                  <IconPencil size={15} stroke={1.5} />
                </button>
              </>
            )}
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
              "h-10 px-3.5 rounded-[var(--btn-radius)] border-none type-caption font-[var(--btn-font-weight)] text-white",
              customName.trim()
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
          onClick={() => setAddingCustom(true)}
          className="flex items-center justify-center gap-1.5 w-full py-3.5 px-4 rounded-md border-[1.5px] border-dashed border-border-strong bg-transparent cursor-pointer font-body text-[14px] leading-[20px] text-text-muted transition-colors duration-100 ease-in-out hover:border-brand hover:text-brand"
        >
          <IconPlus size={16} stroke={2} />
          Tambah topik
        </button>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mt-9">
        <Button variant="default" size="lg" className="w-full" onClick={() => router.back()}>
          Kembali
        </Button>
        <Button variant="brand" size="lg" className="w-full" disabled={selectedCount === 0} onClick={handleSubmit}>
          Lanjutkan
        </Button>
      </div>
    </WizardLayout>
  );
}
