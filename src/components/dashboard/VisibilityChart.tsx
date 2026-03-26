'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { IconChevronDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

type AuditDataPoint = {
  date: string; // ISO string
  score: number;
};

type VisibilityChartProps = {
  data: AuditDataPoint[];
  latestScore: number;
};

const filterOptions = [
  { label: '30 hari terakhir', days: 30 },
  { label: '2 minggu terakhir', days: 14 },
  { label: '1 minggu terakhir', days: 7 },
];

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Custom tooltip */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data || data.score == null) return null;

  const score = data.score;
  const change = data._change;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        padding: '10px 14px',
        minWidth: '140px',
      }}
    >
      <div className="type-caption" style={{ color: '#9CA3AF', marginBottom: '6px' }}>
        {formatDateFull(data.date)}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span className="type-body-lg font-bold text-text-heading">
          {score}%
        </span>
        {change != null && change !== 0 && (
          <span
            className="type-caption"
            style={{
              fontWeight: 600,
              color: change > 0 ? '#22C55E' : '#EF4444',
            }}
          >
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  );
}

const gridYTicks = [20, 40, 60, 80, 100];

export default function VisibilityChart({ data, latestScore }: VisibilityChartProps) {
  const [filterIdx, setFilterIdx] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownClosing, setDropdownClosing] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  function closeFilterDropdown() {
    setDropdownClosing(true);
    setTimeout(() => {
      setDropdownOpen(false);
      setDropdownClosing(false);
    }, 200);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        closeFilterDropdown();
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  const days = filterOptions[filterIdx].days;

  const filteredData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const sorted = data
      .filter((d) => new Date(d.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sorted.map((d, i) => ({
      ...d,
      ts: new Date(d.date).getTime(),
      _change: i > 0 ? d.score - sorted[i - 1].score : null,
    }));
  }, [data, days]);

  const isEmpty = filteredData.length === 0;
  const isSinglePoint = filteredData.length === 1;

  const xDomain = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    return [start.getTime(), now.getTime()] as [number, number];
  }, [days]);

  const xTicks = useMemo(() => {
    const tickCount = days <= 7 ? 7 : days <= 14 ? 7 : 6;
    const [start, end] = xDomain;
    const interval = (end - start) / (tickCount - 1);
    const ticks: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      ticks.push(Math.round(start + interval * i));
    }
    return ticks;
  }, [xDomain, days]);

  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-subtle)',
        background: '#ffffff',
        height: '424px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          flexShrink: 0,
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="type-heading-md">
            {latestScore}%
          </span>
          <span className="type-caption text-text-muted">
            AI visibility score
          </span>
        </div>

        {/* Filter dropdown */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button
            onClick={() => dropdownOpen ? closeFilterDropdown() : setDropdownOpen(true)}
            className="type-body flex items-center gap-1.5 px-3 py-1.5 font-[var(--btn-font-weight)] text-text-body bg-white border border-border-light rounded-[var(--btn-radius)] shadow-app-subtle cursor-pointer hover:border-border-default transition-colors"
          >
            {filterOptions[filterIdx].label}
            <IconChevronDown size={14} stroke={2} />
          </button>

          {dropdownOpen && (
            <div
              className={dropdownClosing ? "popover-down-out" : "popover-down"}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-modal)',
                overflow: 'hidden',
                zIndex: 20,
                minWidth: '160px',
              }}
            >
              {filterOptions.map((opt, idx) => (
                <button
                  key={opt.days}
                  onClick={() => { setFilterIdx(idx); closeFilterDropdown(); }}
                  className={cn(
                    "type-body block w-full px-3.5 py-2 text-left border-none cursor-pointer transition-colors",
                    idx === filterIdx
                      ? "font-semibold text-text-heading bg-surface-raised"
                      : "text-text-body bg-transparent hover:bg-surface"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--border-light)', flexShrink: 0 }} />

      {/* Chart area */}
      <div style={{ flex: 1, minHeight: 0, padding: '20px 24px 24px', position: 'relative' }}>
        {isEmpty ? (
          <EmptyChartState days={days} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#533AFD" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#533AFD" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                horizontal
                vertical={false}
                strokeDasharray="4 4"
                stroke="#E5E7EB"
                strokeOpacity={0.7}
              />
              <XAxis
                dataKey="ts"
                type="number"
                domain={xDomain}
                ticks={xTicks}
                tickFormatter={(ts) => formatDateShort(new Date(ts).toISOString())}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                dy={8}
              />
              <YAxis domain={[0, 100]} ticks={gridYTicks} hide />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={isSinglePoint ? 'transparent' : '#533AFD'}
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={isSinglePoint ? { r: 5, fill: '#533AFD', stroke: '#ffffff', strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: '#533AFD', stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={false}
              />
              {isSinglePoint && (
                <ReferenceLine
                  y={filteredData[0].score}
                  stroke="#533AFD"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/** Empty state: placeholder dashed grid lines + date labels + message */
function EmptyChartState({ days }: { days: number }) {
  const tickCount = days <= 7 ? 7 : days <= 14 ? 7 : 6;
  const now = new Date();
  const labels: string[] = [];
  for (let i = 0; i < tickCount; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - days + Math.round((days / (tickCount - 1)) * i));
    labels.push(formatDateShort(d.toISOString()));
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
        preserveAspectRatio="none"
      >
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            y1={`${(1 - ratio) * 100}%`}
            x2="100%"
            y2={`${(1 - ratio) * 100}%`}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
      </svg>
      {/* Date labels */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 4px',
        }}
      >
        {labels.map((label, i) => (
          <span key={i} className="type-caption" style={{ color: '#9CA3AF' }}>{label}</span>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <p className="type-body text-text-muted" style={{ margin: 0, textAlign: 'center' }}>
          Belum ada data audit.
        </p>
        <p className="type-caption text-text-placeholder" style={{ margin: 0, textAlign: 'center' }}>
          Jalankan audit pertama untuk melihat skor visibilitas Anda.
        </p>
      </div>
    </div>
  );
}
