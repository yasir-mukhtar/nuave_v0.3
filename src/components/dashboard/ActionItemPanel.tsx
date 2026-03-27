import { IconArrowUpRight } from '@tabler/icons-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ActionItem = {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  problem_type: string;
};

type ActionItemPanelProps = {
  items: ActionItem[];
  auditId?: string;
};

const severityConfig = {
  high:   { label: 'Severity tinggi',  bg: '#FEE2E2', color: '#DC2626' },
  medium: { label: 'Severity sedang',  bg: '#FEF3C7', color: '#D97706' },
  low:    { label: 'Severity rendah',  bg: '#F3F4F6', color: '#6B7280' },
};

function formatProblemType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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
            Belum ada masalah terdeteksi.
          </div>
        ) : (
          items.map((item, idx) => {
            const severity = severityConfig[item.severity] ?? severityConfig.low;

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
                      <span
                        className="type-caption inline-flex items-center gap-1 font-medium rounded-full px-2 py-0.5"
                        style={{ backgroundColor: severity.bg, color: severity.color }}
                      >
                        {severity.label}
                      </span>
                      {item.problem_type && (
                        <span className="type-caption inline-flex items-center gap-1 font-medium text-text-muted">
                          {formatProblemType(item.problem_type)}
                        </span>
                      )}
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
