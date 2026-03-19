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
    <div style={{
      display: "flex",
      height: "calc(100vh - 120px)",
      margin: "-32px",
      background: "#ffffff",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default, #E5E7EB)",
      overflow: "hidden",
    }}>

      {/* ═══════ LEFT PANEL ═══════ */}
      <div style={{
        width: 400,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border-default, #E5E7EB)",
        height: "100%",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Prompt</h1>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 12px", fontSize: 12, fontWeight: 600,
                color: "#fff", background: "var(--purple, #533AFD)",
                border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
              }}>
                <IconSparkles size={14} stroke={2} />
                Generate Topik
              </button>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "6px 12px", fontSize: 12, fontWeight: 600,
                color: "var(--text-body, #374151)", background: "transparent",
                border: "1px solid var(--border-default, #E5E7EB)",
                borderRadius: "var(--radius-sm)", cursor: "pointer",
              }}>
                <IconPlus size={14} stroke={2} />
                Tambah Topik
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", background: "var(--surface, #F9FAFB)",
            border: "1px solid var(--border-default, #E5E7EB)",
            borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: 12,
          }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                style={{
                  flex: 1, padding: "7px 10px", fontSize: 12, fontWeight: 500,
                  border: "none", cursor: "pointer",
                  background: filterTab === tab.key ? "#fff" : "transparent",
                  color: filterTab === tab.key ? "var(--text-heading)" : "var(--text-muted)",
                  boxShadow: filterTab === tab.key ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  borderRadius: filterTab === tab.key ? "var(--radius-sm)" : 0,
                }}
              >
                {tab.label}
                <span style={{
                  marginLeft: 5, fontSize: 10, fontWeight: 600,
                  background: filterTab === tab.key ? "var(--purple-light, #F3F0FF)" : "var(--surface, #F9FAFB)",
                  color: filterTab === tab.key ? "var(--purple, #533AFD)" : "var(--text-muted)",
                  padding: "1px 5px", borderRadius: "var(--radius-xs)",
                }}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <IconSearch size={14} stroke={1.5} style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-muted)", pointerEvents: "none",
            }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari prompt..."
              style={{
                width: "100%", padding: "7px 12px 7px 30px", fontSize: 13,
                border: "1px solid var(--border-default, #E5E7EB)",
                borderRadius: "var(--radius-sm)", background: "#fff",
                color: "var(--text-body)", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Topic list */}
        <div className="scroll-subtle" style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
          {MOCK_TOPICS.map((topic) => {
            const tp = promptsForTopic(topic.id);
            const isExpanded = expandedTopics.has(topic.id);
            const isSelected = selectedType === "topic" && selectedTopicId === topic.id;
            return (
              <div key={topic.id} style={{ marginBottom: 4 }}>
                <div
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setSelectedPromptId(null);
                    toggleExpand(topic.id);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                    background: isSelected ? "var(--purple-light, #F3F0FF)" : "transparent",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? <IconChevronDown size={14} stroke={2} /> : <IconChevronRight size={14} stroke={2} />}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {topic.name}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: "var(--radius-xs)", background: "#EDE9FF", color: "#533AFD" }}>
                    {LANG[topic.language] ?? topic.language.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{tp.length}</span>
                </div>
                {isExpanded && (
                  <div style={{ paddingLeft: 4 }}>
                    {tp.length === 0 ? (
                      <p style={{ padding: "8px 12px 8px 32px", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                        Tidak ada prompt yang cocok
                      </p>
                    ) : tp.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPromptId(p.id); setSelectedTopicId(null); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 12px 8px 32px", cursor: "pointer",
                          borderRadius: "var(--radius-sm)",
                          background: selectedPromptId === p.id ? "var(--purple-light, #F3F0FF)" : "transparent",
                        }}
                      >
                        {p.mentioned
                          ? <IconCircleCheckFilled size={16} style={{ color: "#22C55E", flexShrink: 0 }} />
                          : <IconCircleXFilled size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
                        }
                        <span style={{ flex: 1, fontSize: 13, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.text}
                        </span>
                        {p.archived && (
                          <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: "var(--radius-xs)", background: "#F3F4F6", color: "#9CA3AF" }}>
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
            <div style={{ marginBottom: 4 }}>
              <div
                onClick={() => {
                  setSelectedTopicId(null);
                  setSelectedPromptId(null);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", cursor: "pointer",
                  borderRadius: "var(--radius-sm)", background: "transparent",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>
                  <IconChevronDown size={14} stroke={2} />
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
                  Tanpa Topik
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>
                  {promptsForTopic(null).length}
                </span>
              </div>
              <div style={{ paddingLeft: 4 }}>
                {promptsForTopic(null).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPromptId(p.id); setSelectedTopicId(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px 8px 32px", cursor: "pointer",
                      borderRadius: "var(--radius-sm)",
                      background: selectedPromptId === p.id ? "var(--purple-light, #F3F0FF)" : "transparent",
                    }}
                  >
                    {p.mentioned
                      ? <IconCircleCheckFilled size={16} style={{ color: "#22C55E", flexShrink: 0 }} />
                      : <IconCircleXFilled size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FAFAFA" }}>

        {/* Empty state */}
        {!selectedPrompt && !selectedTopic && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <IconFileText size={40} stroke={1} style={{ color: "#D1D5DB" }} />
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
              Pilih prompt atau topik untuk melihat detail
            </p>
          </div>
        )}

        {/* Prompt detail */}
        {selectedPrompt && (
          <div className="scroll-subtle" style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Chat bubble */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                background: "var(--purple, #533AFD)", color: "white",
                borderRadius: "var(--radius-2xl) var(--radius-2xl) var(--radius-xs) var(--radius-2xl)",
                padding: "10px 14px", maxWidth: "85%", fontSize: 14, lineHeight: 1.5,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}>
                {selectedPrompt.text}
              </div>
            </div>

            {/* Mention badge */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#F4F4F4", borderRadius: "var(--radius-full)",
                padding: "6px 12px 6px 6px",
              }}>
                {selectedPrompt.mentioned
                  ? <IconCircleCheckFilled size={18} color="#16A34A" />
                  : <IconCircleXFilled size={18} color="#DC2626" />
                }
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                  Brand {selectedPrompt.mentioned ? "disebutkan" : "tidak disebutkan"}
                </span>
              </div>
              {selectedPrompt.mentioned && (
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  background: "#DCFCE7", color: "#16A34A",
                  borderRadius: "var(--radius-full)", padding: "6px 12px",
                  fontSize: 12, fontWeight: 600,
                }}>
                  Positif
                </div>
              )}
            </div>

            {/* AI response */}
            <div style={{
              border: "1px solid var(--border-default, #E5E7EB)",
              borderRadius: "var(--radius-md)", padding: 20, background: "#fff",
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                Respons AI
              </p>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {MOCK_RESPONSE.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) return <p key={i} style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "16px 0 8px" }}>{line.slice(3)}</p>;
                  if (line.startsWith("### ")) return <p key={i} style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "12px 0 4px" }}>{line.slice(4)}</p>;
                  if (line.startsWith("- ")) return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: "#533AFD" }}>•</span><span>{line.slice(2)}</span></div>;
                  if (line.startsWith("---")) return <hr key={i} style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "12px 0" }} />;
                  if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
                  return <p key={i} style={{ margin: "0 0 4px" }}>{line}</p>;
                })}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E5E7EB", fontSize: 11, color: "#9CA3AF" }}>
                Respons oleh GPT-4o dengan pencarian web · 17 Mar 2026
              </div>
            </div>

            {/* Competitor mentions */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                Kompetitor yang Disebutkan
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["HubSpot", "Salesforce", "Pipedrive", "Zoho"].map((c) => (
                  <span key={c} style={{ fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: "var(--radius-full)", background: "#FEE2E2", color: "#DC2626" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Response history placeholder */}
            <div style={{ border: "1px solid var(--border-default, #E5E7EB)", borderRadius: "var(--radius-md)", padding: 20, background: "#FAFAFA" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <IconClock size={16} stroke={1.5} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-heading)" }}>Riwayat Respons</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "#FEF3C7", color: "#D97706" }}>
                  Segera hadir
                </span>
              </div>
              <div style={{ opacity: 0.4 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < 3 ? "1px solid #E5E7EB" : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D1D5DB", marginTop: 4 }} />
                    <div>
                      <div style={{ height: 10, width: 80, background: "#E5E7EB", borderRadius: 4, marginBottom: 6 }} />
                      <div style={{ height: 10, width: 160, background: "#E5E7EB", borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border-default, #E5E7EB)" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", fontSize: 12, fontWeight: 600,
                color: "var(--text-body)", background: "transparent",
                border: "1px solid var(--border-default, #E5E7EB)",
                borderRadius: "var(--radius-sm)", cursor: "pointer",
              }}>
                <IconArchive size={14} stroke={1.5} />
                Arsipkan
              </button>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", fontSize: 12, fontWeight: 600,
                color: "#DC2626", background: "transparent",
                border: "1px solid #FCA5A5",
                borderRadius: "var(--radius-sm)", cursor: "pointer",
              }}>
                <IconTrash size={14} stroke={1.5} />
                Hapus
              </button>
            </div>
          </div>
        )}

        {/* Topic detail */}
        {selectedTopic && !selectedPrompt && (
          <div className="scroll-subtle" style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>{selectedTopic.name}</h2>
              <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: "var(--radius-xs)", background: "#EDE9FF", color: "#533AFD" }}>
                {LANG[selectedTopic.language] ?? selectedTopic.language}
              </span>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Total Prompt", value: String(promptsForTopic(selectedTopic.id).length), color: "var(--text-heading)" },
                { label: "Aktif", value: String(MOCK_PROMPTS.filter((p) => p.topicId === selectedTopic.id && !p.archived).length), color: "#22C55E" },
                { label: "Tingkat Sebutan", value: "67%", color: "#F59E0B" },
              ].map((s) => (
                <div key={s.label} style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default, #E5E7EB)", background: "#fff" }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{s.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "8px 14px", fontSize: 12, fontWeight: 600,
                color: "#fff", background: "var(--purple, #533AFD)",
                border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
              }}>
                <IconSparkles size={14} stroke={2} />
                Generate Prompt
              </button>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "8px 14px", fontSize: 12, fontWeight: 600,
                color: "var(--text-body)", background: "transparent",
                border: "1px solid var(--border-default, #E5E7EB)",
                borderRadius: "var(--radius-sm)", cursor: "pointer",
              }}>
                <IconPlus size={14} stroke={2} />
                Tambah Prompt
              </button>
            </div>

            {/* Prompts list */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                Prompt dalam Topik
              </p>
              <div style={{ border: "1px solid var(--border-default, #E5E7EB)", borderRadius: "var(--radius-md)", background: "#fff", overflow: "hidden" }}>
                {MOCK_PROMPTS.filter((p) => p.topicId === selectedTopic.id).map((p, i, arr) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedPromptId(p.id); setSelectedTopicId(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", cursor: "pointer",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border-default, #E5E7EB)" : "none",
                    }}
                  >
                    {p.mentioned
                      ? <IconCircleCheckFilled size={16} style={{ color: "#22C55E", flexShrink: 0 }} />
                      : <IconCircleXFilled size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.text}
                    </span>
                    {p.archived && (
                      <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: "var(--radius-xs)", background: "#F3F4F6", color: "#9CA3AF" }}>
                        Arsip
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delete topic */}
            <div style={{ paddingTop: 8, borderTop: "1px solid var(--border-default, #E5E7EB)" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", fontSize: 12, fontWeight: 600,
                color: "#DC2626", background: "transparent",
                border: "1px solid #FCA5A5",
                borderRadius: "var(--radius-sm)", cursor: "pointer",
              }}>
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
