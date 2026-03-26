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
          <p key={i} style={{
            fontWeight: 600, fontSize: '14px',
            color: '#111827', marginTop: '10px',
            marginBottom: '2px'
          }}>
            {content}
          </p>
        );
      }
      if (line.match(/^[\-\*•]\s/)) {
        const content = line.replace(/^[\-\*•]\s/, '');
        return (
          <div key={i} style={{
            display: 'flex', gap: '8px',
            marginBottom: '3px', fontSize: '14px'
          }}>
            <span style={{ color: '#533AFD', flexShrink: 0 }}>•</span>
            <span dangerouslySetInnerHTML={{
              __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />
          </div>
        );
      }
      if (line.trim() === '') return <div key={i} style={{ height: '6px' }} />;
      return (
        <p key={i} style={{
          lineHeight: '1.7', marginBottom: '2px'
        }}
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

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'high': return { background: '#FEE2E2', color: '#DC2626', label: 'Tinggi' };
      case 'medium': return { background: '#FEF3C7', color: '#D97706', label: 'Sedang' };
      case 'low': return { background: '#F3F4F6', color: '#6B7280', label: 'Rendah' };
      default: return { background: '#F3F4F6', color: '#6B7280', label: priority };
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'web_copy': return { background: '#EDE9FF', color: '#533AFD', label: 'Web Copy' };
      case 'content_gap': return { background: '#DCFCE7', color: '#16A34A', label: 'Content Gap' };
      case 'structure': 
      case 'meta_structure': return { background: '#DBEAFE', color: '#2563EB', label: 'Meta & Structure' };
      default: return { background: '#F3F4F6', color: '#374151', label: type };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-light {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* TOPBAR */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => router.push(`/audit/${auditId}/results`)}
          className="flex items-center gap-2 type-body font-[var(--btn-font-weight)] text-text-muted bg-transparent border-none cursor-pointer hover:text-text-body transition-colors"
        >
          <IconArrowLeft size={18} stroke={1.5} /> Kembali ke hasil
        </button>
        
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          {brandName} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>Rekomendasi</span>
        </div>
        
        <div style={{
          background: '#F3F4F6',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '13px',
          fontWeight: 600,
          color: '#374151'
        }}>
          {credits !== null ? credits : '—'} kredit
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: '32px 32px 0' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>
          Begini cara agar ChatGPT menyebut bisnis kamu
        </h1>
        <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
          Perbaiki isu-isu ini untuk meningkatkan visibility score AI kamu
        </p>

        {/* FILTER TABS */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
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
      <div style={{ 
        padding: '24px 32px', 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '12px' 
      }}>
        {loading || (recommendations.length === 0 && polling) ? (
          <>
            {[1,2,3,4].map((i) => (
              <div key={i} className="card" style={{ height: '120px', animation: 'pulse-light 1.5s ease-in-out infinite' }}>
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "60px", height: "22px", borderRadius: "var(--radius-sm)", background: "#F3F4F6" }} />
                  <div style={{ width: "80px", height: "22px", borderRadius: "var(--radius-sm)", background: "#F3F4F6" }} />
                </div>
                <div style={{ width: "70%", height: "20px", borderRadius: "var(--radius-sm)", background: "#F3F4F6", marginBottom: "10px" }} />
              </div>
            ))}
            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "16px" }}>
              {polling ? "Menyiapkan rekomendasi kamu..." : "Memuat rekomendasi..."}
            </p>
          </>
        ) : recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
            <p>Tidak ada rekomendasi untuk audit ini.</p>
          </div>
        ) : (
          filteredRecommendations.map(rec => {
            const priorityInfo = getPriorityBadgeStyle(rec.priority);
            const typeStyle = getTypeBadgeStyle(rec.type);
            const isRevealed = revealedIds.has(rec.id);

            return (
              <div key={rec.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ 
                      background: priorityInfo.background,
                      color: priorityInfo.color,
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      Prioritas {priorityInfo.label}
                    </span>
                    <span style={{ 
                      background: typeStyle.background,
                      color: typeStyle.color,
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {typeStyle.label}
                    </span>
                  </div>
                  {rec.page_target && (
                    <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>
                      {rec.page_target}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '16px', margin: '8px 0 6px' }}>
                  {rec.title}
                </h3>

                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  {rec.description}
                </p>

                {!isRevealed ? (
                  <div style={{ marginTop: 'auto' }}>
                    <Button variant="brand" size="sm" disabled={revealingId === rec.id} onClick={() => handleReveal(rec.id)}>
                      {revealingId === rec.id ? (
                        <><ButtonSpinner size={14} /> Memproses...</>
                      ) : (
                        <><IconSparkles size={14} /> Tampilkan Solusi · 1 kredit</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--purple)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Saran Perbaikan
                      </span>
                      <button
                        onClick={() => rec.suggested_copy && navigator.clipboard.writeText(rec.suggested_copy)}
                        className="flex items-center gap-1 type-caption text-text-muted bg-transparent border-none cursor-pointer hover:text-text-body transition-colors"
                      >
                        <IconCopy size={14} /> Salin
                      </button>
                    </div>
                    <div style={{ lineHeight: 1.6 }}>
                      {rec.suggested_copy ? (
                        renderMarkdown(rec.suggested_copy)
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF' }}>
                          <span className="loader" style={{ 
                            width: '16px', height: '16px', border: '2px solid #E5E7EB', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' 
                          }} />
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
