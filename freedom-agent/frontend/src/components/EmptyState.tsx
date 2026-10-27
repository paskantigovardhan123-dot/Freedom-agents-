import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        borderRadius: '16px',
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px dashed rgba(148, 163, 184, 0.2)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#818cf8',
          marginBottom: '16px',
        }}
      >
        <Icon size={26} />
      </div>

      <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
        {title}
      </h4>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94a3b8', maxWidth: '360px', lineHeight: '1.5' }}>
        {description}
      </p>

      {actionText && onAction && (
        <button onClick={onAction} className="glass-btn glass-btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};
