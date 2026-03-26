'use client';

import { IconPlus } from '@tabler/icons-react';

type Competitor = {
  name: string;
  score: number; // percentage of audit prompts where this competitor appeared
};

type CompetitorPanelProps = {
  competitors: Competitor[];
};

function getLogoUrl(name: string) {
  // Use Google favicon service as a best-effort logo
  const domain = name.toLowerCase().replace(/\s+/g, '') + '.com';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

function LogoFallback({ name }: { name: string }) {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 'var(--radius-sm)',
        background: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CompetitorPanel({ competitors }: CompetitorPanelProps) {
  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-subtle)',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '424px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          padding: '0 20px',
        }}
      >
        <span className="type-title text-text-heading">
          Kompetitor
        </span>
        <button
          className="type-body"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontWeight: 500,
            color: 'var(--text-heading)',
            background: 'none',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-subtle)',
            cursor: 'pointer',
          }}
        >
          Tambah
          <IconPlus size={14} stroke={2} />
        </button>
      </div>

      <div style={{ height: '1px', background: 'var(--border-light)', margin: '0' }} />

      {/* Competitor list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0px',
        }}
      >
        {competitors.length === 0 ? (
          <div
            className="type-body"
            style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}
          >
            Belum ada data kompetitor.
          </div>
        ) : (
          competitors.map((comp, idx) => (
            <div
              key={comp.name + idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderTop: idx > 0 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CompetitorLogo name={comp.name} />
                <span
                  className="type-body"
                  style={{ color: 'var(--text-body)' }}
                >
                  {comp.name}
                </span>
              </div>
              <span
                className="type-body"
                style={{ fontWeight: 500, color: 'var(--text-heading)' }}
              >
                {comp.score.toFixed(1)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CompetitorLogo({ name }: { name: string }) {
  const logoUrl = getLogoUrl(name);

  return (
    <img
      src={logoUrl}
      alt={name}
      width={24}
      height={24}
      style={{ borderRadius: 'var(--radius-sm)', flexShrink: 0, background: '#F3F4F6' }}
      onError={(e) => {
        const target = e.currentTarget;
        const parent = target.parentElement;
        if (parent) {
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.style.cssText =
            'width:24px;height:24px;border-radius:var(--radius-sm);background:#F3F4F6;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#6B7280;flex-shrink:0;';
          fallback.textContent = name.charAt(0).toUpperCase();
          parent.insertBefore(fallback, target);
        }
      }}
    />
  );
}
