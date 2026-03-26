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
import { Button } from '@/components/ui/button';

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
    <div className="bg-white border border-border-light rounded-[var(--radius-sm)] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-2.5 px-3.5 min-w-[140px]">
      <div className="type-caption text-text-placeholder mb-1.5">
        {formatDateFull(data.date)}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="type-body-lg font-bold text-text-heading">
          {score}%
        </span>
        {change != null && change !== 0 && (
          <span className={cn("type-caption font-semibold", change > 0 ? "text-success" : "text-error")}>
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
    <div className="border border-border-light rounded-[var(--radius-sm)] shadow-app-subtle bg-white h-[424px] flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between h-14 shrink-0 px-6">
        <div className="flex items-baseline gap-2">
          <span className="type-heading-md">
            {latestScore}%
          </span>
          <span className="type-caption text-text-muted">
            AI visibility score
          </span>
        </div>

        {/* Filter dropdown */}
        <div ref={filterRef} className="relative">
          <Button
            variant="default"
            onClick={() => dropdownOpen ? closeFilterDropdown() : setDropdownOpen(true)}
          >
            {filterOptions[filterIdx].label}
            <IconChevronDown size={14} stroke={2} />
          </Button>

          {dropdownOpen && (
            <div
              className={cn(
                "absolute top-full right-0 mt-1 bg-white border border-border-light rounded-[var(--radius-sm)] shadow-[var(--shadow-modal)] overflow-hidden z-20 min-w-[160px]",
                dropdownClosing ? "popover-down-out" : "popover-down"
              )}
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

      <div className="h-px bg-[var(--border-light)] shrink-0" />

      {/* Chart area */}
      <div className="flex-1 min-h-0 p-5 px-6 pb-6 relative">
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
    <div className="w-full h-full relative flex flex-col">
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
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
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {labels.map((label, i) => (
          <span key={i} className="type-caption text-text-placeholder">{label}</span>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <p className="type-body text-text-muted m-0 text-center">
          Belum ada data audit.
        </p>
        <p className="type-caption text-text-placeholder m-0 text-center">
          Jalankan audit pertama untuk melihat skor visibilitas Anda.
        </p>
      </div>
    </div>
  );
}
