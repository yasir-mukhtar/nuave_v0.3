'use client';

import { IconClock } from '@tabler/icons-react';

export default function ResponseHistoryTimeline() {
  return (
    <div style={{
      border: '1px solid var(--border-default, #E5E7EB)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      background: '#FAFAFA',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* "Coming soon" overlay */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '16px',
      }}>
        <IconClock size={16} stroke={1.5} style={{ color: 'var(--text-muted, #9CA3AF)' }} />
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-heading, #111827)',
        }}>
          Riwayat Respons
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: '#FEF3C7',
          color: '#D97706',
        }}>
          Segera hadir
        </span>
      </div>

      {/* Placeholder timeline entries */}
      <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '12px',
              paddingBottom: '12px',
              marginBottom: '12px',
              borderBottom: i < 3 ? '1px solid var(--border-default, #E5E7EB)' : 'none',
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#D1D5DB',
              marginTop: '4px',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                height: '10px',
                width: '80px',
                background: '#E5E7EB',
                borderRadius: '4px',
                marginBottom: '6px',
              }} />
              <div style={{
                height: '10px',
                width: '160px',
                background: '#E5E7EB',
                borderRadius: '4px',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
