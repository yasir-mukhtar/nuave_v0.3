"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconPencil, IconArrowLeft, IconRefresh, IconArrowRight, IconCheck, IconX } from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Prompt {
  id: string;
  prompt_text: string;
  stage: string;
  language: string;
  workspace_id?: string;
}

function ProgressBar({ active }: { active: number }) {
  return (
    <div className="flex gap-1 max-w-[200px] w-full">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "h-[3px] flex-1 rounded-full",
            i < active ? "bg-brand" : "bg-border-default"
          )}
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLTextAreaElement>(null);

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

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(prompts[index].prompt_text);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) return;

    const updated = prompts.map((p, i) =>
      i === editingIndex ? { ...p, prompt_text: trimmed } : p
    );
    setPrompts(updated);

    const stored = sessionStorage.getItem("nuave_prompts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.prompts = updated;
        sessionStorage.setItem("nuave_prompts", JSON.stringify(parsed));
      } catch {}
    }

    setEditingIndex(null);
  };

  const cancelEdit = () => setEditingIndex(null);

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
          sessionStorage.setItem("nuave_pending_audit_id", data.audit_id);
        }
      }).catch(err => {
        console.error("Audit error:", err);
      });

      router.push("/audit/temp/running");

    } catch (err: any) {
      console.error("Audit error:", err);
      setError(err.message || "Terjadi kesalahan saat menjalankan audit.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <p className="type-body text-text-muted">Memuat prompt...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .prompt-row { transition: border-color var(--transition-fast), background var(--transition-fast); }
        .prompt-row:hover { border-color: var(--purple) !important; background: #FAFBFF !important; }
        .prompt-row:hover .pencil-btn { color: var(--purple); }
        .pencil-btn { color: var(--text-placeholder); transition: color var(--transition-fast); }
        .back-btn:hover, .regen-btn:hover { color: var(--text-heading); }
      `}</style>

      <div className="min-h-screen bg-page px-8 pt-10 pb-20">
        <div className="max-w-[680px] mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              className="back-btn flex items-center gap-1 type-body text-text-muted bg-transparent border-none cursor-pointer p-0 transition-colors"
              onClick={() => router.back()}
            >
              <IconArrowLeft size={18} stroke={1.5} /> Kembali
            </button>

            <ProgressBar active={4} />

            <button
              className="regen-btn flex items-center gap-1 type-body text-text-muted bg-transparent border-none cursor-pointer p-0 transition-colors"
            >
              <IconRefresh size={18} stroke={1.5} /> Regenerasi
            </button>
          </div>

          {/* Section header */}
          <div className="mb-6">
            <h1 className="text-[length:var(--text-2xl)] m-0">Saran prompt</h1>
            <p className="type-body text-text-muted mt-1 mb-0">
              Kami akan menanyakan ini ke ChatGPT untuk mengukur visibilitas brand kamu.
            </p>
          </div>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[var(--radius-md)] px-4 py-3 mb-6 text-[#991B1B] type-sm">
              {error}
            </div>
          )}

          {/* Prompt list */}
          <div className="flex flex-col gap-2">
            {prompts.map((prompt, index) => (
              <div
                key={prompt.id || index}
                className={cn(
                  "prompt-row bg-white rounded-[var(--radius-md)] px-[18px] py-3.5 flex gap-3 border",
                  editingIndex === index
                    ? "items-end border-brand"
                    : "items-center border-border-default"
                )}
              >
                {editingIndex === index ? (
                  <>
                    <textarea
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                        if (e.key === "Escape") cancelEdit();
                      }}
                      rows={2}
                      className="flex-1 type-sm text-text-body leading-snug border-none bg-transparent outline-none resize-none font-[inherit] p-0"
                    />
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={cancelEdit}
                        className="bg-surface border border-border-default rounded-[var(--radius-xs)] cursor-pointer p-1 flex items-center text-text-muted hover:text-text-body transition-colors"
                      >
                        <IconX size={16} stroke={2} />
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={!editValue.trim()}
                        className={cn(
                          "bg-brand border-none rounded-[var(--radius-xs)] p-1 flex items-center text-white",
                          editValue.trim() ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40"
                        )}
                      >
                        <IconCheck size={16} stroke={2} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="type-sm text-text-body leading-snug flex-1">
                      {prompt.prompt_text}
                    </span>
                    <button
                      className="pencil-btn bg-transparent border-none cursor-pointer p-1 shrink-0 flex items-center"
                      onClick={() => startEditing(index)}
                    >
                      <IconPencil size={18} stroke={1.5} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-default px-8 py-4 flex justify-end items-center z-[100]">
        <Button variant="brand" onClick={handleRunAudit}>
          Lihat hasil <IconArrowRight size={18} stroke={1.5} />
        </Button>
      </div>
    </>
  );
}
