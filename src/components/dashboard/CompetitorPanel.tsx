'use client';

import { IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export default function CompetitorPanel({ competitors }: CompetitorPanelProps) {
  return (
    <div className="border border-border-light rounded-[var(--radius-sm)] shadow-app-subtle bg-white flex flex-col h-[424px]">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-5 shrink-0">
        <span className="type-title text-text-heading">
          Kompetitor
        </span>
        <Button variant="default">
          Tambah
          <IconPlus size={14} stroke={2} />
        </Button>
      </div>

      <div className="h-px bg-[var(--border-light)]" />

      {/* Competitor list */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col">
        {competitors.length === 0 ? (
          <div className="type-body py-6 text-center text-text-muted">
            Belum ada data kompetitor.
          </div>
        ) : (
          competitors.map((comp, idx) => (
            <div
              key={comp.name + idx}
              className={cn(
                "flex items-center justify-between py-2.5",
                idx > 0 && "border-t border-[#F3F4F6]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <CompetitorLogo name={comp.name} />
                <span className="type-body text-text-body">
                  {comp.name}
                </span>
              </div>
              <span className="type-body font-medium text-text-heading">
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
      className="rounded-[var(--radius-sm)] shrink-0 bg-[#F3F4F6]"
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
