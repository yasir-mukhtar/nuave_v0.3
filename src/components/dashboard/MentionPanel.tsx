'use client';

import { useState } from 'react';
import { IconCircleCheckFilled, IconCircleXFilled, IconArrowUpRight } from '@tabler/icons-react';
import Link from 'next/link';
import PromptDetailModal, { type PromptDetail } from '@/components/PromptDetailModal';

type Mention = {
  promptText: string;
  brandMentioned: boolean;
  aiResponse: string;
  createdAt?: string;
};

type MentionPanelProps = {
  mentions: Mention[];
  auditId?: string;
  brandName: string;
};

export default function MentionPanel({ mentions, auditId, brandName }: MentionPanelProps) {
  const [selectedResult, setSelectedResult] = useState<PromptDetail | null>(null);

  return (
    <>
      <div
        style={{
          border: '1px solid var(--border-light)',
          borderRadius: '6px',
          boxShadow: 'var(--shadow-subtle)',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            flexShrink: 0,
            padding: '0 20px',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)' }}>
            Mention
          </span>
          {auditId && (
            <Link
              href={`/audit/${auditId}/results`}
              className="text-label-13"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontWeight: 500,
                color: 'var(--text-heading)',
                textDecoration: 'none',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              Lihat semua
              <IconArrowUpRight size={14} stroke={2} />
            </Link>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border-light)', flexShrink: 0 }} />

        {/* Mention list */}
        <div
          className="scroll-subtle"
          style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}
        >
          <style>{`
            .mention-row:hover {
              background: #F9FAFB !important;
            }
          `}</style>
          {mentions.length === 0 ? (
            <div
              className="text-label-13"
              style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)' }}
            >
              Belum ada data mention.
            </div>
          ) : (
            mentions.map((item, idx) => (
              <div
                key={idx}
                className="mention-row"
                onClick={() =>
                  setSelectedResult({
                    prompt_text: item.promptText,
                    ai_response: item.aiResponse,
                    brand_mentioned: item.brandMentioned,
                    created_at: item.createdAt,
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 20px',
                  borderBottom: idx < mentions.length - 1 ? '1px solid #F3F4F6' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {item.brandMentioned ? (
                  <IconCircleCheckFilled
                    size={20}
                    style={{ color: '#16A34A', flexShrink: 0, marginTop: '1px' }}
                  />
                ) : (
                  <IconCircleXFilled
                    size={20}
                    style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }}
                  />
                )}
                <span
                  className="text-copy-14"
                  style={{ color: 'var(--text-body)' }}
                >
                  {item.promptText}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shared detail modal */}
      {selectedResult && (
        <PromptDetailModal
          result={selectedResult}
          brandName={brandName}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </>
  );
}
