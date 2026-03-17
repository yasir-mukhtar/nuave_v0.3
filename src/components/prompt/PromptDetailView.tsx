'use client';

import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconArchive,
  IconArchiveOff,
  IconTrash,
} from '@tabler/icons-react';
import { renderMarkdown } from '@/lib/markdown';
import type { PromptItem, AuditResult } from './types';
import ResponseHistoryTimeline from './ResponseHistoryTimeline';

type Props = {
  prompt: PromptItem;
  latestResult?: AuditResult;
  brandName: string;
  onArchiveToggle: (promptId: string, archived: boolean) => void;
  onDelete: (promptId: string) => void;
};

const SENTIMENT_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  positive: { label: 'Positif', bg: '#DCFCE7', color: '#16A34A' },
  neutral: { label: 'Netral', bg: '#F3F4F6', color: '#6B7280' },
  negative: { label: 'Negatif', bg: '#FEE2E2', color: '#DC2626' },
};

export default function PromptDetailView({
  prompt,
  latestResult,
  brandName,
  onArchiveToggle,
  onDelete,
}: Props) {
  const mentioned = latestResult?.brand_mentioned;
  const sentiment = latestResult?.mention_sentiment;
  const sentimentCfg = sentiment ? SENTIMENT_CONFIG[sentiment] : null;
  const competitors = latestResult?.competitor_mentions ?? [];

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
      {/* Prompt text bubble */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          className="text-label-14"
          style={{
            background: 'var(--purple, #533AFD)',
            color: 'white',
            borderRadius: 'var(--radius-2xl) var(--radius-2xl) var(--radius-xs) var(--radius-2xl)',
            padding: '10px 14px',
            maxWidth: '85%',
            display: 'inline-block',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {prompt.prompt_text}
        </div>
      </div>

      {/* Status badges row */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {/* Mention status */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#F4F4F4',
          borderRadius: 'var(--radius-full)',
          padding: '6px 12px 6px 6px',
        }}>
          {mentioned ? (
            <IconCircleCheckFilled size={18} color="#16A34A" />
          ) : (
            <IconCircleXFilled size={18} color="#DC2626" />
          )}
          <span className="text-label-13" style={{ fontWeight: 500, color: '#111827' }}>
            {brandName}{' '}
            {mentioned ? 'disebutkan' : 'tidak disebutkan'}
          </span>
        </div>

        {/* Sentiment badge */}
        {sentimentCfg && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: sentimentCfg.bg,
            color: sentimentCfg.color,
            borderRadius: 'var(--radius-full)',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {sentimentCfg.label}
          </div>
        )}
      </div>

      {/* AI Response */}
      {latestResult ? (
        <div style={{
          border: '1px solid var(--border-default, #E5E7EB)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          background: '#ffffff',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted, #9CA3AF)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 12px 0',
          }}>
            Respons AI
          </p>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {renderMarkdown(latestResult.ai_response, brandName)}
          </div>
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #E5E7EB',
            fontSize: '11px',
            color: '#9CA3AF',
          }}>
            Respons oleh GPT-4o dengan pencarian web ·{' '}
            {new Date(latestResult.created_at).toLocaleString('id-ID')}
          </div>
        </div>
      ) : (
        <div style={{
          border: '1px solid var(--border-default, #E5E7EB)',
          borderRadius: 'var(--radius-md)',
          padding: '32px 20px',
          background: '#FAFAFA',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #9CA3AF)', margin: 0 }}>
            Belum ada hasil audit untuk prompt ini.
          </p>
        </div>
      )}

      {/* Competitor mentions */}
      {competitors.length > 0 && (
        <div>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted, #9CA3AF)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 8px 0',
          }}>
            Kompetitor yang Disebutkan
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {competitors.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: '#FEE2E2',
                  color: '#DC2626',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Response history placeholder */}
      <ResponseHistoryTimeline />

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-default, #E5E7EB)',
      }}>
        <button
          onClick={() => onArchiveToggle(prompt.id, !prompt.is_archived)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
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
          {prompt.is_archived ? (
            <>
              <IconArchiveOff size={14} stroke={1.5} />
              Aktifkan Kembali
            </>
          ) : (
            <>
              <IconArchive size={14} stroke={1.5} />
              Arsipkan
            </>
          )}
        </button>
        <button
          onClick={() => {
            if (window.confirm('Hapus prompt ini? Tindakan ini tidak bisa dibatalkan.')) {
              onDelete(prompt.id);
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
          Hapus
        </button>
      </div>
    </div>
  );
}
