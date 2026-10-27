import React from 'react';
import { AgentInfo } from '../types';

interface AgentCardProps {
  agent: AgentInfo;
  isActive?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, isActive = false }) => {
  return (
    <div style={{
      backgroundColor: '#0f172a',
      borderRadius: '8px',
      border: `1px solid ${isActive ? '#6366f1' : '#1e293b'}`,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: isActive ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#f1f5f9' }}>{agent.name}</h4>
        {isActive && (
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: '#312e81',
            color: '#c7d2fe',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            ACTIVE
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
        {agent.description}
      </p>
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <span>ID: {agent.agent_id}</span>
        <span style={{ color: '#10b981' }}>● Enabled</span>
      </div>
    </div>
  );
};
