'use client';

import { useState } from 'react';
import { IconSparkles, IconRefresh } from '@tabler/icons-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Suggestion = {
  prompt_text: string;
  language: string;
  checked: boolean;
};

type Props = {
  open: boolean;
  topicName: string;
  topicId: string;
  onClose: () => void;
  onSave: (prompts: { prompt_text: string; language: string; topic_id: string }[]) => void;
};

export default function GeneratePromptsDialog({ open, topicName, topicId, onClose, onSave }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    // TODO: wire to POST /api/prompts/generate when backend is ready
    await new Promise((r) => setTimeout(r, 1200));
    const placeholders: Suggestion[] = [
      { prompt_text: `What are the best options for ${topicName.toLowerCase()}?`, language: 'en', checked: true },
      { prompt_text: `How do I choose the right ${topicName.toLowerCase()} solution?`, language: 'en', checked: true },
      { prompt_text: `Top rated ${topicName.toLowerCase()} tools in 2026`, language: 'en', checked: true },
      { prompt_text: `Compare popular ${topicName.toLowerCase()} platforms`, language: 'en', checked: true },
      { prompt_text: `${topicName} recommendations for small businesses`, language: 'en', checked: true },
    ];
    setSuggestions(placeholders);
    setGenerated(true);
    setLoading(false);
  };

  const handleSave = () => {
    const selected = suggestions
      .filter((s) => s.checked)
      .map((s) => ({ prompt_text: s.prompt_text, language: s.language, topic_id: topicId }));
    if (selected.length > 0) {
      onSave(selected);
    }
    setSuggestions([]);
    setGenerated(false);
    onClose();
  };

  const handleClose = () => {
    setSuggestions([]);
    setGenerated(false);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent style={{ maxWidth: '520px' }}>
        <DialogHeader>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconSparkles size={18} stroke={2} style={{ color: 'var(--purple, #533AFD)' }} />
            Generate Prompt
          </DialogTitle>
          <DialogDescription>
            Generate prompt AI untuk topik: <strong>{topicName}</strong>
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          <div style={{ padding: '8px 0' }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                background: 'var(--purple, #533AFD)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {loading ? 'Menggenerate...' : 'Generate 5 Prompt'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {suggestions.map((s, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface, #F9FAFB)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <input
                    type="checkbox"
                    checked={s.checked}
                    onChange={() => {
                      setSuggestions((prev) =>
                        prev.map((item, j) => j === i ? { ...item, checked: !item.checked } : item)
                      );
                    }}
                    style={{ accentColor: 'var(--purple, #533AFD)', marginTop: '2px' }}
                  />
                  <span style={{
                    flex: 1,
                    fontSize: '13px',
                    color: 'var(--text-body, #374151)',
                    lineHeight: 1.4,
                  }}>
                    {s.prompt_text}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-body, #374151)',
                  background: 'transparent',
                  border: '1px solid var(--border-default, #E5E7EB)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <IconRefresh size={14} stroke={2} />
                {loading ? 'Menggenerate...' : 'Regenerate'}
              </button>
              <button
                onClick={handleSave}
                disabled={suggestions.filter((s) => s.checked).length === 0}
                style={{
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: suggestions.some((s) => s.checked) ? 'var(--purple, #533AFD)' : '#D1D5DB',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: suggestions.some((s) => s.checked) ? 'pointer' : 'not-allowed',
                }}
              >
                Simpan Terpilih ({suggestions.filter((s) => s.checked).length})
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
