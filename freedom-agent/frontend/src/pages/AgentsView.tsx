import React from 'react';
import { AgentInfo } from '../types';
import { AgentCard } from '../components/AgentCard';

interface AgentsViewProps {
  agents: AgentInfo[];
  activeAgentId: string | null;
}

export const AgentsView: React.FC<AgentsViewProps> = ({ agents, activeAgentId }) => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Specialist Agent Team</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
          Freedom Agent uses a specialized multi-agent architecture with strictly bounded roles, tools, and execution limits.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {agents.map(agent => (
          <AgentCard
            key={agent.agent_id}
            agent={agent}
            isActive={agent.agent_id === activeAgentId}
          />
        ))}
      </div>
    </div>
  );
};
