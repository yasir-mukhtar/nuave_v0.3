'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  topicName: string;
  topicId: string;
  onClose: () => void;
  onSave: (prompt: { prompt_text: string; language: string; topic_id: string }) => void;
};

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Malaysia' },
];

export default function AddPromptDialog({ open, topicName, topicId, onClose, onSave }: Props) {
  const [promptText, setPromptText] = useState('');
  const [language, setLanguage] = useState('en');

  const handleSave = () => {
    if (!promptText.trim()) return;
    onSave({ prompt_text: promptText.trim(), language, topic_id: topicId });
    setPromptText('');
    setLanguage('en');
    onClose();
  };

  const handleClose = () => {
    setPromptText('');
    setLanguage('en');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent style={{ maxWidth: '480px' }}>
        <DialogHeader>
          <DialogTitle>Tambah Prompt</DialogTitle>
          <DialogDescription>
            Tambah prompt baru ke topik: <strong>{topicName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-heading, #111827)',
              marginBottom: '6px',
            }}>
              Teks Prompt
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="contoh: What are the best CRM tools for startups?"
              autoFocus
              rows={3}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                border: '1px solid var(--border-default, #E5E7EB)',
                borderRadius: 'var(--radius-sm)',
                background: '#ffffff',
                color: 'var(--text-body, #374151)',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-heading, #111827)',
              marginBottom: '6px',
            }}>
              Bahasa
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                border: '1px solid var(--border-default, #E5E7EB)',
                borderRadius: 'var(--radius-sm)',
                background: '#ffffff',
                color: 'var(--text-body, #374151)',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              {LANG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-body, #374151)',
                background: 'transparent',
                border: '1px solid var(--border-default, #E5E7EB)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!promptText.trim()}
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                background: promptText.trim() ? 'var(--purple, #533AFD)' : '#D1D5DB',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: promptText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Simpan
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
