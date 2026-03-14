'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  IconX,
  IconCircleCheckFilled,
  IconCircleXFilled,
} from '@tabler/icons-react';

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

function highlightBrand(text: string, brand: string) {
  if (!brand || !text) return [<span key={0}>{text}</span>];
  const regex = new RegExp(`(${brand})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        style={{
          background: '#EDE9FF',
          color: '#533AFD',
          fontWeight: 500,
          borderRadius: '3px',
          padding: '0 2px',
          fontStyle: 'normal',
        }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function renderInline(text: string, brand: string) {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 600 }}>
          {highlightBrand(part.slice(2, -2), brand)}
        </strong>
      );
    }
    return <span key={i}>{highlightBrand(part, brand)}</span>;
  });
}

function renderMarkdown(text: string, brand: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.match(/^#{1,3}\s/)) {
      const content = line.replace(/^#{1,3}\s/, '');
      return (
        <p
          key={i}
          className="text-label-14"
          style={{
            fontWeight: 600,
            color: '#111827',
            marginTop: '12px',
            marginBottom: '4px',
          }}
        >
          {renderInline(content, brand)}
        </p>
      );
    }
    if (line.match(/^[\-\*•]\s/)) {
      const content = line.replace(/^[\-\*•]\s/, '');
      return (
        <div
          key={i}
          className="text-copy-14"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '4px',
            color: '#374151',
          }}
        >
          <span style={{ color: '#533AFD', flexShrink: 0 }}>•</span>
          <span>{renderInline(content, brand)}</span>
        </div>
      );
    }
    if (line.match(/^---/)) {
      return (
        <hr
          key={i}
          style={{
            border: 'none',
            borderTop: '1px solid #E5E7EB',
            margin: '12px 0',
          }}
        />
      );
    }
    if (line.trim() === '') {
      return <div key={i} style={{ height: '8px' }} />;
    }
    return (
      <p
        key={i}
        className="text-copy-14"
        style={{
          color: '#374151',
          marginBottom: '4px',
        }}
      >
        {renderInline(line, brand)}
      </p>
    );
  });
}

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
      <style>{`
        @keyframes promptModalPanelIn {
          from {
            opacity: 0;
            filter: blur(8px);
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            filter: blur(0px);
            transform: translateX(0);
          }
        }
        @keyframes promptModalPanelOut {
          from {
            opacity: 1;
            filter: blur(0px);
            transform: translateX(0);
          }
          to {
            opacity: 0;
            filter: blur(8px);
            transform: translateX(100%);
          }
        }
        @keyframes promptModalOverlayIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(2px); }
        }
        @keyframes promptModalOverlayOut {
          from { opacity: 1; backdrop-filter: blur(2px); }
          to   { opacity: 0; backdrop-filter: blur(0px); }
        }
        .prompt-modal-overlay-enter {
          animation: promptModalOverlayIn ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .prompt-modal-overlay-exit {
          animation: promptModalOverlayOut ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .prompt-modal-enter {
          animation: promptModalPanelIn ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .prompt-modal-exit {
          animation: promptModalPanelOut ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 768px) {
          .prompt-modal-panel {
            width: 100vw !important;
            height: 85vh !important;
            bottom: 0 !important;
            top: auto !important;
            right: 0 !important;
            left: 0 !important;
            border-radius: 6px 6px 0 0 !important;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        className={closing ? 'prompt-modal-overlay-exit' : 'prompt-modal-overlay-enter'}
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.18)',
          zIndex: 49,
        }}
      />

      {/* Panel */}
      <div
        className={`prompt-modal-panel ${closing ? 'prompt-modal-exit' : 'prompt-modal-enter'}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: '24px',
          right: '24px',
          bottom: '24px',
          width: '480px',
          background: '#FFFFFF',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          zIndex: 50,
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '20px 24px 16px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
            }}
          >
            Hasil Prompt
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconX size={18} stroke={1.5} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* User prompt bubble */}
            <div
              className="text-label-14"
              style={{
                marginLeft: 'auto',
                background: 'var(--purple)',
                color: 'white',
                borderRadius: '18px 18px 4px 18px',
                padding: '10px 14px',
                maxWidth: '85%',
                display: 'inline-block',
                marginBottom: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {result.prompt_text}
            </div>

            {/* Mention status badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#F4F4F4',
                  borderRadius: '999px',
                  padding: '6px 12px 6px 6px',
                }}
              >
                {result.brand_mentioned ? (
                  <IconCircleCheckFilled size={20} color="#16A34A" />
                ) : (
                  <IconCircleXFilled size={20} color="#DC2626" />
                )}
                <span
                  className="text-label-13"
                  style={{
                    fontWeight: 500,
                    color: '#111827',
                  }}
                >
                  {brandName}{' '}
                  {result.brand_mentioned
                    ? 'disebutkan'
                    : 'tidak disebutkan'}
                </span>
              </div>
            </div>

            {/* AI response */}
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {renderMarkdown(result.ai_response, brandName)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 24px',
            borderTop: '1px solid #E5E7EB',
            fontSize: '11px',
            color: '#9CA3AF',
            textAlign: 'center',
          }}
        >
          Respons oleh GPT-4o dengan pencarian web ·{' '}
          {result.created_at
            ? new Date(result.created_at).toLocaleString('id-ID')
            : new Date().toLocaleString('id-ID')}
        </div>
      </div>
    </>
  );
}
