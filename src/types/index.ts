export type Workspace = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  plan: 'smb' | 'agency';
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  workspace_id: string;
  name: string;
  website_url: string;
  language: string;
  company_overview: string | null;
  differentiators: string[];
  competitors: string[];
  industry: string | null;
  target_audience: string | null;
  topics: unknown | null;
  created_at: string;
  updated_at: string;
};
