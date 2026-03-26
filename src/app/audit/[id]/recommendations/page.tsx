'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  IconSparkles,
  IconCopy,
  IconArrowLeft
} from '@tabler/icons-react';
import { ButtonSpinner } from "@/components/ButtonSpinner";
import { cn } from "@/lib/utils";
import { createBrowserClient } from '@supabase/ssr';

interface Recommendation {
  id: string;
  type: 'web_copy' | 'content_gap' | 'structure' | 'meta_structure';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggested_copy?: string;
  page_target?: string;
}

export default function RecommendationsPage() {
  const router = useRouter();
  const params = useParams();
  const auditId = params.id as string;
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'web_copy' | 'content_gap' | 'structure'>('all');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [brandName, setBrandName] = useState('Brand');
  
  const initialFetchRef = useRef(false);

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchData() {
      if (!auditId) return;
      setLoading(true);

      try {
        // 1. Fetch User Credits
        fetch('/api/user/credits')
          .then(res => res.json())
          .then(data => { if (data.credits !== null) setCredits(data.credits); });

        // 2. Fetch Brand Name
        const profileStr = sessionStorage.getItem('nuave_profile');
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          if (profile.profile?.brand_name) setBrandName(profile.profile.brand_name);
        } else {
          supabase
            .from('audits')
            .select('brands(name)')
            .eq('id', auditId)
            .single()
            .then(({ data }) => {
              const brand = (data?.brands as any)?.name;
              if (brand) setBrandName(brand);
            });
        }

        // Always call the API — loading screen plays every visit
        // The API returns cached results instantly if they exist
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audit_id: auditId }),
        });
        const data = await res.json();
        const recs = data.recommendations || [];
        setRecommendations(recs);

        // Restore any already-revealed fixes
        const revealed = new Set<string>();
        recs.forEach((rec: Recommendation) => {
          if (rec.suggested_copy) revealed.add(rec.id);
        });
        setRevealedIds(revealed);
      } catch (error) {
        console.error('Data fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [auditId]);

  // Polling logic for background generation
  useEffect(() => {
    if (!loading && recommendations.length === 0 && !polling) {
      setPolling(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const interval = setInterval(async () => {
        // v3: resolve audit → brand_id, then fetch brand-level recommendations
        const { data: audit } = await supabase
          .from('audits')
          .select('brand_id')
          .eq('id', auditId)
          .single();

        if (!audit) return;

        const { data: fresh } = await supabase
          .from('recommendations')
          .select('*')
          .eq('brand_id', audit.brand_id)
          .order('created_at', { ascending: true });

        if (fresh && fresh.length > 0) {
          setRecommendations(fresh);
          const revealed = new Set<string>();
          fresh.forEach((rec: Recommendation) => {
            if (rec.suggested_copy) revealed.add(rec.id);
          });
          setRevealedIds(revealed);
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
    }
  }, [loading, recommendations.length, polling, auditId]);

  async function handleReveal(recId: string) {
    setRevealingId(recId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const res = await fetch('/api/recommendations/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: recId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();

      if (data.suggested_copy) {
        setRevealedIds(prev => new Set([...prev, recId]));
        setRecommendations(prev =>
          prev.map(r => r.id === recId
            ? { ...r, suggested_copy: data.suggested_copy }
            : r
          )
        );

        if (typeof credits === 'number') {
          setCredits(Math.max(0, credits - 1));
        }
      }
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error('Reveal request timed out');
      } else {
        console.error('Failed to reveal recommendation:', error);
      }
    } finally {
      setRevealingId(null);
    }
  }

  function renderMarkdown(text: string) {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.match(/^#{1,3}\s/)) {
        const content = line.replace(/^#{1,3}\s/, '');
        return (
          <p key={i} className="type-body font-semibold text-text-heading mt-2.5 mb-0.5 m-0">
            {content}
          </p>
        );
      }
      if (line.match(/^[\-\*•]\s/)) {
        const content = line.replace(/^[\-\*•]\s/, '');
        return (
          <div key={i} className="flex gap-2 mb-0.5 type-body">
            <span className="text-brand shrink-0">•</span>
            <span dangerouslySetInnerHTML={{
              __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />
          </div>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-[6px]" />;
      return (
        <p key={i} className="type-body leading-[1.7] mb-0.5 m-0"
          dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          }} />
      );
    });
  }

  const filteredRecommendations = recommendations.filter(rec => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'structure') return rec.type === 'structure' || rec.type === 'meta_structure';
    return rec.type === activeFilter;
  });

  const priorityBadgeConfig: Record<string, { label: string; className: string }> = {
    high:   { label: 'Tinggi',  className: 'bg-[#FEE2E2] text-error' },
    medium: { label: 'Sedang',  className: 'bg-[#FEF3C7] text-warning' },
    low:    { label: 'Rendah',  className: 'bg-surface-raised text-text-muted' },
  };

  const typeBadgeConfig: Record<string, { label: string; className: string }> = {
    web_copy:       { label: 'Web Copy',         className: 'bg-[#EDE9FF] text-brand' },
    content_gap:    { label: 'Content Gap',      className: 'bg-[#DCFCE7] text-success' },
    structure:      { label: 'Meta & Structure', className: 'bg-[#DBEAFE] text-[#2563EB]' },
    meta_structure: { label: 'Meta & Structure', className: 'bg-[#DBEAFE] text-[#2563EB]' },
  };

  return (
    <div className="min-h-screen bg-page">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* TOPBAR */}
      <div className="sticky top-0 z-10 bg-white border-b border-border-default px-8 py-4 flex justify-between items-center">
        <button
          onClick={() => router.push(`/audit/${auditId}/results`)}
          className="flex items-center gap-2 type-body font-[var(--btn-font-weight)] text-text-muted bg-transparent border-none cursor-pointer hover:text-text-body transition-colors"
        >
          <IconArrowLeft size={18} stroke={1.5} /> Kembali ke hasil
        </button>

        <div className="type-body font-semibold text-text-heading">
          {brandName} <span className="text-text-muted font-normal">Rekomendasi</span>
        </div>

        <div className="bg-surface-raised px-3 py-1.5 rounded-full type-caption font-semibold text-text-body">
          {credits !== null ? credits : '—'} kredit
        </div>
      </div>

      {/* HERO */}
      <div className="px-8 pt-8">
        <h1 className="text-[24px] m-0 mb-2">
          Begini cara agar ChatGPT menyebut bisnis kamu
        </h1>
        <p className="type-body text-text-muted m-0">
          Perbaiki isu-isu ini untuk meningkatkan visibility score AI kamu
        </p>

        {/* FILTER TABS */}
        <div className="flex gap-2 mt-5">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'web_copy', label: 'Web Copy' },
            { id: 'content_gap', label: 'Content Gaps' },
            { id: 'structure', label: 'Meta & Structure' }
          ].map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={cn(
                  "type-caption font-[var(--btn-font-weight)] rounded-full px-4 py-1.5 border-none cursor-pointer transition-colors",
                  isActive ? "bg-brand text-white" : "bg-surface-raised text-text-body hover:bg-surface"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RECOMMENDATIONS GRID */}
      <div className="px-8 py-6 grid grid-cols-1 gap-3">
        {loading || (recommendations.length === 0 && polling) ? (
          <>
            {[1,2,3,4].map((i) => (
              <div key={i} className="card h-[120px] animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-[60px] h-[22px] rounded-[var(--radius-sm)] bg-surface-raised" />
                  <div className="w-[80px] h-[22px] rounded-[var(--radius-sm)] bg-surface-raised" />
                </div>
                <div className="w-[70%] h-5 rounded-[var(--radius-sm)] bg-surface-raised mb-2.5" />
              </div>
            ))}
            <p className="type-caption text-text-muted text-center mt-4">
              {polling ? "Menyiapkan rekomendasi kamu..." : "Memuat rekomendasi..."}
            </p>
          </>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-[60px] text-text-muted">
            <p>Tidak ada rekomendasi untuk audit ini.</p>
          </div>
        ) : (
          filteredRecommendations.map(rec => {
            const priorityInfo = priorityBadgeConfig[rec.priority] ?? priorityBadgeConfig.low;
            const typeInfo = typeBadgeConfig[rec.type] ?? { label: rec.type, className: 'bg-surface-raised text-text-body' };
            const isRevealed = revealedIds.has(rec.id);

            return (
              <div key={rec.id} className="card flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", priorityInfo.className)}>
                      Prioritas {priorityInfo.label}
                    </span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", typeInfo.className)}>
                      {typeInfo.label}
                    </span>
                  </div>
                  {rec.page_target && (
                    <span className="type-caption text-text-placeholder font-medium">
                      {rec.page_target}
                    </span>
                  )}
                </div>

                <h3 className="text-[16px] m-0 mt-2 mb-1.5">{rec.title}</h3>

                <p className="type-body text-text-muted leading-relaxed m-0 mb-4">
                  {rec.description}
                </p>

                {!isRevealed ? (
                  <div className="mt-auto">
                    <Button variant="brand" size="sm" disabled={revealingId === rec.id} onClick={() => handleReveal(rec.id)}>
                      {revealingId === rec.id ? (
                        <><ButtonSpinner size={14} /> Memproses...</>
                      ) : (
                        <><IconSparkles size={14} /> Tampilkan Solusi · 1 kredit</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 bg-[#F9FAFB] border border-border-default rounded-[var(--radius-md)] p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="type-caption text-brand font-semibold uppercase">
                        Saran Perbaikan
                      </span>
                      <button
                        onClick={() => rec.suggested_copy && navigator.clipboard.writeText(rec.suggested_copy)}
                        className="flex items-center gap-1 type-caption text-text-muted bg-transparent border-none cursor-pointer hover:text-text-body transition-colors"
                      >
                        <IconCopy size={14} /> Salin
                      </button>
                    </div>
                    <div className="leading-relaxed">
                      {rec.suggested_copy ? (
                        renderMarkdown(rec.suggested_copy)
                      ) : (
                        <div className="flex items-center gap-2 text-text-placeholder">
                          <span className="w-4 h-4 border-2 border-border-default border-t-brand rounded-full animate-spin" />
                          Menyiapkan solusi...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
