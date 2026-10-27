import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Terminal,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { AgentInfo, ModelCapability } from '../types';
import { apiClient } from '../api/client';

interface AgentBuilderProps {
  agents: AgentInfo[];
  models: ModelCapability[];
  initialAgentId?: string | null;
  onRefreshAgents: () => Promise<void>;
}

const AVAILABLE_TOOLS = [
  { id: 'list_files', label: 'List Files', desc: 'Scan workspace directories', group: 'Filesystem' },
  { id: 'read_file', label: 'Read File', desc: 'Read text and code content', group: 'Filesystem' },
  { id: 'write_file', label: 'Write File', desc: 'Write files with diff synthesis', group: 'Filesystem' },
  { id: 'apply_patch', label: 'Apply Patch', desc: 'Precision block replacements', group: 'Filesystem' },
  { id: 'search_files', label: 'Search Files', desc: 'Regex & text search', group: 'Filesystem' },
  { id: 'run_tests', label: 'Run Tests', desc: 'Execute unittest, pytest, npm test', group: 'Testing' },
  { id: 'run_command', label: 'Run Command', desc: 'Sandboxed subprocess commands', group: 'Terminal' },
  { id: 'git_status', label: 'Git Status', desc: 'Check short git status', group: 'Git' },
  { id: 'git_diff', label: 'Git Diff', desc: 'Inspect staged/unstaged changes', group: 'Git' },
  { id: 'git_commit', label: 'Git Commit', desc: 'Create commit (approval gated)', group: 'Git' },
  { id: 'query_local_docs', label: 'Query Local Docs', desc: 'Offline documentation lookup', group: 'Research' },
  { id: 'web_search', label: 'Web Search', desc: 'External search (hybrid/hosted only)', group: 'Research' },
];

export const AgentBuilder: React.FC<AgentBuilderProps> = ({
  agents,
  models,
  initialAgentId,
  onRefreshAgents,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    initialAgentId || agents[0]?.agent_id || 'developer'
  );
  const [instructions, setInstructions] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialAgentId) {
      setSelectedAgentId(initialAgentId);
    }
  }, [initialAgentId]);

  const currentAgent = agents.find((a) => a.agent_id === selectedAgentId) || agents[0];

  useEffect(() => {
    if (currentAgent) {
      setSelectedTools(currentAgent.permitted_tools || []);
      setInstructions(
        `# Custom Directives for ${currentAgent.name}\n- Adhere to codebase conventions.\n- Keep patches strictly minimal and targeted.\n- Never bypass sandbox path traversal validation.`
      );
    }
  }, [currentAgent?.agent_id]);

  const handleToggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const handleSave = async () => {
    if (!currentAgent) return;
    setSaving(true);
    try {
      await apiClient.updateAgent(currentAgent.agent_id, selectedTools, instructions);
      await onRefreshAgents();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update agent config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Header */}
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
            <Wrench size={20} color="#818cf8" />
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Specialist Agent Builder
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
            Configure agent role parameters, directives, and authorized sandbox tool permissions.
          </p>
        </div>

        {/* Agent Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Target Agent:</span>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="glass-input"
            style={{ width: '220px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer' }}
          >
            {agents.map((a) => (
              <option key={a.agent_id} value={a.agent_id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                {a.name} ({a.agent_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentAgent && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Left Column: Directives & Model Assignment */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {currentAgent.role_title || 'Agent Profile'}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: '2px 0 6px' }}>
                {currentAgent.name}
              </h2>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: '1.45' }}>
                {currentAgent.description}
              </p>
            </div>

            {/* Directives Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Agent System Directives & Instructions
              </label>
              <textarea
                rows={8}
                className="glass-input"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'vertical' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Instructions are injected strictly into this specialist's role prompt during execution.
              </span>
            </div>

            {/* Model Assignment Pill */}
            <div style={{ backgroundColor: 'rgba(7, 9, 19, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Assigned Model Engine</span>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>Offline Local</span>
              </div>
              <span style={{ fontSize: '13px', color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>
                {currentAgent.assigned_model || 'qwen2.5-coder:7b'}
              </span>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="glass-btn glass-btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: '13.5px' }}
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 size={16} color="#34d399" />
                    Configuration Saved!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {saving ? 'Saving to Policy...' : 'Save Agent Configuration'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Authorized Sandbox Tools */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                Authorized Sandbox Tools
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                Toggle which tools this specialist is authorized to invoke. Unchecked tools return 403 Forbidden.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '480px', overflowY: 'auto' }}>
              {AVAILABLE_TOOLS.map((tool) => {
                const isChecked = selectedTools.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => handleToggleTool(tool.id)}
                    className="glass-card"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: isChecked ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(148, 163, 184, 0.1)',
                      backgroundColor: isChecked ? 'rgba(30, 41, 59, 0.7)' : undefined,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#a5b4fc',
                          }}
                        >
                          {tool.group}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                          {tool.id}
                        </strong>
                      </div>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{tool.desc}</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#6366f1',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
