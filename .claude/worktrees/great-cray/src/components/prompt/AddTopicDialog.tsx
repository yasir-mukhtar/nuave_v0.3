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
  onClose: () => void;
  onSave: (topic: { name: string; language: string; is_ai_generated: boolean }) => void;
};

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Malaysia' },
];

export default function AddTopicDialog({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), language, is_ai_generated: false });
    setName('');
    setLanguage('en');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setLanguage('en');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent style={{ maxWidth: '440px' }}>
        <DialogHeader>
          <DialogTitle>Tambah Topik</DialogTitle>
          <DialogDescription>
            Buat topik baru untuk mengelompokkan prompt.
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
              Nama Topik
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Rekomendasi CRM terbaik"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
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
              disabled={!name.trim()}
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                background: name.trim() ? 'var(--purple, #533AFD)' : '#D1D5DB',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
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
