import React, { useState } from 'react';
import {
  Users,
  Cpu,
  Shield,
  Wrench,
  Activity,
  CheckCircle2,
  Terminal,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AgentInfo } from '../types';

interface AgentCenterProps {
  agents: AgentInfo[];
  activeAgentId: string | null;
  onNavigateToBuilder: (agentId?: string) => void;
}

export const AgentCenter: React.FC<AgentCenterProps> = ({
  agents,
  activeAgentId,
  onNavigateToBuilder,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  return (
    <div
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Users size={20} color="#818cf8" />
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Specialist Agent Roster
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0, maxWidth: '650px' }}>
            8 specialized AI engineering agents operating under zero-trust sandbox rules.
            Each agent has strictly bounded tools and cannot elevate its own permissions.
          </p>
        </div>

        <button
          onClick={() => onNavigateToBuilder()}
          className="glass-btn glass-btn-primary"
          style={{ padding: '10px 18px', fontSize: '13px' }}
        >
          <Wrench size={15} />
          Configure in Agent Builder
        </button>
      </div>

      {/* Grid of Agent Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '18px',
        }}
      >
        {agents.map((agent) => {
          const isActive = agent.agent_id === activeAgentId || agent.is_active || agent.status === 'active';

          return (
            <div
              key={agent.agent_id}
              className="glass-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isActive ? '1px solid #6366f1' : '1px solid rgba(148, 163, 184, 0.12)',
                boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.3)' : undefined,
              }}
            >
              <div>
                {/* Agent Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                        border: `1px solid ${isActive ? '#818cf8' : 'rgba(148, 163, 184, 0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? '#a5b4fc' : '#cbd5e1',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                        {agent.name}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '500' }}>
                        {agent.role_title || 'Specialist Agent'}
                      </span>
                    </div>
                  </div>

                  {/* Real Status Badge */}
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.15)',
                      color: isActive ? '#c7d2fe' : '#34d399',
                      border: `1px solid ${isActive ? '#6366f1' : 'rgba(16, 185, 129, 0.3)'}`,
                    }}
                  >
                    {isActive ? '● ACTIVE' : '● IDLE'}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: '1.45', margin: '0 0 14px' }}>
                  {agent.description}
                </p>

                {/* Permitted Tools Chips */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>
                    Authorized Sandbox Tools ({agent.permitted_tools?.length || 0}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {(agent.permitted_tools || []).map((tool, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(7, 9, 19, 0.7)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                        }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Model: <strong style={{ color: '#cbd5e1' }}>{agent.assigned_model || 'Local'}</strong>
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="glass-btn"
                    style={{ padding: '5px 10px', fontSize: '11px' }}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onNavigateToBuilder(agent.agent_id)}
                    className="glass-btn"
                    style={{ padding: '5px 10px', fontSize: '11px', color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              background: 'rgba(15, 23, 42, 0.95)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                    fontWeight: 'bold',
                  }}
                >
                  {selectedAgent.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>{selectedAgent.name}</h3>
                  <span style={{ fontSize: '12px', color: '#a5b4fc' }}>ID: {selectedAgent.agent_id}</span>
                </div>
              </div>

              <button onClick={() => setSelectedAgent(null)} className="glass-btn" style={{ padding: '4px 10px' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '18px' }}>
              {selectedAgent.description}
            </p>

            <div style={{ backgroundColor: '#070913', padding: '14px', borderRadius: '10px', marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>
                Security & Sandbox Boundaries
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                <li>Zero self-elevation: cannot grant itself permissions or switch models.</li>
                <li>All file operations validated against canonical workspace root.</li>
                <li>API calls and outputs automatically pass through the secret redaction engine.</li>
                <li>Dangerous actions pause for mandatory human authorization.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  const aid = selectedAgent.agent_id;
                  setSelectedAgent(null);
                  onNavigateToBuilder(aid);
                }}
                className="glass-btn glass-btn-primary"
              >
                Customize in Agent Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
