'use client';

import React from 'react';

export function highlightBrand(text: string, brand: string) {
  if (!brand || !text) return [<span key={0}>{text}</span>];
  const regex = new RegExp(`(${brand})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        style={{
          background: '#EDE9FF',
          color: '#533AFD',
          fontWeight: 500,
          borderRadius: 'var(--radius-xs)',
          padding: '0 2px',
          fontStyle: 'normal',
        }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function renderInline(text: string, brand: string) {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 600 }}>
          {highlightBrand(part.slice(2, -2), brand)}
        </strong>
      );
    }
    return <span key={i}>{highlightBrand(part, brand)}</span>;
  });
}

export function renderMarkdown(text: string, brand: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.match(/^#{1,3}\s/)) {
      const content = line.replace(/^#{1,3}\s/, '');
      return (
        <p
          key={i}
          className="type-body"
          style={{
            fontWeight: 600,
            color: '#111827',
            marginTop: '12px',
            marginBottom: '4px',
          }}
        >
          {renderInline(content, brand)}
        </p>
      );
    }
    if (line.match(/^[\-\*•]\s/)) {
      const content = line.replace(/^[\-\*•]\s/, '');
      return (
        <div
          key={i}
          className="type-body"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '4px',
            color: '#374151',
          }}
        >
          <span style={{ color: '#533AFD', flexShrink: 0 }}>•</span>
          <span>{renderInline(content, brand)}</span>
        </div>
      );
    }
    if (line.match(/^---/)) {
      return (
        <hr
          key={i}
          style={{
            border: 'none',
            borderTop: '1px solid #E5E7EB',
            margin: '12px 0',
          }}
        />
      );
    }
    if (line.trim() === '') {
      return <div key={i} style={{ height: '8px' }} />;
    }
    return (
      <p
        key={i}
        className="type-body"
        style={{
          color: '#374151',
          marginBottom: '4px',
        }}
      >
        {renderInline(line, brand)}
      </p>
    );
  });
}
