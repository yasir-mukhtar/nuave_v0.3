'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { IconChevronDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { getFaviconUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type AuditDataPoint = {
  date: string; // ISO string
  score: number;
  competitors: Record<string, number>;
};

type ChartCompetitor = {
  name: string;
  score: number;
  website_url?: string | null;
};

type VisibilityChartProps = {
  data: AuditDataPoint[];
  latestScore: number;
  brandName: string;
  brandWebsiteUrl: string | null;
  competitors: ChartCompetitor[];
};

const filterOptions = [
  { label: '30 hari terakhir', days: 30 },
  { label: '2 minggu terakhir', days: 14 },
  { label: '1 minggu terakhir', days: 7 },
];

// Muted, distinguishable palette for competitor lines
const COMPETITOR_COLORS = [
  '#DC2626', // red
  '#6B7280', // gray
  '#2563EB', // blue
  '#D97706', // amber
  '#059669', // emerald
  '#7C3AED', // violet
  '#DB2777', // pink
  '#0891B2', // cyan
  '#CA8A04', // yellow
  '#4F46E5', // indigo
];

const BRAND_COLOR = '#533AFD';

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Peec AI-style tooltip showing all brands */
function ChartTooltip({
  active,
  payload,
  brandName,
  brandWebsiteUrl,
  competitorList,
  competitorColorMap,
}: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const brandScore = data.score;

  // Build entries: brand first, then competitors sorted by score desc
  type Entry = { name: string; score: number; color: string; websiteUrl?: string | null; isBrand: boolean };
  const entries: Entry[] = [
    { name: brandName, score: brandScore ?? 0, color: BRAND_COLOR, websiteUrl: brandWebsiteUrl, isBrand: true },
  ];

  for (const comp of competitorList) {
    const key = `comp_${comp.name}`;
    const score = data[key] ?? 0;
    entries.push({
      name: comp.name,
      score,
      color: competitorColorMap[comp.name] ?? '#9CA3AF',
      websiteUrl: comp.website_url,
      isBrand: false,
    });
  }

  // Sort all entries by score desc (brand ranks naturally among competitors)
  entries.sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white border border-border-light rounded-[var(--radius-sm)] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-3 min-w-[200px]">
      <div className="type-caption text-text-placeholder mb-2">
        {formatDateFull(data.date)}
      </div>
      <div className="flex flex-col gap-1.5">
        {entries.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <TooltipLogo name={entry.name} websiteUrl={entry.websiteUrl} />
              <span className="type-caption text-text-body truncate">
                {entry.name}
              </span>
            </div>
            <span className="type-caption font-semibold text-text-heading tabular-nums shrink-0">
              {entry.score.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TooltipLogo({ name, websiteUrl }: { name: string; websiteUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = getFaviconUrl(name, websiteUrl);

  if (failed) {
    return (
      <div className="w-4 h-4 rounded-[3px] bg-surface-raised flex items-center justify-center shrink-0">
        <span className="text-[8px] font-semibold text-text-muted leading-none">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt=""
      width={16}
      height={16}
      className="rounded-[3px] shrink-0 bg-surface-raised"
      onError={() => setFailed(true)}
    />
  );
}

const gridYTicks = [0, 25, 50, 75, 100];

export default function VisibilityChart({
  data,
  latestScore,
  brandName,
  brandWebsiteUrl,
  competitors,
}: VisibilityChartProps) {
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

  // Assign stable colors to competitors
  const competitorColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    competitors.forEach((c, i) => {
      map[c.name] = COMPETITOR_COLORS[i % COMPETITOR_COLORS.length];
    });
    return map;
  }, [competitors]);

  const filteredData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const sorted = data
      .filter((d) => new Date(d.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sorted.map((d) => {
      const point: Record<string, any> = {
        date: d.date,
        ts: new Date(d.date).getTime(),
        score: d.score,
      };
      // Flatten competitor scores into the data point
      for (const comp of competitors) {
        point[`comp_${comp.name}`] = d.competitors[comp.name] ?? 0;
      }
      return point;
    });
  }, [data, days, competitors]);

  const isEmpty = filteredData.length === 0;

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

  const tooltipContent = useCallback(
    (props: any) => (
      <ChartTooltip
        {...props}
        brandName={brandName}
        brandWebsiteUrl={brandWebsiteUrl}
        competitorList={competitors}
        competitorColorMap={competitorColorMap}
      />
    ),
    [brandName, brandWebsiteUrl, competitors, competitorColorMap]
  );

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
            <LineChart
              data={filteredData}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
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
              <YAxis
                domain={[0, 100]}
                ticks={gridYTicks}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                width={45}
              />
              <Tooltip
                content={tooltipContent}
                cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              {/* Competitor lines (render first so brand line is on top) */}
              {competitors.map((comp) => (
                <Line
                  key={comp.name}
                  type="monotone"
                  dataKey={`comp_${comp.name}`}
                  stroke={competitorColorMap[comp.name]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4, fill: competitorColorMap[comp.name], stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls={false}
                />
              ))}
              {/* Brand line (on top, thicker) */}
              <Line
                type="monotone"
                dataKey="score"
                stroke={BRAND_COLOR}
                strokeWidth={2.5}
                dot={filteredData.length === 1 ? { r: 5, fill: BRAND_COLOR, stroke: '#ffffff', strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: BRAND_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
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
