'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  IconSparkles, 
  IconCopy, 
  IconArrowLeft 
} from '@tabler/icons-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'web_copy' | 'content_gap' | 'structure'>('all');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [credits, setCredits] = useState<number | null>(null);
  const [brandName, setBrandName] = useState('Brand');

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function fetchUserData() {
      try {
        const res = await fetch('/api/user/credits')
        const { credits } = await res.json()
        if (credits !== null) setCredits(credits)
      } catch (err) {
        console.error('Failed to fetch user credits:', err)
      }
    }

    async function fetchBrandName() {
      // Try session storage first
      const profileStr = sessionStorage.getItem('nuave_profile');
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          if (profile.profile?.brand_name) {
            setBrandName(profile.profile.brand_name);
            return;
          }
        } catch (e) {}
      }

      // Fetch from DB if not in session
      if (auditId) {
        const { data } = await supabase
          .from('audits')
          .select('workspaces(brand_name)')
          .eq('id', auditId)
          .single();
        
        const brand = (data?.workspaces as any)?.brand_name;
        if (brand) setBrandName(brand);
      }
    }

    fetchUserData();
    fetchBrandName();

    async function fetchRecommendations() {
      if (!auditId) return;
      
      try {
        setLoading(true);
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audit_id: auditId })
        });
        
        const data = await res.json();
        if (data.success && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
          
          // Check for any already revealed recs
          const revealed = new Set<string>();
          data.recommendations.forEach((rec: Recommendation) => {
            if (rec.suggested_copy) revealed.add(rec.id);
          });
          setRevealedIds(revealed);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [auditId]);

  async function handleReveal(recId: string) {
    setRevealedIds(prev => new Set([...prev, recId]));
    
    try {
      const res = await fetch('/api/recommendations/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: recId })
      });
      
      const data = await res.json();
      
      if (data.suggested_copy) {
        setRecommendations(prev => 
          prev.map(r => r.id === recId 
            ? { ...r, suggested_copy: data.suggested_copy }
            : r
          )
        );
        
        if (typeof credits === 'number') {
          const newCredits = Math.max(0, credits - 1);
          setCredits(newCredits);
          localStorage.setItem('nuave_credits', newCredits.toString());
        }
      }
    } catch (error) {
      console.error('Failed to reveal recommendation:', error);
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
            <span style={{ color: '#6C3FF5', flexShrink: 0 }}>•</span>
            <span dangerouslySetInnerHTML={{
              __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />
          </div>
        );
      }
      if (line.trim() === '') return <div key={i} style={{ height: '6px' }} />;
      return (
        <p key={i} style={{
          fontSize: '14px', color: '#374151',
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
      case 'high': return { background: '#FEE2E2', color: '#DC2626' };
      case 'medium': return { background: '#FEF3C7', color: '#D97706' };
      case 'low': return { background: '#F3F4F6', color: '#6B7280' };
      default: return { background: '#F3F4F6', color: '#6B7280' };
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'web_copy': return { background: '#EDE9FF', color: '#6C3FF5', label: 'Web Copy' };
      case 'content_gap': return { background: '#DCFCE7', color: '#16A34A', label: 'Content Gap' };
      case 'structure': 
      case 'meta_structure': return { background: '#DBEAFE', color: '#2563EB', label: 'Meta & Structure' };
      default: return { background: '#F3F4F6', color: '#374151', label: type };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
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
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#6B7280',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <IconArrowLeft size={18} stroke={1.5} /> Back to results
        </button>
        
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          {brandName} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>Recommendations</span>
        </div>
        
        <div style={{
          background: '#F3F4F6',
          padding: '6px 12px',
          borderRadius: '999px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#374151'
        }}>
          {credits !== null ? credits : '—'} credits
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: '32px 32px 0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
          Here&apos;s how to get ChatGPT to mention you
        </h1>
        <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
          Fix these issues to improve your AI visibility score
        </p>

        {/* FILTER TABS */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'web_copy', label: 'Web Copy' },
            { id: 'content_gap', label: 'Content Gaps' },
            { id: 'structure', label: 'Meta & Structure' }
          ].map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                style={{
                  background: isActive ? '#6C3FF5' : '#F3F4F6',
                  color: isActive ? 'white' : '#374151',
                  borderRadius: '999px',
                  padding: '6px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RECOMMENDATIONS GRID */}
      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ height: '180px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: .5; }
                }
              `}</style>
              <div style={{ height: '20px', width: '120px', background: '#F3F4F6', borderRadius: '4px', marginBottom: '16px' }} />
              <div style={{ height: '24px', width: '60%', background: '#F3F4F6', borderRadius: '4px', marginBottom: '12px' }} />
              <div style={{ height: '16px', width: '90%', background: '#F3F4F6', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ height: '16px', width: '80%', background: '#F3F4F6', borderRadius: '4px' }} />
            </div>
          ))
        ) : filteredRecommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
            <p>No recommendations generated yet.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                background: '#6C3FF5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Generate Recommendations
            </button>
          </div>
        ) : (
          filteredRecommendations.map(rec => {
            const priorityStyle = getPriorityBadgeStyle(rec.priority);
            const typeStyle = getTypeBadgeStyle(rec.type);
            const isRevealed = revealedIds.has(rec.id);

            return (
              <div key={rec.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ 
                      ...priorityStyle, 
                      borderRadius: '999px', 
                      padding: '2px 10px', 
                      fontSize: '11px', 
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {rec.priority}
                    </span>
                    <span style={{ 
                      background: typeStyle.background,
                      color: typeStyle.color,
                      borderRadius: '999px', 
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

                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '8px 0 6px' }}>
                  {rec.title}
                </h3>

                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  {rec.description}
                </p>

                {!isRevealed ? (
                  <div style={{ marginTop: 'auto' }}>
                    <button
                      onClick={() => handleReveal(rec.id)}
                      style={{
                        background: '#6C3FF5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <IconSparkles size={14} /> Reveal Fix · 1 credit
                    </button>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#6C3FF5', fontWeight: 600, textTransform: 'uppercase' }}>
                        Suggested Fix
                      </span>
                      <button
                        onClick={() => rec.suggested_copy && navigator.clipboard.writeText(rec.suggested_copy)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6B7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <IconCopy size={14} /> Copy
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                      {rec.suggested_copy ? (
                        renderMarkdown(rec.suggested_copy)
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF' }}>
                          <span className="loader" style={{ 
                            width: '16px', height: '16px', border: '2px solid #E5E7EB', borderTopColor: '#6C3FF5', borderRadius: '50%', animation: 'spin 1s linear infinite' 
                          }} />
                          Generating fix...
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
