import React from 'react';
import { AlertTriangle, Terminal, ShieldAlert, Check, X } from 'lucide-react';
import { ApprovalRequest } from '../types';

interface ApprovalModalProps {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ request, onApprove, onReject }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '28px',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(244, 63, 94, 0.25)',
          background: 'rgba(15, 23, 42, 0.95)',
        }}
      >
        {/* Header Warning */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f43f5e' }}>
              Human Authorization Required
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Action Type: <strong style={{ color: '#cbd5e1' }}>{request.action_type}</strong> • Zero-Trust Policy
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '16px' }}>
          The autonomous agent has requested to execute a privileged operation within your workspace:
        </p>

        {/* Command details */}
        <div
          style={{
            backgroundColor: '#030712',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            color: '#f8fafc',
            marginBottom: '20px',
            wordBreak: 'break-all',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
            # Description: {request.description}
          </div>
          {request.details?.command ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
              <Terminal size={14} />
              <span>$ {request.details.command}</span>
            </div>
          ) : (
            <div style={{ color: '#38bdf8' }}>{JSON.stringify(request.details, null, 2)}</div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onReject}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <X size={15} />
            Reject Action
          </button>
          <button
            onClick={onApprove}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 22px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#e11d48',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
            }}
          >
            <Check size={16} />
            Approve & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
