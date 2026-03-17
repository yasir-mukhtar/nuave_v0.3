'use client';

import {
  IconCircleCheckFilled,
  IconCircleXFilled,
} from '@tabler/icons-react';
import type { PromptItem, AuditResult } from './types';

type Props = {
  prompt: PromptItem;
  isSelected: boolean;
  latestResult?: AuditResult;
  onSelect: () => void;
};

export default function PromptListItem({ prompt, isSelected, latestResult, onSelect }: Props) {
  const isArchived = prompt.is_archived;
  const mentioned = latestResult?.brand_mentioned;

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px 8px 32px',
        cursor: 'pointer',
        background: isSelected ? 'var(--purple-light, #F3F0FF)' : 'transparent',
        borderRadius: 'var(--radius-sm)',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--surface, #F9FAFB)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Mention status icon */}
      <span style={{ flexShrink: 0 }}>
        {mentioned === true ? (
          <IconCircleCheckFilled size={16} style={{ color: '#22C55E' }} />
        ) : mentioned === false ? (
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

      {/* Prompt text */}
      <span style={{
        flex: 1,
        fontSize: '13px',
        color: 'var(--text-body, #374151)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}>
        {prompt.prompt_text}
      </span>

      {/* Archive badge */}
      {isArchived && (
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
}
