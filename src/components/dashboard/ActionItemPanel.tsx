import { IconArrowUpRight, IconSitemap, IconArticle, IconPencilCode } from '@tabler/icons-react';
import Link from 'next/link';

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
  high: { label: 'Prioritas tinggi', color: '#7C3AED', Icon: PriorityBarsHigh },
  medium: { label: 'Prioritas sedang', color: '#D97706', Icon: PriorityBarsMedium },
  low: { label: 'Prioritas rendah', color: '#374151', Icon: PriorityBarsLow },
};

const typeConfig: Record<string, { label: string; Icon: typeof IconSitemap }> = {
  meta: { label: 'Meta & struktur', Icon: IconSitemap },
  structure: { label: 'Meta & struktur', Icon: IconSitemap },
  content_gap: { label: 'Konten', Icon: IconArticle },
  web_copy: { label: 'Web copy', Icon: IconPencilCode },
};

export default function ActionItemPanel({ items, auditId }: ActionItemPanelProps) {
  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-subtle)',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          flexShrink: 0,
          padding: '0 20px',
        }}
      >
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-heading)',
          }}
        >
          Action Item
        </span>
        {auditId && (
          <Link
            href={`/audit/${auditId}/recommendations`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-heading)',
              textDecoration: 'none',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            Lihat semua
            <IconArrowUpRight size={14} stroke={2} />
          </Link>
        )}
      </div>

      <div style={{ height: '1px', background: 'var(--border-light)', flexShrink: 0 }} />

      {/* Items list */}
      <div
        className="scroll-subtle"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              padding: '24px 20px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
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
                style={{
                  padding: '16px 20px',
                  borderBottom:
                    idx < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
              >
                {/* Number + Title */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'var(--purple)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-heading)',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 400,
                        color: 'var(--text-muted)',
                        margin: '4px 0 0',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </p>

                    {/* Badges */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '10px',
                      }}
                    >
                      {/* Priority badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: priority.color,
                        }}
                      >
                        <priority.Icon />
                        {priority.label}
                      </span>

                      {/* Type badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                        }}
                      >
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
