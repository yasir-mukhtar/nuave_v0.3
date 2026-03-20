"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconSearch,
  IconSparkles,
  IconPlus,
  IconFileText,
  IconArchive,
  IconTrash,
  IconClock,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/* ── Mock data ── */

const MOCK_TOPICS = [
  { id: "t1", name: "Best CRM tools", language: "en" },
  { id: "t2", name: "Rekomendasi alat pemasaran", language: "id" },
  { id: "t3", name: "Small business solutions", language: "en" },
];

const MOCK_PROMPTS = [
  { id: "p1", topicId: "t1", text: "What are the best CRM tools for startups in 2026?", mentioned: true, archived: false },
  { id: "p2", topicId: "t1", text: "Top CRM software for small teams with limited budget", mentioned: false, archived: false },
  { id: "p3", topicId: "t1", text: "Compare the best CRM platforms for B2B companies", mentioned: true, archived: true },
  { id: "p4", topicId: "t2", text: "Apa saja alat pemasaran digital terbaik untuk UKM?", mentioned: true, archived: false },
  { id: "p5", topicId: "t2", text: "Rekomendasi platform email marketing untuk bisnis kecil", mentioned: false, archived: false },
  { id: "p6", topicId: "t3", text: "Best accounting software for freelancers", mentioned: false, archived: false },
  { id: "p7", topicId: "t3", text: "What project management tools do small businesses use?", mentioned: true, archived: false },
  { id: "p8", topicId: null, text: "How to improve brand visibility in AI search results?", mentioned: false, archived: false },
];

const MOCK_RESPONSE = `## Top CRM Tools for Startups in 2026

Here are the most recommended CRM platforms for startups:

- **HubSpot CRM** — Free tier with robust features, great for small teams starting out
- **Salesforce Essentials** — Enterprise-grade features scaled down for startups
- **Pipedrive** — Focused on sales pipeline management with intuitive interface
- **Zoho CRM** — Affordable with extensive customization options

### Key Factors to Consider

When choosing a CRM for your startup, consider:

- **Pricing** — Look for free tiers or startup-friendly pricing
- **Scalability** — Can it grow with your team?
- **Integrations** — Does it connect with your existing tools?
- **Ease of use** — Your team should adopt it quickly

---

Most startups find success with HubSpot CRM or Pipedrive as their first CRM solution.`;

/* ── Page ── */

type FilterTab = "all" | "active" | "archived";

export default function PromptsPage() {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(MOCK_TOPICS.map((t) => t.id)));
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const selectedType = selectedPromptId ? "prompt" : selectedTopicId ? "topic" : null;

  const toggleExpand = (id: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredPrompts = MOCK_PROMPTS.filter((p) => {
    if (filterTab === "active" && p.archived) return false;
    if (filterTab === "archived" && !p.archived) return false;
    if (search && !p.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const promptsForTopic = (topicId: string | null) =>
    filteredPrompts.filter((p) => p.topicId === topicId);

  const counts = {
    all: MOCK_PROMPTS.filter((p) => !search || p.text.toLowerCase().includes(search.toLowerCase())).length,
    active: MOCK_PROMPTS.filter((p) => !p.archived && (!search || p.text.toLowerCase().includes(search.toLowerCase()))).length,
    archived: MOCK_PROMPTS.filter((p) => p.archived && (!search || p.text.toLowerCase().includes(search.toLowerCase()))).length,
  };

  const selectedPrompt = MOCK_PROMPTS.find((p) => p.id === selectedPromptId);
  const selectedTopic = MOCK_TOPICS.find((t) => t.id === selectedTopicId);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "active", label: "Aktif" },
    { key: "archived", label: "Diarsipkan" },
  ];

  const LANG: Record<string, string> = { en: "EN", id: "ID", ms: "MS" };

  return (
    <div className="flex h-[calc(100vh-120px)] -m-8 bg-white rounded-md border border-border-default overflow-hidden">

      {/* ═══════ LEFT PANEL ═══════ */}
      <div className="w-[400px] shrink-0 flex flex-col border-r border-border-default h-full">
        {/* Header */}
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[18px] leading-6 font-bold m-0">Prompt</h1>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-[5px] px-3 py-1.5 text-[12px] leading-4 font-semibold text-white bg-brand border-none rounded-sm cursor-pointer">
                <IconSparkles size={14} stroke={2} />
                Generate Topik
              </button>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] leading-4 font-semibold text-text-body bg-transparent border border-border-default rounded-sm cursor-pointer">
                <IconPlus size={14} stroke={2} />
                Tambah Topik
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-surface border border-border-default rounded-md overflow-hidden mb-3">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={cn(
                  "flex-1 px-2.5 py-[7px] text-[12px] leading-4 font-medium border-none cursor-pointer",
                  filterTab === tab.key
                    ? "bg-white text-text-heading shadow-[0_1px_2px_rgba(0,0,0,0.06)] rounded-sm"
                    : "bg-transparent text-text-muted rounded-none"
                )}
              >
                {tab.label}
                <span className={cn(
                  "ml-[5px] text-[10px] leading-3 font-semibold px-[5px] py-px rounded-xs",
                  filterTab === tab.key
                    ? "bg-brand-light text-brand"
                    : "bg-surface text-text-muted"
                )}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <IconSearch size={14} stroke={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari prompt..."
              className="w-full py-[7px] pl-[30px] pr-3 text-[13px] leading-5 border border-border-default rounded-sm bg-white text-text-body outline-none box-border"
            />
          </div>
        </div>

        {/* Topic list */}
        <div className="scroll-subtle flex-1 overflow-y-auto px-2 pb-3">
          {MOCK_TOPICS.map((topic) => {
            const tp = promptsForTopic(topic.id);
            const isExpanded = expandedTopics.has(topic.id);
            const isSelected = selectedType === "topic" && selectedTopicId === topic.id;
            return (
              <div key={topic.id} className="mb-1">
                <div
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setSelectedPromptId(null);
                    toggleExpand(topic.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 cursor-pointer rounded-sm",
                    isSelected ? "bg-brand-light" : "bg-transparent"
                  )}
                >
                  <span className="text-text-muted">
                    {isExpanded ? <IconChevronDown size={14} stroke={2} /> : <IconChevronRight size={14} stroke={2} />}
                  </span>
                  <span className="flex-1 text-[13px] leading-4 font-semibold text-text-heading overflow-hidden text-ellipsis whitespace-nowrap">
                    {topic.name}
                  </span>
                  <span className="text-[10px] leading-3 font-semibold px-[5px] py-px rounded-xs bg-brand-light text-brand">
                    {LANG[topic.language] ?? topic.language.toUpperCase()}
                  </span>
                  <span className="text-[11px] leading-4 font-medium text-text-muted">{tp.length}</span>
                </div>
                {isExpanded && (
                  <div className="pl-1">
                    {tp.length === 0 ? (
                      <p className="py-2 px-3 pl-8 text-[12px] leading-4 text-text-muted italic">
                        Tidak ada prompt yang cocok
                      </p>
                    ) : tp.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPromptId(p.id); setSelectedTopicId(null); }}
                        className={cn(
                          "flex items-center gap-2 py-2 px-3 pl-8 cursor-pointer rounded-sm",
                          selectedPromptId === p.id ? "bg-brand-light" : "bg-transparent"
                        )}
                      >
                        {p.mentioned
                          ? <IconCircleCheckFilled size={16} className="text-success shrink-0" />
                          : <IconCircleXFilled size={16} className="text-error shrink-0" />
                        }
                        <span className="flex-1 text-[13px] leading-4 text-text-body overflow-hidden text-ellipsis whitespace-nowrap">
                          {p.text}
                        </span>
                        {p.archived && (
                          <span className="text-[10px] leading-3 font-medium px-1.5 py-px rounded-xs bg-surface-raised text-text-placeholder">
                            Arsip
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized */}
          {promptsForTopic(null).length > 0 && (
            <div className="mb-1">
              <div
                onClick={() => {
                  setSelectedTopicId(null);
                  setSelectedPromptId(null);
                }}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-sm bg-transparent"
              >
                <span className="text-text-muted">
                  <IconChevronDown size={14} stroke={2} />
                </span>
                <span className="flex-1 text-[13px] leading-4 font-semibold text-text-muted">
                  Tanpa Topik
                </span>
                <span className="text-[11px] leading-4 font-medium text-text-muted">
                  {promptsForTopic(null).length}
                </span>
              </div>
              <div className="pl-1">
                {promptsForTopic(null).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPromptId(p.id); setSelectedTopicId(null); }}
                    className={cn(
                      "flex items-center gap-2 py-2 px-3 pl-8 cursor-pointer rounded-sm",
                      selectedPromptId === p.id ? "bg-brand-light" : "bg-transparent"
                    )}
                  >
                    {p.mentioned
                      ? <IconCircleCheckFilled size={16} className="text-success shrink-0" />
                      : <IconCircleXFilled size={16} className="text-error shrink-0" />
                    }
                    <span className="flex-1 text-[13px] leading-4 text-text-body overflow-hidden text-ellipsis whitespace-nowrap">
                      {p.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ RIGHT PANEL ═══════ */}
      <div className="flex-1 flex flex-col bg-[#FAFAFA]">

        {/* Empty state */}
        {!selectedPrompt && !selectedTopic && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <IconFileText size={40} stroke={1} className="text-border-strong" />
            <p className="text-[14px] leading-5 text-text-muted m-0">
              Pilih prompt atau topik untuk melihat detail
            </p>
          </div>
        )}

        {/* Prompt detail */}
        {selectedPrompt && (
          <div className="scroll-subtle flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {/* Chat bubble */}
            <div className="flex justify-end">
              <div className="bg-brand text-white rounded-[var(--radius-2xl)] rounded-br-xs px-3.5 py-2.5 max-w-[85%] text-[14px] leading-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {selectedPrompt.text}
              </div>
            </div>

            {/* Mention badge */}
            <div className="flex gap-2 justify-end">
              <div className="inline-flex items-center gap-1.5 bg-[#F4F4F4] rounded-full py-1.5 pl-1.5 pr-3">
                {selectedPrompt.mentioned
                  ? <IconCircleCheckFilled size={18} color="#16A34A" />
                  : <IconCircleXFilled size={18} color="#DC2626" />
                }
                <span className="text-[13px] leading-4 font-medium text-text-heading">
                  Brand {selectedPrompt.mentioned ? "disebutkan" : "tidak disebutkan"}
                </span>
              </div>
              {selectedPrompt.mentioned && (
                <div className="inline-flex items-center bg-[#DCFCE7] text-[#16A34A] rounded-full px-3 py-1.5 text-[12px] leading-4 font-semibold">
                  Positif
                </div>
              )}
            </div>

            {/* AI response */}
            <div className="border border-border-default rounded-md p-5 bg-white">
              <p className="text-[11px] leading-4 font-semibold text-text-muted uppercase tracking-wide mb-3 mt-0">
                Respons AI
              </p>
              <div className="text-[14px] leading-6 text-text-body whitespace-pre-wrap">
                {MOCK_RESPONSE.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) return <p key={i} className="text-[16px] leading-6 font-bold text-text-heading mt-4 mb-2">{line.slice(3)}</p>;
                  if (line.startsWith("### ")) return <p key={i} className="text-[14px] leading-5 font-semibold text-text-heading mt-3 mb-1">{line.slice(4)}</p>;
                  if (line.startsWith("- ")) return <div key={i} className="flex gap-2 mb-1"><span className="text-brand">&#8226;</span><span>{line.slice(2)}</span></div>;
                  if (line.startsWith("---")) return <hr key={i} className="border-none border-t border-border-default my-3" />;
                  if (line.trim() === "") return <div key={i} className="h-2" />;
                  return <p key={i} className="mb-1 mt-0">{line}</p>;
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border-default text-[11px] leading-4 text-text-placeholder">
                Respons oleh GPT-4o dengan pencarian web &middot; 17 Mar 2026
              </div>
            </div>

            {/* Competitor mentions */}
            <div>
              <p className="text-[11px] leading-4 font-semibold text-text-muted uppercase tracking-wide mb-2 mt-0">
                Kompetitor yang Disebutkan
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {["HubSpot", "Salesforce", "Pipedrive", "Zoho"].map((c) => (
                  <span key={c} className="text-[12px] leading-4 font-medium px-2.5 py-1 rounded-full bg-[#FEE2E2] text-red-600">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Response history placeholder */}
            <div className="border border-border-default rounded-md p-5 bg-[#FAFAFA]">
              <div className="flex items-center gap-1.5 mb-4">
                <IconClock size={16} stroke={1.5} className="text-text-muted" />
                <span className="text-[13px] leading-4 font-semibold text-text-heading">Riwayat Respons</span>
                <span className="text-[10px] leading-3 font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-amber-600">
                  Segera hadir
                </span>
              </div>
              <div className="opacity-40">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={cn("flex gap-3 pb-3 mb-3", i < 3 ? "border-b border-border-default" : "border-none")}>
                    <div className="w-2 h-2 rounded-full bg-border-strong mt-1" />
                    <div>
                      <div className="h-2.5 w-20 bg-border-default rounded-[4px] mb-1.5" />
                      <div className="h-2.5 w-40 bg-border-default rounded-[4px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border-default">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] leading-4 font-semibold text-text-body bg-transparent border border-border-default rounded-sm cursor-pointer">
                <IconArchive size={14} stroke={1.5} />
                Arsipkan
              </button>
              <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] leading-4 font-semibold text-red-600 bg-transparent border border-[#FCA5A5] rounded-sm cursor-pointer">
                <IconTrash size={14} stroke={1.5} />
                Hapus
              </button>
            </div>
          </div>
        )}

        {/* Topic detail */}
        {selectedTopic && !selectedPrompt && (
          <div className="scroll-subtle flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-[20px] leading-7 font-bold mb-1.5 mt-0">{selectedTopic.name}</h2>
              <span className="text-[12px] leading-4 font-medium px-2 py-0.5 rounded-xs bg-brand-light text-brand">
                {LANG[selectedTopic.language] ?? selectedTopic.language}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Prompt", value: String(promptsForTopic(selectedTopic.id).length), color: "text-text-heading" },
                { label: "Aktif", value: String(MOCK_PROMPTS.filter((p) => p.topicId === selectedTopic.id && !p.archived).length), color: "text-success" },
                { label: "Tingkat Sebutan", value: "67%", color: "text-warning" },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-md border border-border-default bg-white">
                  <p className="text-[11px] leading-4 font-medium text-text-muted uppercase tracking-wide mb-1 mt-0">{s.label}</p>
                  <p className={cn("text-[24px] leading-7 font-bold m-0", s.color)}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-[5px] px-3.5 py-2 text-[12px] leading-4 font-semibold text-white bg-brand border-none rounded-sm cursor-pointer">
                <IconSparkles size={14} stroke={2} />
                Generate Prompt
              </button>
              <button className="inline-flex items-center gap-1 px-3.5 py-2 text-[12px] leading-4 font-semibold text-text-body bg-transparent border border-border-default rounded-sm cursor-pointer">
                <IconPlus size={14} stroke={2} />
                Tambah Prompt
              </button>
            </div>

            {/* Prompts list */}
            <div>
              <p className="text-[11px] leading-4 font-semibold text-text-muted uppercase tracking-wide mb-2 mt-0">
                Prompt dalam Topik
              </p>
              <div className="border border-border-default rounded-md bg-white overflow-hidden">
                {MOCK_PROMPTS.filter((p) => p.topicId === selectedTopic.id).map((p, i, arr) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPromptId(p.id); setSelectedTopicId(null); }}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2.5 cursor-pointer",
                      i < arr.length - 1 ? "border-b border-border-default" : ""
                    )}
                  >
                    {p.mentioned
                      ? <IconCircleCheckFilled size={16} className="text-success shrink-0" />
                      : <IconCircleXFilled size={16} className="text-error shrink-0" />
                    }
                    <span className="flex-1 text-[13px] leading-4 text-text-body overflow-hidden text-ellipsis whitespace-nowrap">
                      {p.text}
                    </span>
                    {p.archived && (
                      <span className="text-[10px] leading-3 font-medium px-1.5 py-px rounded-xs bg-surface-raised text-text-placeholder">
                        Arsip
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delete topic */}
            <div className="pt-2 border-t border-border-default">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] leading-4 font-semibold text-red-600 bg-transparent border border-[#FCA5A5] rounded-sm cursor-pointer">
                <IconTrash size={14} stroke={1.5} />
                Hapus Topik
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
