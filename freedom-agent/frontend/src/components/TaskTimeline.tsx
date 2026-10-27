import React from 'react';
import { Check, Clock, Play, AlertCircle, ShieldCheck } from 'lucide-react';
import { TaskState } from '../types';

interface TaskTimelineProps {
  currentState: TaskState;
}

const NODES: { state: TaskState; label: string; desc: string }[] = [
  { state: 'PENDING', label: 'Queued', desc: 'Task initialized' },
  { state: 'PLANNING', label: 'Planning', desc: 'Architect breakdown' },
  { state: 'WAITING_FOR_APPROVAL', label: 'Approval', desc: 'Human authorization' },
  { state: 'RUNNING', label: 'Executing', desc: 'Developer patches' },
  { state: 'VERIFYING', label: 'Verification', desc: 'Regression tests' },
  { state: 'COMPLETED', label: 'Completed', desc: 'All checks passed' },
];

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ currentState }) => {
  const getNodeStatus = (nodeState: TaskState) => {
    if (currentState === 'FAILED' || currentState === 'CANCELLED') {
      return currentState;
    }
    const order = NODES.map((n) => n.state);
    const currentIndex = order.indexOf(currentState);
    const nodeIndex = order.indexOf(nodeState);

    if (nodeIndex < currentIndex) return 'DONE';
    if (nodeIndex === currentIndex) return 'ACTIVE';
    return 'UPCOMING';
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px 24px',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '600px',
        }}
      >
        {NODES.map((node, idx) => {
          const status = getNodeStatus(node.state);
          let bg = 'rgba(30, 41, 59, 0.4)';
          let color = '#64748b';
          let border = '1px solid rgba(148, 163, 184, 0.15)';
          let glow = 'none';

          if (status === 'DONE') {
            bg = 'rgba(16, 185, 129, 0.2)';
            color = '#34d399';
            border = '1px solid rgba(16, 185, 129, 0.5)';
            glow = '0 0 12px rgba(16, 185, 129, 0.2)';
          } else if (status === 'ACTIVE') {
            bg = 'rgba(99, 102, 241, 0.3)';
            color = '#818cf8';
            border = '2px solid #6366f1';
            glow = '0 0 16px rgba(99, 102, 241, 0.4)';
          }

          return (
            <React.Fragment key={node.state}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '90px',
                }}
              >
                {/* Step Circle Node */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: bg,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    border: border,
                    boxShadow: glow,
                    marginBottom: '8px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {status === 'DONE' ? (
                    <Check size={18} />
                  ) : status === 'ACTIVE' ? (
                    <Play size={14} fill="#818cf8" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: status === 'ACTIVE' ? '#818cf8' : status === 'DONE' ? '#f8fafc' : '#64748b',
                  }}
                >
                  {node.label}
                </span>

                <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
                  {node.desc}
                </span>
              </div>

              {idx < NODES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: status === 'DONE' ? '#10b981' : 'rgba(148, 163, 184, 0.15)',
                    margin: '0 12px',
                    marginBottom: '26px',
                    transition: 'all 0.3s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
