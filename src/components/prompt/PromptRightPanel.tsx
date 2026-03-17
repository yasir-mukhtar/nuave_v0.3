'use client';

import { IconFileText } from '@tabler/icons-react';
import type { Topic, PromptItem, AuditResult, SelectedItem } from './types';
import PromptDetailView from './PromptDetailView';
import TopicDetailView from './TopicDetailView';

type Props = {
  selectedItem: SelectedItem | null;
  topics: Topic[];
  prompts: PromptItem[];
  latestResults: Map<string, AuditResult>;
  brandName: string;
  onArchiveToggle: (promptId: string, archived: boolean) => void;
  onDeletePrompt: (promptId: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onGeneratePrompts: (topicId: string) => void;
  onAddPrompt: (topicId: string) => void;
  onSelectPrompt: (promptId: string) => void;
};

export default function PromptRightPanel({
  selectedItem,
  topics,
  prompts,
  latestResults,
  brandName,
  onArchiveToggle,
  onDeletePrompt,
  onDeleteTopic,
  onGeneratePrompts,
  onAddPrompt,
  onSelectPrompt,
}: Props) {
  // Empty state
  if (!selectedItem) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: '#FAFAFA',
      }}>
        <IconFileText size={40} stroke={1} style={{ color: '#D1D5DB' }} />
        <p style={{ fontSize: '14px', color: 'var(--text-muted, #9CA3AF)', margin: 0 }}>
          Pilih prompt atau topik untuk melihat detail
        </p>
      </div>
    );
  }

  // Topic detail
  if (selectedItem.type === 'topic') {
    const topic = topics.find((t) => t.id === selectedItem.id);
    if (!topic) return null;
    const topicPrompts = prompts.filter((p) => p.topic_id === topic.id);
    return (
      <TopicDetailView
        topic={topic}
        prompts={topicPrompts}
        latestResults={latestResults}
        onGeneratePrompts={onGeneratePrompts}
        onAddPrompt={onAddPrompt}
        onDeleteTopic={onDeleteTopic}
        onSelectPrompt={onSelectPrompt}
      />
    );
  }

  // Prompt detail
  const prompt = prompts.find((p) => p.id === selectedItem.id);
  if (!prompt) return null;
  return (
    <PromptDetailView
      prompt={prompt}
      latestResult={latestResults.get(prompt.id)}
      brandName={brandName}
      onArchiveToggle={onArchiveToggle}
      onDelete={onDeletePrompt}
    />
  );
}
