'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Topic, Prompt } from '@/types';

// Extended prompt with latest audit data (view-model, not persisted)
export type PromptWithAudit = Prompt & {
  mentioned: boolean | null;
  ai_response: string | null;
};

export type NewPromptInput = {
  prompt_text: string;
  topic_id: string | null;
  language?: string;
};

export type UsePromptPageDataReturn = {
  topics: Topic[];
  prompts: PromptWithAudit[];
  loading: boolean;
  refetch: () => Promise<void>;
  // Topic mutations
  createTopic: (name: string) => Promise<void>;
  renameTopic: (id: string, newName: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  // Prompt mutations
  createPrompt: (data: NewPromptInput) => Promise<void>;
  updatePrompt: (id: string, data: Partial<Pick<Prompt, 'prompt_text' | 'topic_id' | 'language'>>) => Promise<void>;
  togglePromptActive: (id: string, isActive: boolean) => Promise<void>;
  archivePrompt: (id: string) => Promise<void>;
  archiveAllInTopic: (topicId: string | null) => Promise<void>;
  restorePrompt: (id: string) => Promise<void>;
  deletePromptPermanently: (id: string) => Promise<void>;
};

export function usePromptPageData(brandId: string | null): UsePromptPageDataReturn {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [prompts, setPrompts] = useState<PromptWithAudit[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseBrowserClient();

  const fetchData = useCallback(async () => {
    if (!brandId) {
      setTopics([]);
      setPrompts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch topics and prompts in parallel
    const [topicsRes, promptsRes] = await Promise.all([
      supabase
        .from('topics')
        .select('*')
        .eq('brand_id', brandId)
        .order('display_order'),
      supabase
        .from('prompts')
        .select('*')
        .eq('brand_id', brandId)
        .order('display_order'),
    ]);

    const fetchedTopics: Topic[] = topicsRes.data ?? [];
    const fetchedPrompts: Prompt[] = promptsRes.data ?? [];

    // Fetch latest completed audit for mention data
    const { data: latestAudit } = await supabase
      .from('audits')
      .select('id')
      .eq('brand_id', brandId)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Maps for matching audit results to prompts
    let auditByPromptId = new Map<string, { brand_mentioned: boolean; ai_response: string | null }>();
    let auditByPromptText = new Map<string, { brand_mentioned: boolean; ai_response: string | null }>();

    if (latestAudit) {
      const { data: results } = await supabase
        .from('audit_results')
        .select('prompt_id, prompt_text, brand_mentioned, ai_response')
        .eq('audit_id', latestAudit.id);

      if (results) {
        for (const r of results) {
          const entry = {
            brand_mentioned: r.brand_mentioned ?? false,
            ai_response: r.ai_response ?? null,
          };
          if (r.prompt_id) {
            auditByPromptId.set(r.prompt_id, entry);
          }
          // Also index by prompt_text as fallback (for results stored with null prompt_id)
          if (r.prompt_text) {
            auditByPromptText.set(r.prompt_text, entry);
          }
        }
      }
    }

    // Enrich prompts — match by prompt_id first, fallback to prompt_text
    const enriched: PromptWithAudit[] = fetchedPrompts.map((p) => {
      const audit = auditByPromptId.get(p.id) ?? auditByPromptText.get(p.prompt_text);
      return {
        ...p,
        mentioned: audit ? audit.brand_mentioned : null,
        ai_response: audit ? audit.ai_response : null,
      };
    });

    setTopics(fetchedTopics);
    setPrompts(enriched);
    setLoading(false);
  }, [brandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Topic Mutations ──

  const createTopic = useCallback(async (name: string) => {
    if (!brandId) return;

    const tempId = crypto.randomUUID();
    const newTopic: Topic = {
      id: tempId,
      brand_id: brandId,
      name,
      description: null,
      display_order: topics.length,
      created_at: new Date().toISOString(),
    };

    setTopics((prev) => [...prev, newTopic]);

    const { data, error } = await supabase
      .from('topics')
      .insert({ brand_id: brandId, name, display_order: topics.length })
      .select()
      .single();

    if (error || !data) {
      setTopics((prev) => prev.filter((t) => t.id !== tempId));
      console.error('Failed to create topic:', error);
      return;
    }

    // Replace temp ID with real ID
    setTopics((prev) => prev.map((t) => (t.id === tempId ? data : t)));
  }, [brandId, topics.length]);

  const renameTopic = useCallback(async (id: string, newName: string) => {
    const prev = topics.find((t) => t.id === id);
    if (!prev) return;

    setTopics((all) => all.map((t) => (t.id === id ? { ...t, name: newName } : t)));

    const { error } = await supabase
      .from('topics')
      .update({ name: newName })
      .eq('id', id);

    if (error) {
      setTopics((all) => all.map((t) => (t.id === id ? prev : t)));
      console.error('Failed to rename topic:', error);
    }
  }, [topics]);

  const deleteTopic = useCallback(async (id: string) => {
    const prevTopics = topics;
    const prevPrompts = prompts;

    setTopics((all) => all.filter((t) => t.id !== id));
    // DB handles SET NULL on topic_id, mirror it optimistically
    setPrompts((all) => all.map((p) => (p.topic_id === id ? { ...p, topic_id: null } : p)));

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) {
      setTopics(prevTopics);
      setPrompts(prevPrompts);
      console.error('Failed to delete topic:', error);
    }
  }, [topics, prompts]);

  // ── Prompt Mutations ──

  const createPrompt = useCallback(async (data: NewPromptInput) => {
    if (!brandId) return;

    const tempId = crypto.randomUUID();
    const newPrompt: PromptWithAudit = {
      id: tempId,
      brand_id: brandId,
      topic_id: data.topic_id,
      prompt_text: data.prompt_text,
      stage: null,
      language: data.language ?? 'id',
      is_active: true,
      is_edited: false,
      display_order: prompts.length,
      core_keyword: null,
      demand_tier: 'medium' as const,
      search_volume: null,
      search_volume_range: null,
      competition_level: null,
      cpc_micros: null,
      keyword_data_fetched_at: null,
      archived_at: null,
      created_at: new Date().toISOString(),
      mentioned: null,
      ai_response: null,
    };

    setPrompts((prev) => [...prev, newPrompt]);

    const { data: inserted, error } = await supabase
      .from('prompts')
      .insert({
        brand_id: brandId,
        topic_id: data.topic_id,
        prompt_text: data.prompt_text,
        language: data.language ?? 'id',
        display_order: prompts.length,
      })
      .select()
      .single();

    if (error || !inserted) {
      setPrompts((prev) => prev.filter((p) => p.id !== tempId));
      console.error('Failed to create prompt:', error);
      return;
    }

    setPrompts((prev) =>
      prev.map((p) =>
        p.id === tempId ? { ...inserted, mentioned: null, ai_response: null } : p
      )
    );
  }, [brandId, prompts.length]);

  const updatePrompt = useCallback(async (id: string, data: Partial<Pick<Prompt, 'prompt_text' | 'topic_id' | 'language'>>) => {
    const prev = prompts.find((p) => p.id === id);
    if (!prev) return;

    const isTextChanged = data.prompt_text !== undefined && data.prompt_text !== prev.prompt_text;
    const dbUpdate: Record<string, unknown> = { ...data };
    if (isTextChanged) dbUpdate.is_edited = true;

    setPrompts((all) => all.map((p) => (p.id === id ? { ...p, ...data, is_edited: isTextChanged ? true : p.is_edited } : p)));

    const { error } = await supabase
      .from('prompts')
      .update(dbUpdate)
      .eq('id', id);

    if (error) {
      setPrompts((all) => all.map((p) => (p.id === id ? prev : p)));
      console.error('Failed to update prompt:', error);
    }
  }, [prompts]);

  const togglePromptActive = useCallback(async (id: string, isActive: boolean) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)));

    const { error } = await supabase
      .from('prompts')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: !isActive } : p)));
      console.error('Failed to toggle prompt:', error);
    }
  }, []);

  const archivePrompt = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, archived_at: now, is_active: false } : p))
    );

    const { error } = await supabase
      .from('prompts')
      .update({ archived_at: now, is_active: false })
      .eq('id', id);

    if (error) {
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, archived_at: null } : p))
      );
      console.error('Failed to archive prompt:', error);
    }
  }, []);

  const archiveAllInTopic = useCallback(async (topicId: string | null) => {
    if (!brandId) return;

    const now = new Date().toISOString();
    const prevPrompts = prompts;

    setPrompts((prev) =>
      prev.map((p) => {
        const matches = topicId === null ? p.topic_id === null : p.topic_id === topicId;
        if (matches && !p.archived_at) return { ...p, archived_at: now, is_active: false };
        return p;
      })
    );

    let query = supabase
      .from('prompts')
      .update({ archived_at: now, is_active: false })
      .eq('brand_id', brandId)
      .is('archived_at', null);

    if (topicId === null) {
      query = query.is('topic_id', null);
    } else {
      query = query.eq('topic_id', topicId);
    }

    const { error } = await query;

    if (error) {
      setPrompts(prevPrompts);
      console.error('Failed to archive all:', error);
    }
  }, [brandId, prompts]);

  const restorePrompt = useCallback(async (id: string) => {
    const prev = prompts.find((p) => p.id === id);
    setPrompts((all) =>
      all.map((p) => (p.id === id ? { ...p, archived_at: null } : p))
    );

    const { error } = await supabase
      .from('prompts')
      .update({ archived_at: null })
      .eq('id', id);

    if (error) {
      if (prev) setPrompts((all) => all.map((p) => (p.id === id ? prev : p)));
      console.error('Failed to restore prompt:', error);
    }
  }, [prompts]);

  const deletePromptPermanently = useCallback(async (id: string) => {
    const prev = prompts;
    setPrompts((all) => all.filter((p) => p.id !== id));

    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) {
      setPrompts(prev);
      console.error('Failed to delete prompt:', error);
    }
  }, [prompts]);

  return {
    topics,
    prompts,
    loading,
    refetch: fetchData,
    createTopic,
    renameTopic,
    deleteTopic,
    createPrompt,
    updatePrompt,
    togglePromptActive,
    archivePrompt,
    archiveAllInTopic,
    restorePrompt,
    deletePromptPermanently,
  };
}
