import React, { useState } from 'react';
import { Copy, Check, FileCode, SplitSquareVertical } from 'lucide-react';

interface DiffViewerProps {
  diff: string;
  filePath?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, filePath = 'workspace patch' }) => {
  const [copied, setCopied] = useState(false);

  if (!diff || !diff.trim()) {
    return (
      <div
        style={{
          padding: '32px 20px',
          textAlign: 'center',
          color: '#64748b',
          backgroundColor: 'rgba(7, 9, 19, 0.5)',
          borderRadius: '12px',
          border: '1px dashed rgba(148, 163, 184, 0.15)',
          fontSize: '13px',
        }}
      >
        <SplitSquareVertical size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
        No code modifications or unified diffs recorded for this task.
      </div>
    );
  }

  const lines = diff.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const additions = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
  const deletions = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;

  return (
    <div
      style={{
        backgroundColor: '#070913',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Diff Header Bar */}
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={16} color="#818cf8" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
            {filePath}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontWeight: '600',
            }}
          >
            +{additions}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              color: '#fb7185',
              fontWeight: '600',
            }}
          >
            -{deletions}
          </span>
        </div>

        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '6px',
            color: '#cbd5e1',
            padding: '4px 10px',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy Diff'}</span>
        </button>
      </div>

      {/* Code Lines with Monospace Highlighting */}
      <div
        style={{
          maxHeight: '420px',
          overflowY: 'auto',
          padding: '12px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: '12.5px',
          lineHeight: '1.6',
        }}
      >
        {lines.map((line, idx) => {
          let bg = 'transparent';
          let color = '#cbd5e1';
          let indicatorColor = '#475569';

          if (line.startsWith('+') && !line.startsWith('+++')) {
            bg = 'rgba(16, 185, 129, 0.12)';
            color = '#34d399';
            indicatorColor = '#059669';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            bg = 'rgba(244, 63, 94, 0.12)';
            color = '#f87171';
            indicatorColor = '#e11d48';
          } else if (line.startsWith('@@')) {
            bg = 'rgba(99, 102, 241, 0.12)';
            color = '#818cf8';
            indicatorColor = '#4f46e5';
          }

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                padding: '1px 16px',
                backgroundColor: bg,
                color: color,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              <span
                style={{
                  width: '38px',
                  color: indicatorColor,
                  userSelect: 'none',
                  textAlign: 'right',
                  paddingRight: '12px',
                  opacity: 0.8,
                }}
              >
                {idx + 1}
              </span>
              <span style={{ flex: 1 }}>{line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
