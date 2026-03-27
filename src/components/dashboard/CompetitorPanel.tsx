'use client';

import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Competitor = {
  name: string;
  score: number;
  website_url?: string | null;
};

type CompetitorPanelProps = {
  competitors: Competitor[];
};

function getLogoUrl(comp: Competitor) {
  if (comp.website_url) {
    return `https://www.google.com/s2/favicons?domain=${comp.website_url}&sz=32`;
  }
  const domain = comp.name.toLowerCase().replace(/\s+/g, '') + '.com';
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
                <CompetitorLogo comp={comp} />
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

function CompetitorLogo({ comp }: { comp: Competitor }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = getLogoUrl(comp);

  if (failed) {
    return (
      <div className="w-6 h-6 rounded-sm bg-surface-raised flex items-center justify-center type-caption font-semibold text-text-muted shrink-0">
        {comp.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={comp.name}
      width={24}
      height={24}
      className="rounded-sm shrink-0 bg-surface-raised"
      onError={() => setFailed(true)}
    />
  );
}
