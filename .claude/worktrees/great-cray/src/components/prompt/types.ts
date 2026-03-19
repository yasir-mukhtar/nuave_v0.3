export type Topic = {
  id: string;
  workspace_id: string;
  name: string;
  language: string;
  is_ai_generated: boolean;
  display_order: number;
  created_at: string;
};

export type PromptItem = {
  id: string;
  workspace_id: string;
  topic_id: string | null;
  prompt_text: string;
  language: string;
  is_active: boolean;
  is_archived: boolean;
  stage: string | null;
  display_order: number | null;
  created_at: string;
};

export type AuditResult = {
  id: string;
  audit_id: string;
  prompt_id: string;
  prompt_text: string;
  ai_response: string;
  brand_mentioned: boolean;
  mention_context: string | null;
  mention_sentiment: string | null;
  competitor_mentions: string[];
  created_at: string;
};

export type SelectedItem = {
  id: string;
  type: 'topic' | 'prompt';
};

export type FilterTab = 'all' | 'active' | 'archived';
