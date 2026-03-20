"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import WizardLayout from "@/components/new-project/WizardLayout";

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
      <h1 style={{
        fontFamily: "var(--font-heading)",
        fontSize: 24,
        fontWeight: 600,
        color: "#111827",
        marginBottom: 8,
        letterSpacing: "-0.02em",
      }}>
        Tentukan Topik Audit
      </h1>
      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: 15,
        color: "var(--text-muted)",
        marginBottom: 36,
        lineHeight: 1.6,
      }}>
        Pilih topik yang ingin Anda kuasai di hasil AI. Kami akan menguji apakah brand Anda muncul di sana.
      </p>

      {/* Topic label + counter */}
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
          {selectedCount}/{topics.length}
        </span>
      </div>

      {/* Loading state */}
      {loadingTopics && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{
            width: 32, height: 32,
            border: "3px solid #E5E7EB", borderTop: "3px solid var(--purple)",
            borderRadius: "50%", animation: "spin 1s linear infinite",
            margin: "0 auto 12px",
          }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>
            Menganalisis topik yang relevan...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Topic list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8, ...(loadingTopics ? { display: "none" } : {}) }}>
        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => toggleTopic(topic.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "14px 16px",
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "#ffffff",
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.15s ease",
            }}
          >
            <Checkbox
              checked={topic.checked}
              className="h-[18px] w-[18px] rounded"
            />

            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "#111827",
            }}>
              {topic.name}
            </span>
          </button>
        ))}
      </div>

      {/* Add custom topic */}
      {addingCustom ? (
        <div style={{
          display: "flex",
          gap: 8,
          padding: "8px 0",
        }}>
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
            onClick={addCustomTopic}
            disabled={!customName.trim()}
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 6,
              border: "none",
              backgroundColor: customName.trim() ? "var(--purple)" : "#D1D5DB",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              cursor: customName.trim() ? "pointer" : "not-allowed",
            }}
          >
            Tambah
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCustom(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "14px 16px",
            borderRadius: 8,
            border: "1.5px dashed var(--border-strong)",
            background: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: 14,
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
          <IconPlus size={16} stroke={2} />
          Tambah topik
        </button>
      )}

      {/* Action buttons */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginTop: 36,
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
          disabled={selectedCount === 0}
          style={{
            height: 48,
            borderRadius: 8,
            border: "none",
            backgroundColor: selectedCount > 0 ? "var(--purple)" : "#D1D5DB",
            color: "#ffffff",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            fontWeight: 500,
            cursor: selectedCount > 0 ? "pointer" : "not-allowed",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (selectedCount > 0) e.currentTarget.style.backgroundColor = "var(--purple-dark)";
          }}
          onMouseLeave={(e) => {
            if (selectedCount > 0) e.currentTarget.style.backgroundColor = "var(--purple)";
          }}
        >
          Lanjutkan
        </button>
      </div>
    </WizardLayout>
  );
}
