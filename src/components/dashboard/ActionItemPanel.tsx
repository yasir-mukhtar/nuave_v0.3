import { IconArrowUpRight, IconSitemap, IconArticle, IconPencilCode } from '@tabler/icons-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ActionItem = {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: string; // 'web_copy' | 'meta' | 'structure' | 'content_gap'
};

type ActionItemPanelProps = {
  items: ActionItem[];
  auditId?: string;
};

function PriorityBarsHigh() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="9" width="2.5" height="4" rx="0.5" fill="currentColor" />
      <rect x="5" y="5" width="2.5" height="8" rx="0.5" fill="currentColor" />
      <rect x="9" y="1" width="2.5" height="12" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function PriorityBarsMedium() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="9" width="2.5" height="4" rx="0.5" fill="currentColor" />
      <rect x="5" y="5" width="2.5" height="8" rx="0.5" fill="currentColor" />
      <rect x="9" y="1" width="2.5" height="12" rx="0.5" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function PriorityBarsLow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="9" width="2.5" height="4" rx="0.5" fill="currentColor" />
      <rect x="5" y="5" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.25" />
      <rect x="9" y="1" width="2.5" height="12" rx="0.5" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

const priorityConfig = {
  high:   { label: 'Prioritas tinggi',  textClass: 'text-brand',       Icon: PriorityBarsHigh },
  medium: { label: 'Prioritas sedang',  textClass: 'text-warning',     Icon: PriorityBarsMedium },
  low:    { label: 'Prioritas rendah',  textClass: 'text-text-body',   Icon: PriorityBarsLow },
};

const typeConfig: Record<string, { label: string; Icon: typeof IconSitemap }> = {
  meta:        { label: 'Meta & struktur', Icon: IconSitemap },
  structure:   { label: 'Meta & struktur', Icon: IconSitemap },
  content_gap: { label: 'Konten',          Icon: IconArticle },
  web_copy:    { label: 'Web copy',        Icon: IconPencilCode },
};

export default function ActionItemPanel({ items, auditId }: ActionItemPanelProps) {
  return (
    <div className="border border-border-light rounded-[var(--radius-sm)] shadow-app-subtle bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between h-14 shrink-0 px-5">
        <span className="type-title text-text-heading">
          Action Item
        </span>
        {auditId && (
          <Link
            href="/content"
            className="type-body flex items-center gap-1 px-3 py-1.5 font-[var(--btn-font-weight)] text-text-heading no-underline border border-border-light rounded-[var(--radius-sm)] shadow-app-subtle hover:border-border-default transition-colors"
          >
            Lihat semua
            <IconArrowUpRight size={14} stroke={2} />
          </Link>
        )}
      </div>

      <div className="h-px bg-[var(--border-light)] shrink-0" />

      {/* Items list */}
      <div className="scroll-subtle flex-1 overflow-y-auto py-1">
        {items.length === 0 ? (
          <div className="type-body py-6 px-5 text-center text-text-muted">
            Belum ada action item.
          </div>
        ) : (
          items.map((item, idx) => {
            const priority = priorityConfig[item.priority] ?? priorityConfig.low;
            const typeInfo = typeConfig[item.type] ?? typeConfig.web_copy;
            const TypeIcon = typeInfo.Icon;

            return (
              <div
                key={idx}
                className={cn(
                  "px-5 py-4",
                  idx < items.length - 1 && "border-b border-[#F3F4F6]"
                )}
              >
                {/* Number + Title */}
                <div className="flex items-start gap-2.5">
                  <span className="w-[22px] h-[22px] rounded-full bg-brand text-white flex items-center justify-center text-[11px] font-semibold shrink-0 mt-px">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="type-body font-semibold text-text-heading m-0">
                      {item.title}
                    </p>
                    <p className="type-caption text-text-muted mt-1 m-0 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className={cn("type-caption inline-flex items-center gap-1 font-medium", priority.textClass)}>
                        <priority.Icon />
                        {priority.label}
                      </span>
                      <span className="type-caption inline-flex items-center gap-1 font-medium text-text-muted">
                        <TypeIcon size={14} stroke={1.5} />
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
