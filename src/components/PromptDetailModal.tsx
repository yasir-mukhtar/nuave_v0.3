'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderMarkdown } from '@/lib/markdown';

export interface PromptDetail {
  prompt_text: string;
  ai_response: string;
  brand_mentioned: boolean;
  mention_context?: string | null;
  created_at?: string;
}

type PromptDetailModalProps = {
  result: PromptDetail;
  brandName: string;
  onClose: () => void;
};

const ANIM_DURATION = 280;

export default function PromptDetailModal({
  result,
  brandName,
  onClose,
}: PromptDetailModalProps) {
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, ANIM_DURATION);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[49] bg-black/[0.18]',
          closing ? 'prompt-modal-overlay-exit' : 'prompt-modal-overlay-enter'
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'prompt-modal-panel fixed top-6 right-6 bottom-6 z-50 flex w-[480px] flex-col overflow-hidden rounded-sm border border-border-default bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)]',
          closing ? 'prompt-modal-exit' : 'prompt-modal-enter'
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-default px-6 pb-4 pt-5">
          <h2 className="m-0 text-base font-semibold text-text-heading">
            Hasil Prompt
          </h2>
          <button
            onClick={handleClose}
            className="flex items-center border-none bg-transparent p-1 text-text-muted cursor-pointer hover:text-text-heading"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            {/* User prompt bubble */}
            <div className="ml-auto mb-3 inline-block max-w-[85%] rounded-2xl rounded-br-xs bg-brand px-3.5 py-2.5 text-sm text-white shadow-sm">
              {result.prompt_text}
            </div>

            {/* Mention status badge */}
            <div className="mb-4 flex justify-end">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised py-1.5 pl-1.5 pr-3">
                {result.brand_mentioned ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-[13px] leading-4 font-medium text-text-heading">
                  {brandName}{' '}
                  {result.brand_mentioned
                    ? 'disebutkan'
                    : 'tidak disebutkan'}
                </span>
              </div>
            </div>

            {/* AI response */}
            <div className="whitespace-pre-wrap">
              {renderMarkdown(result.ai_response, brandName)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border-default px-6 py-3 text-center text-[11px] text-text-placeholder">
          Respons oleh GPT-4o dengan pencarian web ·{' '}
          {result.created_at
            ? new Date(result.created_at).toLocaleString('id-ID')
            : new Date().toLocaleString('id-ID')}
        </div>
      </div>
    </>
  );
}
