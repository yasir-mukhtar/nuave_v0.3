"use client";

import { useState, useEffect, useRef } from "react";
import {
  IconPlus,
  IconSearch,
  IconTrash,
  IconArchive,
  IconArrowBackUp,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconPencil,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/new-project/SearchableSelect";
import PromptDetailModal, { type PromptDetail } from "@/components/PromptDetailModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveProject } from "@/hooks/useActiveProject";
import { usePromptPageData, type PromptWithAudit } from "@/hooks/usePromptPageData";
import { COUNTRIES, LANGUAGES } from "@/lib/constants";
import type { Topic } from "@/types";

const PANEL_ANIM_MS = 280;

/* ── Page ── */

export default function PromptsPage() {
  const { activeProjectId, activeProject, loading: projectLoading } = useActiveProject();
  const brandName = activeProject?.name ?? "";
  const {
    topics,
    prompts,
    loading: dataLoading,
    createTopic,
    renameTopic,
    deleteTopic: deleteTopicMutation,
    createPrompt,
    updatePrompt,
    togglePromptActive,
    archivePrompt: archivePromptMutation,
    archiveAllInTopic,
    restorePrompt,
    deletePromptPermanently,
  } = usePromptPageData(activeProjectId);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [search, setSearch] = useState("");
  const [archiveAllOpen, setArchiveAllOpen] = useState(false);
  const [archiveAllClosing, setArchiveAllClosing] = useState(false);
  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [createTopicClosing, setCreateTopicClosing] = useState(false);
  const [createPromptOpen, setCreatePromptOpen] = useState(false);
  const [createPromptClosing, setCreatePromptClosing] = useState(false);
  const [archivePromptId, setArchivePromptId] = useState<string | null>(null);
  const [archivePromptClosing, setArchivePromptClosing] = useState(false);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [permanentDeleteClosing, setPermanentDeleteClosing] = useState(false);
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);
  const [deleteTopicClosing, setDeleteTopicClosing] = useState(false);
  const [selectedPromptDetail, setSelectedPromptDetail] = useState<PromptDetail | null>(null);
  const [editPromptData, setEditPromptData] = useState<PromptWithAudit | null>(null);
  const [editPromptClosing, setEditPromptClosing] = useState(false);

  // Override main's scroll+padding so this page owns its own layout
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const prevOverflow = main.style.overflow;
    const prevPadding = main.style.padding;
    main.style.overflow = "hidden";
    main.style.padding = "0";
    return () => {
      main.style.overflow = prevOverflow;
      main.style.padding = prevPadding;
    };
  }, []);

  const loading = projectLoading || dataLoading;

  // Filter prompts
  const activePrompts = prompts.filter((p) => !p.archived_at);
  const archivedPrompts = prompts.filter((p) => !!p.archived_at);

  const topicPrompts = showArchive
    ? archivedPrompts
    : activePrompts.filter((p) => {
        if (selectedTopicId === null) return p.topic_id === null;
        return p.topic_id === selectedTopicId;
      });

  const filteredPrompts = topicPrompts.filter((p) => {
    if (!search) return true;
    return p.prompt_text.toLowerCase().includes(search.toLowerCase());
  });

  function getTopicCounts(topicId: string | null) {
    const tp = activePrompts.filter((p) => (topicId === null ? p.topic_id === null : p.topic_id === topicId));
    const active = tp.filter((p) => p.is_active).length;
    const total = tp.length;
    return { active, total };
  }

  const selectedTopicName = selectedTopicId === null
    ? "Tanpa Topik"
    : topics.find((t) => t.id === selectedTopicId)?.name ?? "";

  function closeArchiveAll() {
    setArchiveAllClosing(true);
    setTimeout(() => { setArchiveAllOpen(false); setArchiveAllClosing(false); }, PANEL_ANIM_MS);
  }

  function closeCreateTopic() {
    setCreateTopicClosing(true);
    setTimeout(() => { setCreateTopicOpen(false); setCreateTopicClosing(false); }, PANEL_ANIM_MS);
  }

  function closeCreatePrompt() {
    setCreatePromptClosing(true);
    setTimeout(() => { setCreatePromptOpen(false); setCreatePromptClosing(false); }, PANEL_ANIM_MS);
  }

  function closeArchivePrompt() {
    setArchivePromptClosing(true);
    setTimeout(() => { setArchivePromptId(null); setArchivePromptClosing(false); }, PANEL_ANIM_MS);
  }

  function closePermanentDelete() {
    setPermanentDeleteClosing(true);
    setTimeout(() => { setPermanentDeleteId(null); setPermanentDeleteClosing(false); }, PANEL_ANIM_MS);
  }

  function closeDeleteTopic() {
    setDeleteTopicClosing(true);
    setTimeout(() => { setDeleteTopicId(null); setDeleteTopicClosing(false); }, PANEL_ANIM_MS);
  }

  function closeEditPrompt() {
    setEditPromptClosing(true);
    setTimeout(() => { setEditPromptData(null); setEditPromptClosing(false); }, PANEL_ANIM_MS);
  }

  const archivePromptData = prompts.find((p) => p.id === archivePromptId);
  const permanentDeletePrompt = prompts.find((p) => p.id === permanentDeleteId);
  const deleteTopicData = topics.find((t) => t.id === deleteTopicId);
  const deleteTopicPromptCount = deleteTopicId ? prompts.filter((p) => p.topic_id === deleteTopicId).length : 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="type-body text-text-muted">Memuat data prompt...</p>
      </div>
    );
  }

  // No brand selected
  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <p className="type-title">Belum ada brand</p>
        <p className="type-body text-text-muted">Buat brand terlebih dahulu untuk mulai mengelola prompt.</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes modalOut { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.95) translateY(8px); } }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      <div className="flex h-full w-full bg-white overflow-hidden">

        {/* ═══════ LEFT PANEL: Topics ═══════ */}
        <div className="w-[380px] shrink-0 flex flex-col border-r border-border-default h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-8 h-[52px] border-b border-border-default shrink-0">
            <h2 className="type-title m-0 text-text-heading">Topik</h2>
            <Button
              variant="default"
              onClick={() => setCreateTopicOpen(true)}
            >
              <IconPlus size={14} />
              Buat topik
            </Button>
          </div>

          {/* Topic list */}
          <div className="scroll-subtle flex-1 overflow-y-auto pt-3">
            <TopicRow
              name="Tanpa Topik"
              counts={getTopicCounts(null)}
              selected={!showArchive && selectedTopicId === null}
              onClick={() => { setShowArchive(false); setSelectedTopicId(null); setSearch(""); }}
              muted
            />
            {topics.map((t) => (
              <TopicRow
                key={t.id}
                name={t.name}
                counts={getTopicCounts(t.id)}
                selected={!showArchive && selectedTopicId === t.id}
                onClick={() => { setShowArchive(false); setSelectedTopicId(t.id); setSearch(""); }}
                onRename={(newName) => renameTopic(t.id, newName)}
                onDelete={() => setDeleteTopicId(t.id)}
              />
            ))}

            {/* Archive section */}
            {archivedPrompts.length > 0 && (
              <>
                <div className="h-px bg-border-default mx-8 my-2" />
                <div
                  onClick={() => { setShowArchive(true); setSearch(""); }}
                  className={cn(
                    "flex items-center justify-between w-full px-8 py-2.5 rounded-sm cursor-pointer text-left transition-colors duration-100",
                    showArchive
                      ? "bg-surface-raised"
                      : "bg-transparent hover:bg-surface"
                  )}
                >
                  <span className={cn(
                    "type-body flex items-center gap-1.5",
                    showArchive ? "font-semibold text-text-heading" : "text-text-muted"
                  )}>
                    <IconArchive size={14} stroke={1.5} />
                    Arsip
                  </span>
                  <span className={cn(
                    "type-caption shrink-0 ml-2 tabular-nums",
                    showArchive ? "text-text-heading font-semibold" : "text-text-muted"
                  )}>
                    {archivedPrompts.length}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ═══════ RIGHT PANEL: Prompts ═══════ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">

          {/* Header: search left-aligned, button right-aligned */}
          <div className="flex items-center gap-3 px-8 h-[52px] border-b border-border-default shrink-0">
            <div className="relative w-[240px]">
              <IconSearch size={14} stroke={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Cari prompt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[30px] pl-[30px] pr-3 type-body border border-border-default rounded-sm bg-white text-text-body outline-none box-border"
              />
            </div>

            <Button variant="brand" className="ml-auto" onClick={() => setCreatePromptOpen(true)}>
              <IconPlus size={14} stroke={2} />
              Buat prompt
            </Button>
          </div>

          {/* Prompt rows */}
          <div className="flex-1 overflow-y-auto scroll-subtle">
            {filteredPrompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] type-body text-text-muted">
                {search
                  ? "Tidak ada prompt yang cocok."
                  : showArchive
                    ? "Tidak ada prompt yang diarsipkan."
                    : "Belum ada prompt di topik ini."}
              </div>
            ) : (
              filteredPrompts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    if (p.ai_response) {
                      setSelectedPromptDetail({
                        prompt_text: p.prompt_text,
                        ai_response: p.ai_response,
                        brand_mentioned: p.mentioned ?? false,
                      });
                    }
                  }}
                  className={cn(
                    "flex items-center px-8 py-3.5 border-b border-border-default hover:bg-surface transition-colors duration-100 group",
                    p.ai_response ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  {/* Prompt text + edit icon */}
                  <div className="flex items-start gap-2 flex-1 min-w-0 pr-3">
                    <p className={cn(
                      "type-body m-0 flex-1",
                      p.is_active ? "text-text-body" : "text-text-muted"
                    )}>
                      {p.prompt_text}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditPromptData(p); }}
                      className="bg-transparent border-none cursor-pointer text-text-placeholder p-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100 shrink-0"
                    >
                      <IconPencil size={13} stroke={1.5} />
                    </button>
                  </div>

                  {/* Mentioned icon with tooltip */}
                  <div className="w-[48px] flex justify-center shrink-0">
                    {p.mentioned === null ? (
                      <span className="type-body text-text-placeholder">&mdash;</span>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">
                            {p.mentioned
                              ? <IconCircleCheckFilled size={18} className="text-success" />
                              : <IconCircleXFilled size={18} className="text-error" />
                            }
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="type-caption">
                          {p.mentioned
                            ? "Brand disebut di audit terakhir"
                            : "Brand tidak disebut di audit terakhir"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Toggle */}
                  <div className="w-[48px] flex justify-center shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePromptActive(p.id, !p.is_active); }}
                          className={cn(
                            "relative w-[36px] h-[20px] rounded-full border-none cursor-pointer transition-colors duration-200",
                            p.is_active ? "bg-[#111827]" : "bg-border-default"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-[left] duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.12)]",
                              p.is_active ? "left-[18px]" : "left-[2px]"
                            )}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[12px]">
                        {p.is_active
                          ? "Nonaktifkan pengecekan harian"
                          : "Aktifkan pengecekan harian"}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Actions — hover only */}
                  <div className="flex items-center shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                    {showArchive ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => { e.stopPropagation(); restorePrompt(p.id); }}
                              className="bg-transparent border-none cursor-pointer text-text-muted p-0.5 hover:text-success"
                            >
                              <IconArrowBackUp size={15} stroke={1.5} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="type-caption">Pulihkan</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPermanentDeleteId(p.id); }}
                              className="bg-transparent border-none cursor-pointer text-text-muted p-0.5 hover:text-error"
                            >
                              <IconTrash size={15} stroke={1.5} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="type-caption">Hapus permanen</TooltipContent>
                        </Tooltip>
                      </>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setArchivePromptId(p.id); }}
                        className="bg-transparent border-none cursor-pointer text-text-placeholder p-0 hover:text-text-muted"
                      >
                        <IconArchive size={15} stroke={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 h-[44px] border-t border-border-default bg-white shrink-0">
            <span className="type-caption text-text-muted">
              {filteredPrompts.length} ditampilkan
            </span>
            {!showArchive && topicPrompts.length > 0 && (
              <button
                onClick={() => setArchiveAllOpen(true)}
                className="inline-flex items-center gap-1 type-caption font-medium text-text-muted bg-transparent border-none cursor-pointer px-0 hover:text-text-body transition-colors duration-100"
              >
                <IconArchive size={13} stroke={1.5} />
                Arsipkan semua
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Archive All Confirmation ── */}
      {archiveAllOpen && (
        <>
          <div
            onClick={closeArchiveAll}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{ animation: `${archiveAllClosing ? "overlayOut" : "overlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[calc(100vw-48px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6 z-50"
            style={{ animation: `${archiveAllClosing ? "modalOut" : "modalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          >
            <div className="mb-4">
              <h3 className="type-title m-0 mb-1">
                Arsipkan semua prompt di topik ini?
              </h3>
              <p className="type-body text-text-muted m-0">
                <strong className="text-text-body">{topicPrompts.length} prompt</strong> di topik <strong className="text-text-body">&ldquo;{selectedTopicName}&rdquo;</strong> akan diarsipkan. Pengecekan harian akan dihentikan. Anda bisa memulihkan prompt dari arsip kapan saja.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={closeArchiveAll}
                className="px-4 py-2 type-body font-medium bg-surface border border-border-default rounded-sm cursor-pointer text-text-body"
              >
                Batal
              </button>
              <Button
                variant="brand"
                onClick={() => {
                  archiveAllInTopic(selectedTopicId);
                  closeArchiveAll();
                }}
              >
                Arsipkan {topicPrompts.length} prompt
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Create Topic Modal ── */}
      {createTopicOpen && (
        <>
          <div
            onClick={closeCreateTopic}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{ animation: `${createTopicClosing ? "overlayOut" : "overlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[calc(100vw-48px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
            style={{ animation: `${createTopicClosing ? "modalOut" : "modalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-0">
              <div>
                <h3 className="type-title m-0">Buat topik baru</h3>
                <p className="type-body text-text-muted mt-1 mb-0">
                  Buat topik tanpa menyebut nama brand Anda. Setiap topik akan berisi prompt.
                </p>
              </div>
              <button onClick={closeCreateTopic} className="bg-transparent border-none cursor-pointer text-text-muted p-1 shrink-0 ml-4">
                <IconX size={18} stroke={1.5} />
              </button>
            </div>
            <CreateTopicForm
              onSubmit={async (name) => {
                await createTopic(name);
                closeCreateTopic();
              }}
            />
          </div>
        </>
      )}

      {/* ── Create Prompt Modal ── */}
      {createPromptOpen && (
        <>
          <div
            onClick={closeCreatePrompt}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{ animation: `${createPromptClosing ? "overlayOut" : "overlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[calc(100vw-48px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
            style={{ animation: `${createPromptClosing ? "modalOut" : "modalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-0">
              <div>
                <h3 className="type-title m-0">Buat prompt baru</h3>
                <p className="type-body text-text-muted mt-1 mb-0">
                  Buat prompt tanpa menyebut nama brand Anda. Setiap baris akan menjadi prompt terpisah.
                </p>
              </div>
              <button onClick={closeCreatePrompt} className="bg-transparent border-none cursor-pointer text-text-muted p-1 shrink-0 ml-4">
                <IconX size={18} stroke={1.5} />
              </button>
            </div>
            <CreatePromptForm
              topics={topics}
              selectedTopicId={selectedTopicId}
              onSubmit={async (data) => {
                await createPrompt(data);
                closeCreatePrompt();
              }}
            />
          </div>
        </>
      )}

      {/* ── Archive Single Prompt Confirmation ── */}
      {archivePromptId && archivePromptData && (
        <>
          <div
            onClick={closeArchivePrompt}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{ animation: `${archivePromptClosing ? "overlayOut" : "overlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[calc(100vw-48px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6 z-50"
            style={{ animation: `${archivePromptClosing ? "modalOut" : "modalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          >
            <div className="mb-4">
              <h3 className="type-title m-0 mb-1">
                Arsipkan prompt ini?
              </h3>
              <p className="type-body text-text-muted m-0">
                Prompt <strong className="text-text-body">&ldquo;{archivePromptData.prompt_text.length > 80 ? archivePromptData.prompt_text.slice(0, 80) + "..." : archivePromptData.prompt_text}&rdquo;</strong> akan diarsipkan dan pengecekan harian dihentikan. Anda bisa memulihkan dari arsip kapan saja.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={closeArchivePrompt}
                className="px-4 py-2 type-body font-medium bg-surface border border-border-default rounded-sm cursor-pointer text-text-body"
              >
                Batal
              </button>
              <Button
                variant="brand"
                onClick={() => {
                  archivePromptMutation(archivePromptId);
                  closeArchivePrompt();
                }}
              >
                Arsipkan
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Permanent Delete Confirmation (from archive) ── */}
      {permanentDeleteId && permanentDeletePrompt && (
        <>
          <div
            onClick={closePermanentDelete}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{ animation: `${permanentDeleteClosing ? "overlayOut" : "overlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[calc(100vw-48px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6 z-50"
            style={{ animation: `${permanentDeleteClosing ? "modalOut" : "modalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          >
            <div className="mb-4">
              <h3 className="type-title m-0 mb-1">
                ✋ Yakin mau menghapus permanen?
              </h3>
              <p className="type-body text-text-muted m-0">
                Anda akan menghapus permanen prompt <strong className="text-text-body">&ldquo;{permanentDeletePrompt.prompt_text.length > 80 ? permanentDeletePrompt.prompt_text.slice(0, 80) + "..." : permanentDeletePrompt.prompt_text}&rdquo;</strong> beserta data audit terkait. Prompt yang sudah dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={closePermanentDelete}
                className="px-4 py-2 type-body font-medium bg-surface border border-border-default rounded-sm cursor-pointer text-text-body"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deletePromptPermanently(permanentDeleteId);
                  closePermanentDelete();
                }}
                className="flex items-center gap-1.5 px-5 py-2 type-body font-semibold bg-[#DC2626] text-white border-none rounded-sm cursor-pointer"
              >
                Hapus permanen
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Topic Confirmation ── */}
      {deleteTopicId && deleteTopicData && (
        <>
          <div
            onClick={closeDeleteTopic}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{ animation: `${deleteTopicClosing ? "overlayOut" : "overlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[calc(100vw-48px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6 z-50"
            style={{ animation: `${deleteTopicClosing ? "modalOut" : "modalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          >
            <div className="mb-4">
              <h3 className="type-title m-0 mb-1">
                ✋ Yakin mau menghapus topik ini?
              </h3>
              <p className="type-body text-text-muted m-0">
                Anda akan menghapus permanen topik <strong className="text-text-body">&ldquo;{deleteTopicData.name}&rdquo;</strong>{deleteTopicPromptCount > 0 ? <> beserta <strong className="text-text-body">{deleteTopicPromptCount} prompt</strong> di dalamnya</> : null}. Topik dan prompt yang sudah dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={closeDeleteTopic}
                className="px-4 py-2 type-body font-medium bg-surface border border-border-default rounded-sm cursor-pointer text-text-body"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteTopicMutation(deleteTopicId);
                  if (selectedTopicId === deleteTopicId) setSelectedTopicId(null);
                  closeDeleteTopic();
                }}
                className="flex items-center gap-1.5 px-5 py-2 type-body font-semibold bg-[#DC2626] text-white border-none rounded-sm cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Edit Prompt Modal ── */}
      {editPromptData && (
        <>
          <div
            onClick={closeEditPrompt}
            className="fixed inset-0 bg-black/[0.18] z-[49]"
            style={{ animation: `${editPromptClosing ? "overlayOut" : "overlayIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[calc(100vw-48px)] bg-white rounded-lg border border-border-default shadow-[0_16px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
            style={{ animation: `${editPromptClosing ? "modalOut" : "modalIn"} ${PANEL_ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-0">
              <div>
                <h3 className="type-title m-0">Edit prompt</h3>
                {editPromptData.mentioned !== null && (
                  <p className="type-body text-text-muted mt-1 mb-0">
                    Perubahan akan berlaku di pengecekan berikutnya.
                  </p>
                )}
              </div>
              <button onClick={closeEditPrompt} className="bg-transparent border-none cursor-pointer text-text-muted p-1 shrink-0 ml-4">
                <IconX size={18} stroke={1.5} />
              </button>
            </div>
            <EditPromptForm
              prompt={editPromptData}
              topics={topics}
              onSubmit={async (data) => {
                await updatePrompt(editPromptData.id, data);
                closeEditPrompt();
              }}
            />
          </div>
        </>
      )}

      {/* ── Prompt Detail Side Panel ── */}
      {selectedPromptDetail && (
        <PromptDetailModal
          result={selectedPromptDetail}
          brandName={brandName}
          onClose={() => setSelectedPromptDetail(null)}
        />
      )}
    </TooltipProvider>
  );
}

/* ── Create Prompt Form ── */

function EditPromptForm({
  prompt,
  topics,
  onSubmit,
}: {
  prompt: PromptWithAudit;
  topics: Topic[];
  onSubmit: (data: { prompt_text?: string; topic_id?: string | null; language?: string }) => Promise<void>;
}) {
  const [promptText, setPromptText] = useState(prompt.prompt_text);
  const [topicId, setTopicId] = useState(prompt.topic_id ?? "");
  const [country, setCountry] = useState("ID");
  const [submitting, setSubmitting] = useState(false);
  const maxLength = 200;

  const topicOptions = [
    { value: "", label: "Tanpa Topik" },
    ...topics.map((t) => ({ value: t.id, label: t.name })),
  ];

  async function handleSubmit() {
    if (!promptText.trim() || submitting) return;
    setSubmitting(true);

    const changes: Record<string, unknown> = {};
    if (promptText.trim() !== prompt.prompt_text) changes.prompt_text = promptText.trim();
    const newTopicId = topicId || null;
    if (newTopicId !== prompt.topic_id) changes.topic_id = newTopicId;

    if (Object.keys(changes).length > 0) {
      await onSubmit(changes as { prompt_text?: string; topic_id?: string | null; language?: string });
    } else {
      await onSubmit({});
    }
    setSubmitting(false);
  }

  return (
    <>
      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="form-field">
          <div className="flex items-center justify-between">
            <label>Prompt</label>
            <span className="type-caption text-text-muted">
              {promptText.length}/{maxLength}
            </span>
          </div>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value.slice(0, maxLength))}
            rows={3}
          />
        </div>

        <div className="form-field">
          <label>Topik</label>
          <SearchableSelect
            options={topicOptions}
            value={topicId}
            onChange={setTopicId}
            placeholder="Pilih topik"
            searchPlaceholder="Cari topik..."
          />
        </div>

        <div className="form-field">
          <label>Target Pasar</label>
          <SearchableSelect
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }))}
            value={country}
            onChange={setCountry}
            placeholder="Pilih negara"
            searchPlaceholder="Cari negara..."
          />
        </div>
      </div>

      <div className="px-6 pb-5 flex justify-end">
        <Button variant="brand" onClick={handleSubmit} disabled={!promptText.trim() || submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </>
  );
}

function CreatePromptForm({
  topics,
  selectedTopicId,
  onSubmit,
}: {
  topics: Topic[];
  selectedTopicId: string | null;
  onSubmit: (data: { prompt_text: string; topic_id: string | null; language: string }) => Promise<void>;
}) {
  const [promptText, setPromptText] = useState("");
  const [topicId, setTopicId] = useState(selectedTopicId ?? "");
  const [country, setCountry] = useState("ID");
  const [submitting, setSubmitting] = useState(false);
  const maxLength = 200;

  const topicOptions = [
    { value: "", label: "Tanpa Topik" },
    ...topics.map((t) => ({ value: t.id, label: t.name })),
  ];

  async function handleSubmit() {
    if (!promptText.trim() || submitting) return;
    setSubmitting(true);

    const lines = promptText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (const line of lines) {
      await onSubmit({
        prompt_text: line,
        topic_id: topicId || null,
        language: "id",
      });
    }

    setSubmitting(false);
  }

  return (
    <>
      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="form-field">
          <div className="flex items-center justify-between">
            <label>Prompt</label>
            <span className="type-caption text-text-muted">
              {promptText.length}/{maxLength}
            </span>
          </div>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value.slice(0, maxLength))}
            placeholder="What is the best insurance?"
            rows={3}
          />
        </div>

        <div className="form-field">
          <label>Topik</label>
          <SearchableSelect
            options={topicOptions}
            value={topicId}
            onChange={setTopicId}
            placeholder="Pilih topik"
            searchPlaceholder="Cari topik..."
          />
        </div>

        <div className="form-field">
          <label>Target Pasar</label>
          <SearchableSelect
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }))}
            value={country}
            onChange={setCountry}
            placeholder="Pilih negara"
            searchPlaceholder="Cari negara..."
          />
        </div>
      </div>

      <div className="px-6 pb-5 flex justify-end">
        <Button variant="brand" onClick={handleSubmit} disabled={!promptText.trim() || submitting}>
          {submitting ? "Menyimpan..." : "Tambah"}
        </Button>
      </div>
    </>
  );
}

/* ── Create Topic Form ── */

function CreateTopicForm({ onSubmit }: { onSubmit: (name: string) => Promise<void> }) {
  const [topicName, setTopicName] = useState("");
  const [country, setCountry] = useState("ID");
  const [language, setLanguage] = useState("id");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!topicName.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(topicName.trim());
    setSubmitting(false);
  }

  return (
    <>
      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="form-field">
          <label>Topik</label>
          <input
            type="text"
            placeholder="Contoh: SEO Optimization"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-field">
            <label>Target Pasar</label>
            <SearchableSelect
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }))}
              value={country}
              onChange={setCountry}
              placeholder="Pilih negara"
              searchPlaceholder="Cari negara..."
            />
          </div>
          <div className="form-field">
            <label>Bahasa</label>
            <SearchableSelect
              options={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
              value={language}
              onChange={setLanguage}
              placeholder="Pilih bahasa"
              searchPlaceholder="Cari bahasa..."
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-5 flex justify-end">
        <Button variant="brand" onClick={handleSubmit} disabled={!topicName.trim() || submitting}>
          {submitting ? "Menyimpan..." : "Tambah"}
        </Button>
      </div>
    </>
  );
}

/* ── Topic Row ── */

function TopicRow({
  name,
  counts,
  selected,
  onClick,
  muted,
  onRename,
  onDelete,
}: {
  name: string;
  counts: { active: number; total: number };
  selected: boolean;
  onClick: () => void;
  muted?: boolean;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename?.(trimmed);
    } else {
      setEditValue(name);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="px-8 py-1.5">
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") { setEditValue(name); setEditing(false); }
          }}
          className="w-full px-2.5 py-1.5 type-body border border-brand rounded-xs bg-white text-text-heading outline-none"
        />
        <div className="flex items-center gap-1 mt-1.5 justify-end">
          <button
            onClick={() => { setEditValue(name); setEditing(false); }}
            className="inline-flex items-center gap-1 px-2 py-1 type-caption font-medium text-text-muted bg-transparent border border-border-default rounded-xs cursor-pointer"
          >
            <IconX size={12} stroke={2} />
            Batal
          </button>
          <button
            onClick={commitEdit}
            className="inline-flex items-center gap-1 px-2 py-1 type-caption font-medium text-white bg-brand border-none rounded-xs cursor-pointer"
          >
            <IconCheck size={12} stroke={2} />
            Simpan
          </button>
        </div>
      </div>
    );
  }

  const editable = !!onRename;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start w-full px-8 py-2.5 rounded-sm cursor-pointer text-left transition-colors duration-100 group",
        selected
          ? "bg-surface-raised"
          : "bg-transparent hover:bg-surface"
      )}
    >
      <span className={cn(
        "type-body flex-1 min-w-0 line-clamp-2",
        selected ? "font-semibold text-text-heading" : muted ? "text-text-muted" : "text-text-body"
      )}>
        {name}
      </span>

      {editable && (
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100 ml-2 mt-px">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="bg-transparent border-none cursor-pointer text-text-muted p-0.5 hover:text-text-heading"
          >
            <IconPencil size={14} stroke={1.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="bg-transparent border-none cursor-pointer text-text-muted p-0.5 hover:text-error"
          >
            <IconTrash size={14} stroke={1.5} />
          </button>
        </div>
      )}

      <span className={cn(
        "type-caption shrink-0 ml-2 tabular-nums",
        selected ? "text-text-heading" : "text-text-muted"
      )}>
        {counts.active}/{counts.total}
      </span>
    </div>
  );
}
