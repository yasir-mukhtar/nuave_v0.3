'use client';

import { useMemo } from 'react';
import {
  IconSearch,
  IconSparkles,
  IconPlus,
} from '@tabler/icons-react';
import type { Topic, PromptItem, AuditResult, SelectedItem, FilterTab } from './types';
import TopicSection from './TopicSection';

type Props = {
  topics: Topic[];
  prompts: PromptItem[];
  selectedItem: SelectedItem | null;
  latestResults: Map<string, AuditResult>;
  search: string;
  filterTab: FilterTab;
  onSearchChange: (value: string) => void;
  onFilterTabChange: (tab: FilterTab) => void;
  onSelectTopic: (topicId: string) => void;
  onSelectPrompt: (promptId: string) => void;
  onGenerateTopics: () => void;
  onAddTopic: () => void;
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'archived', label: 'Diarsipkan' },
];

export default function PromptLeftPanel({
  topics,
  prompts,
  selectedItem,
  latestResults,
  search,
  filterTab,
  onSearchChange,
  onFilterTabChange,
  onSelectTopic,
  onSelectPrompt,
  onGenerateTopics,
  onAddTopic,
}: Props) {
  // Filter prompts
  const filteredPrompts = useMemo(() => {
    let result = prompts;
    if (filterTab === 'active') result = result.filter((p) => !p.is_archived);
    if (filterTab === 'archived') result = result.filter((p) => p.is_archived);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.prompt_text.toLowerCase().includes(q));
    }
    return result;
  }, [prompts, filterTab, search]);

  // Group prompts by topic
  const groupedByTopic = useMemo(() => {
    const map = new Map<string | null, PromptItem[]>();
    for (const p of filteredPrompts) {
      const key = p.topic_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [filteredPrompts]);

  // Tab counts
  const counts = useMemo(() => {
    let base = prompts;
    if (search) {
      const q = search.toLowerCase();
      base = base.filter((p) => p.prompt_text.toLowerCase().includes(q));
    }
    return {
      all: base.length,
      active: base.filter((p) => !p.is_archived).length,
      archived: base.filter((p) => p.is_archived).length,
    };
  }, [prompts, search]);

  return (
    <div
      style={{
        width: '420px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-default, #E5E7EB)',
        background: '#ffffff',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 20px 0 20px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-heading, #111827)' }}>
            Prompt
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onGenerateTopics}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                background: 'var(--purple, #533AFD)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <IconSparkles size={14} stroke={2} />
              Generate Topik
            </button>
            <button
              onClick={onAddTopic}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-body, #374151)',
                background: 'transparent',
                border: '1px solid var(--border-default, #E5E7EB)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface, #F9FAFB)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <IconPlus size={14} stroke={2} />
              Tambah Topik
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--surface, #F9FAFB)',
          border: '1px solid var(--border-default, #E5E7EB)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '12px',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterTabChange(tab.key)}
              style={{
                flex: 1,
                padding: '7px 10px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: filterTab === tab.key ? '#ffffff' : 'transparent',
                color: filterTab === tab.key ? 'var(--text-heading, #111827)' : 'var(--text-muted, #9CA3AF)',
                boxShadow: filterTab === tab.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                borderRadius: filterTab === tab.key ? 'var(--radius-sm)' : '0',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: '5px',
                fontSize: '10px',
                fontWeight: 600,
                background: filterTab === tab.key ? 'var(--purple-light, #F3F0FF)' : 'var(--surface, #F9FAFB)',
                color: filterTab === tab.key ? 'var(--purple, #533AFD)' : 'var(--text-muted, #9CA3AF)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-xs)',
              }}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <IconSearch
            size={14}
            stroke={1.5}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #9CA3AF)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari prompt..."
            style={{
              width: '100%',
              padding: '7px 12px 7px 30px',
              fontSize: '13px',
              border: '1px solid var(--border-default, #E5E7EB)',
              borderRadius: 'var(--radius-sm)',
              background: '#ffffff',
              color: 'var(--text-body, #374151)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Topic list */}
      <div
        className="scroll-subtle"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 8px 12px 8px',
        }}
      >
        {/* Topics with prompts */}
        {topics.map((topic) => (
          <TopicSection
            key={topic.id}
            topic={topic}
            prompts={groupedByTopic.get(topic.id) ?? []}
            selectedItem={selectedItem}
            latestResults={latestResults}
            onSelectTopic={onSelectTopic}
            onSelectPrompt={onSelectPrompt}
          />
        ))}

        {/* Uncategorized prompts */}
        {(groupedByTopic.get(null)?.length ?? 0) > 0 && (
          <TopicSection
            topic={null}
            prompts={groupedByTopic.get(null) ?? []}
            selectedItem={selectedItem}
            latestResults={latestResults}
            onSelectTopic={() => {}}
            onSelectPrompt={onSelectPrompt}
          />
        )}

        {/* Empty state */}
        {filteredPrompts.length === 0 && topics.length === 0 && (
          <div style={{
            padding: '48px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #9CA3AF)', margin: '0 0 4px 0' }}>
              Belum ada prompt atau topik
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #9CA3AF)', margin: 0 }}>
              Generate topik untuk memulai
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
