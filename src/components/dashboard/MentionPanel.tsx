'use client';

import { useState } from 'react';
import { IconCircleCheckFilled, IconCircleXFilled, IconArrowUpRight } from '@tabler/icons-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
      <div className="border border-border-light rounded-[var(--radius-sm)] shadow-app-subtle bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between h-14 shrink-0 px-5">
          <span className="type-title text-text-heading">
            Mention
          </span>
          {auditId && (
            <Link
              href={`/audit/${auditId}/results`}
              className="type-body flex items-center gap-1 px-3 py-1.5 font-[var(--btn-font-weight)] text-text-heading no-underline border border-border-light rounded-[var(--radius-sm)] shadow-app-subtle hover:border-border-default transition-colors"
            >
              Lihat semua
              <IconArrowUpRight size={14} stroke={2} />
            </Link>
          )}
        </div>

        <div className="h-px bg-[var(--border-light)] shrink-0" />

        {/* Mention list */}
        <div className="scroll-subtle flex-1 overflow-y-auto py-1">
          {mentions.length === 0 ? (
            <div className="type-body py-6 px-5 text-center text-text-muted">
              Belum ada data mention.
            </div>
          ) : (
            mentions.map((item, idx) => (
              <div
                key={idx}
                onClick={() =>
                  setSelectedResult({
                    prompt_text: item.promptText,
                    ai_response: item.aiResponse,
                    brand_mentioned: item.brandMentioned,
                    created_at: item.createdAt,
                  })
                }
                className={cn(
                  "flex items-start gap-2.5 px-5 py-2.5 cursor-pointer transition-colors hover:bg-surface",
                  idx < mentions.length - 1 && "border-b border-[#F3F4F6]"
                )}
              >
                {item.brandMentioned ? (
                  <IconCircleCheckFilled size={20} className="text-success shrink-0 mt-px" />
                ) : (
                  <IconCircleXFilled size={20} className="text-error shrink-0 mt-px" />
                )}
                <span className="type-body text-text-body">
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
