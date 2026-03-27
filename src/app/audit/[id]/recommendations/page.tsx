'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AuditProblem } from '@/types';

const severityConfig: Record<string, { label: string; className: string }> = {
  high:   { label: 'Tinggi',  className: 'bg-[#FEE2E2] text-error' },
  medium: { label: 'Sedang',  className: 'bg-[#FEF3C7] text-warning' },
  low:    { label: 'Rendah',  className: 'bg-surface-raised text-text-muted' },
};

const statusConfig: Record<string, { label: string; dotClass: string }> = {
  unresolved:  { label: 'Belum selesai',      dotClass: 'bg-error' },
  in_progress: { label: 'Sedang dikerjakan',  dotClass: 'bg-warning' },
  resolved:    { label: 'Selesai',            dotClass: 'bg-success' },
};

export default function ProblemsPage() {
  const router = useRouter();
  const params = useParams();
  const auditId = params.id as string;

  const [problems, setProblems] = useState<AuditProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const supabase = createSupabaseBrowserClient();

    async function fetchProblems() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_problems')
          .select('*')
          .eq('audit_id', auditId)
          .order('severity', { ascending: true }) // high sorts first alphabetically before low/medium — use custom sort below
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          // Sort by severity: high → medium → low
          const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
          const sorted = [...data].sort((a, b) =>
            (order[a.severity ?? 'low'] ?? 2) - (order[b.severity ?? 'low'] ?? 2)
          );
          setProblems(sorted);
          setLoading(false);
          return;
        }

        // No problems yet — poll for background extraction
        setLoading(false);
        setPolling(true);

        const interval = setInterval(async () => {
          const { data: fresh } = await supabase
            .from('audit_problems')
            .select('*')
            .eq('audit_id', auditId);

          if (fresh && fresh.length > 0) {
            const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
            const sorted = [...fresh].sort((a, b) =>
              (order[a.severity ?? 'low'] ?? 2) - (order[b.severity ?? 'low'] ?? 2)
            );
            setProblems(sorted);
            setPolling(false);
            clearInterval(interval);
          }
        }, 3000);

        const timeout = setTimeout(() => {
          clearInterval(interval);
          setPolling(false);
        }, 60000);

        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
        };
      } catch {
        setLoading(false);
      }
    }

    fetchProblems();
  }, [auditId]);

  return (
    <div className="min-h-screen bg-page">
      {/* TOPBAR */}
      <div className="sticky top-0 z-10 bg-white border-b border-border-default px-8 py-4 flex justify-between items-center">
        <button
          onClick={() => router.push(`/audit/${auditId}/results`)}
          className="flex items-center gap-2 type-body font-[var(--btn-font-weight)] text-text-muted bg-transparent border-none cursor-pointer hover:text-text-body transition-colors"
        >
          <IconArrowLeft size={18} stroke={1.5} /> Kembali ke hasil
        </button>

        <Button variant="brand" onClick={() => router.push('/content')}>
          Kerjakan di Rekomendasi <IconArrowRight size={18} stroke={1.5} />
        </Button>
      </div>

      {/* CONTENT */}
      <div className="px-8 pt-8">
        <h1 className="text-[24px] m-0 mb-2">
          Masalah yang ditemukan
        </h1>
        <p className="type-body text-text-muted m-0 mb-6">
          Berikut masalah visibilitas AI yang terdeteksi dari audit ini
        </p>

        {/* PROBLEM CARDS */}
        <div className="grid grid-cols-1 gap-3">
          {loading || (problems.length === 0 && polling) ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card h-[100px] animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-[60px] h-[22px] rounded-[var(--radius-sm)] bg-surface-raised" />
                  </div>
                  <div className="w-[70%] h-5 rounded-[var(--radius-sm)] bg-surface-raised mb-2.5" />
                </div>
              ))}
              <p className="type-caption text-text-muted text-center mt-4">
                {polling ? "Menganalisis masalah..." : "Memuat masalah..."}
              </p>
            </>
          ) : problems.length === 0 ? (
            <div className="text-center py-[60px] text-text-muted">
              <p>Tidak ada masalah yang terdeteksi dari audit ini.</p>
            </div>
          ) : (
            problems.map((problem) => {
              const severity = severityConfig[problem.severity ?? 'low'] ?? severityConfig.low;
              const status = statusConfig[problem.status] ?? statusConfig.unresolved;

              return (
                <div key={problem.id} className="card flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", severity.className)}>
                      Severity {severity.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", status.dotClass)} />
                      <span className="type-caption text-text-muted">{status.label}</span>
                    </div>
                  </div>

                  <h3 className="text-[16px] m-0 mt-2 mb-1.5">{problem.title}</h3>

                  <p className="type-body text-text-muted leading-relaxed m-0">
                    {problem.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
