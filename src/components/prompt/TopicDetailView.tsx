'use client';

import { useMemo } from 'react';
import {
  IconSparkles,
  IconPlus,
  IconTrash,
  IconCircleCheckFilled,
  IconCircleXFilled,
} from '@tabler/icons-react';
import type { Topic, PromptItem, AuditResult } from './types';

type Props = {
  topic: Topic;
  prompts: PromptItem[];
  latestResults: Map<string, AuditResult>;
  onGeneratePrompts: (topicId: string) => void;
  onAddPrompt: (topicId: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onSelectPrompt: (promptId: string) => void;
};

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Malaysia',
};

export default function TopicDetailView({
  topic,
  prompts,
  latestResults,
  onGeneratePrompts,
  onAddPrompt,
  onDeleteTopic,
  onSelectPrompt,
}: Props) {
  const stats = useMemo(() => {
    const total = prompts.length;
    const active = prompts.filter((p) => !p.is_archived).length;
    let mentioned = 0;
    let withResult = 0;
    for (const p of prompts) {
      const r = latestResults.get(p.id);
      if (r) {
        withResult++;
        if (r.brand_mentioned) mentioned++;
      }
    }
    const mentionRate = withResult > 0 ? Math.round((mentioned / withResult) * 100) : 0;
    return { total, active, mentioned, withResult, mentionRate };
  }, [prompts, latestResults]);

  return (
    <div
      className="scroll-subtle"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Topic name + language */}
      <div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-heading, #111827)',
          margin: '0 0 6px 0',
        }}>
          {topic.name}
        </h2>
        <span style={{
          fontSize: '12px',
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: 'var(--radius-xs)',
          background: '#EDE9FF',
          color: '#533AFD',
        }}>
          {LANG_LABELS[topic.language] ?? topic.language}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default, #E5E7EB)',
          background: '#ffffff',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-muted, #9CA3AF)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 4px 0',
          }}>
            Total Prompt
          </p>
          <p style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-heading, #111827)' }}>
            {stats.total}
          </p>
        </div>
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default, #E5E7EB)',
          background: '#ffffff',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-muted, #9CA3AF)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 4px 0',
          }}>
            Aktif
          </p>
          <p style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#22C55E' }}>
            {stats.active}
          </p>
        </div>
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default, #E5E7EB)',
          background: '#ffffff',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-muted, #9CA3AF)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 4px 0',
          }}>
            Tingkat Sebutan
          </p>
          <p style={{
            fontSize: '24px',
            fontWeight: 700,
            margin: 0,
            color: stats.mentionRate >= 70 ? '#22C55E' : stats.mentionRate >= 40 ? '#F59E0B' : '#EF4444',
          }}>
            {stats.withResult > 0 ? `${stats.mentionRate}%` : '—'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onGeneratePrompts(topic.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '8px 14px',
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
          Generate Prompt
        </button>
        <button
          onClick={() => onAddPrompt(topic.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 14px',
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
          Tambah Prompt
        </button>
      </div>

      {/* Prompts in this topic */}
      <div>
        <p style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-muted, #9CA3AF)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 8px 0',
        }}>
          Prompt dalam Topik
        </p>
        <div style={{
          border: '1px solid var(--border-default, #E5E7EB)',
          borderRadius: 'var(--radius-md)',
          background: '#ffffff',
          overflow: 'hidden',
        }}>
          {prompts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #9CA3AF)', margin: 0 }}>
                Belum ada prompt dalam topik ini.
              </p>
            </div>
          ) : (
            prompts.map((p, i) => {
              const result = latestResults.get(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPrompt(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderBottom: i < prompts.length - 1 ? '1px solid var(--border-default, #E5E7EB)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface, #F9FAFB)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ flexShrink: 0 }}>
                    {result?.brand_mentioned === true ? (
                      <IconCircleCheckFilled size={16} style={{ color: '#22C55E' }} />
                    ) : result?.brand_mentioned === false ? (
                      <IconCircleXFilled size={16} style={{ color: '#EF4444' }} />
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid var(--border-default, #E5E7EB)',
                      }} />
                    )}
                  </span>
                  <span style={{
                    flex: 1,
                    fontSize: '13px',
                    color: 'var(--text-body, #374151)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {p.prompt_text}
                  </span>
                  {p.is_archived && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-xs)',
                      background: '#F3F4F6',
                      color: '#9CA3AF',
                      flexShrink: 0,
                    }}>
                      Arsip
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete topic */}
      <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-default, #E5E7EB)' }}>
        <button
          onClick={() => {
            if (window.confirm('Hapus topik ini? Prompt di dalamnya akan menjadi tanpa topik.')) {
              onDeleteTopic(topic.id);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#DC2626',
            background: 'transparent',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <IconTrash size={14} stroke={1.5} />
          Hapus Topik
        </button>
      </div>
    </div>
  );
}
