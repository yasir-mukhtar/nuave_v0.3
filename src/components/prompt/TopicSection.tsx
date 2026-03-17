'use client';

import { useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { Topic, PromptItem, AuditResult, SelectedItem } from './types';
import PromptListItem from './PromptListItem';

type Props = {
  topic: Topic | null; // null = "Tanpa Topik" uncategorized section
  prompts: PromptItem[];
  selectedItem: SelectedItem | null;
  latestResults: Map<string, AuditResult>;
  onSelectTopic: (topicId: string) => void;
  onSelectPrompt: (promptId: string) => void;
};

const LANG_LABELS: Record<string, string> = {
  en: 'EN',
  id: 'ID',
  ms: 'MS',
};

export default function TopicSection({
  topic,
  prompts,
  selectedItem,
  latestResults,
  onSelectTopic,
  onSelectPrompt,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const isTopicSelected = selectedItem?.type === 'topic' && selectedItem.id === topic?.id;
  const label = topic?.name ?? 'Tanpa Topik';

  const handleHeaderClick = () => {
    if (topic) {
      onSelectTopic(topic.id);
    }
    setExpanded((prev) => !prev);
  };

  return (
    <div style={{ marginBottom: '4px' }}>
      {/* Topic header */}
      <div
        onClick={handleHeaderClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          borderRadius: 'var(--radius-sm)',
          background: isTopicSelected ? 'var(--purple-light, #F3F0FF)' : 'transparent',
          transition: 'background 0.12s ease',
        }}
        onMouseEnter={(e) => {
          if (!isTopicSelected) e.currentTarget.style.background = 'var(--surface, #F9FAFB)';
        }}
        onMouseLeave={(e) => {
          if (!isTopicSelected) e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Chevron */}
        <span style={{ flexShrink: 0, color: 'var(--text-muted, #9CA3AF)' }}>
          {expanded ? <IconChevronDown size={14} stroke={2} /> : <IconChevronRight size={14} stroke={2} />}
        </span>

        {/* Topic name */}
        <span style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-heading, #111827)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>

        {/* Language badge */}
        {topic?.language && (
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            padding: '1px 5px',
            borderRadius: 'var(--radius-xs)',
            background: '#EDE9FF',
            color: '#533AFD',
          }}>
            {LANG_LABELS[topic.language] ?? topic.language.toUpperCase()}
          </span>
        )}

        {/* Prompt count */}
        <span style={{
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-muted, #9CA3AF)',
        }}>
          {prompts.length}
        </span>
      </div>

      {/* Nested prompts */}
      {expanded && (
        <div style={{ paddingLeft: '4px' }}>
          {prompts.length === 0 ? (
            <p style={{
              padding: '8px 12px 8px 32px',
              fontSize: '12px',
              color: 'var(--text-muted, #9CA3AF)',
              fontStyle: 'italic',
            }}>
              Belum ada prompt
            </p>
          ) : (
            prompts.map((p) => (
              <PromptListItem
                key={p.id}
                prompt={p}
                isSelected={selectedItem?.type === 'prompt' && selectedItem.id === p.id}
                latestResult={latestResults.get(p.id)}
                onSelect={() => onSelectPrompt(p.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
