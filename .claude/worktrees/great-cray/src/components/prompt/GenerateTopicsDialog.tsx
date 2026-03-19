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
  name: string;
  language: string;
  checked: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (topics: { name: string; language: string; is_ai_generated: boolean }[]) => void;
};

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Malaysia' },
];

const LANG_BADGES: Record<string, string> = { en: 'EN', id: 'ID', ms: 'MS' };

export default function GenerateTopicsDialog({ open, onClose, onSave }: Props) {
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleLang = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    // TODO: wire to POST /api/topics/generate when backend is ready
    // Simulating AI response with placeholder topics
    await new Promise((r) => setTimeout(r, 1200));
    const placeholders: Suggestion[] = languages.flatMap((lang) => [
      { name: lang === 'id' ? 'Rekomendasi alat terbaik' : lang === 'ms' ? 'Cadangan alat terbaik' : 'Best tool recommendations', language: lang, checked: true },
      { name: lang === 'id' ? 'Perbandingan produk' : lang === 'ms' ? 'Perbandingan produk' : 'Product comparisons', language: lang, checked: true },
      { name: lang === 'id' ? 'Solusi untuk bisnis kecil' : lang === 'ms' ? 'Penyelesaian perniagaan kecil' : 'Small business solutions', language: lang, checked: true },
    ]);
    setSuggestions(placeholders);
    setGenerated(true);
    setLoading(false);
  };

  const handleSave = () => {
    const selected = suggestions
      .filter((s) => s.checked)
      .map((s) => ({ name: s.name, language: s.language, is_ai_generated: true }));
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
            Generate Topik
          </DialogTitle>
          <DialogDescription>
            AI akan menyarankan topik berdasarkan profil brand Anda.
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          /* Language selection */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            <div>
              <p style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-heading, #111827)',
                margin: '0 0 8px 0',
              }}>
                Pilih bahasa
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {LANG_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${languages.includes(opt.value) ? 'var(--purple, #533AFD)' : 'var(--border-default, #E5E7EB)'}`,
                      background: languages.includes(opt.value) ? 'var(--purple-light, #F3F0FF)' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-body, #374151)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={languages.includes(opt.value)}
                      onChange={() => toggleLang(opt.value)}
                      style={{ accentColor: 'var(--purple, #533AFD)' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={languages.length === 0 || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                background: languages.length === 0 ? '#D1D5DB' : 'var(--purple, #533AFD)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: languages.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              {loading ? 'Menggenerate...' : 'Generate'}
            </button>
          </div>
        ) : (
          /* Suggestions */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {suggestions.map((s, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
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
                    style={{ accentColor: 'var(--purple, #533AFD)' }}
                  />
                  <span style={{
                    flex: 1,
                    fontSize: '13px',
                    color: 'var(--text-body, #374151)',
                  }}>
                    {s.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-xs)',
                    background: '#EDE9FF',
                    color: '#533AFD',
                  }}>
                    {LANG_BADGES[s.language] ?? s.language.toUpperCase()}
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
