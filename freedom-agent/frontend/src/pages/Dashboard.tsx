import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Terminal,
  Zap,
  Radio,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { TaskItem, ModelCapability, AgentInfo } from '../types';
import { Mascot } from '../components/Mascot';
import { EmptyState } from '../components/EmptyState';

interface DashboardProps {
  tasks: TaskItem[];
  agents: AgentInfo[];
  models: ModelCapability[];
  providerStatus: Record<string, boolean>;
  privacyMode: string;
  isBackendConnected: boolean;
  onCreateTask: (prompt: string, workspace?: string) => Promise<void>;
  onSelectTask: (taskId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  agents,
  models,
  providerStatus,
  privacyMode,
  isBackendConnected,
  onCreateTask,
  onSelectTask,
  onNavigateTab,
}) => {
  const [prompt, setPrompt] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeTasks = tasks.filter(
    (t) => t.state === 'RUNNING' || t.state === 'PLANNING' || t.state === 'VERIFYING'
  );
  const completedTasks = tasks.filter((t) => t.state === 'COMPLETED');
  const pendingApprovals = tasks.filter((t) => t.has_pending_approval);
  const activeAgentCount = agents.filter((a) => a.is_active || a.status === 'active').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreateTask(prompt, workspace || undefined);
      setPrompt('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presets = [
    {
      title: 'Add power(base, exponent)',
      prompt: 'Inspect calculator.py, add power(base, exponent) function with docstring, and write unit tests.',
      category: 'Feature Add',
    },
    {
      title: 'ZeroDivisionError Guard',
      prompt: 'Refactor divide() in calculator.py to handle division by zero safely and assert exceptions.',
      category: 'Bugfix & Test',
    },
    {
      title: 'Security Sandbox Audit',
      prompt: 'Run security reviewer scan for leaked API secrets, path traversal vectors, and unsafe shell calls.',
      category: 'Zero-Trust Audit',
    },
  ];

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
      {/* Top Welcome Banner with Mascot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div
          className="glass-panel"
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.45) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={14} /> Autonomous AI Runtime
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: isBackendConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                color: isBackendConnected ? '#34d399' : '#fb7185',
                fontWeight: 'bold',
              }}
            >
              {isBackendConnected ? 'Daemon Online' : 'Offline / Standalone'}
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px', color: '#f8fafc' }}>
            Multi-Agent Command Center
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.5', margin: 0, maxWidth: '580px' }}>
            Plan, implement, and verify software modifications deterministically with 8 specialist agents.
            Running under strict <strong style={{ color: '#a5b4fc' }}>{privacyMode}</strong> privacy constraints.
          </p>
        </div>

        {/* Mascot Widget */}
        <Mascot
          status={pendingApprovals.length > 0 ? 'approval' : activeTasks.length > 0 ? 'executing' : 'idle'}
          currentTaskTitle={activeTasks.length > 0 ? activeTasks[0].title : undefined}
        />
      </div>

      {/* 4 Telemetry Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Ollama Local Daemon</span>
            <Cpu size={18} color={providerStatus['ollama'] ? '#34d399' : '#fb7185'} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: providerStatus['ollama'] ? '#34d399' : '#f87171' }}>
            {providerStatus['ollama'] ? 'ONLINE (127.0.0.1)' : 'OFFLINE'}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            {models.length > 0 ? `${models[0].model_id} (${models.length} model registered)` : 'Ollama endpoint closed'}
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Specialist Swarm</span>
            <Activity size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#818cf8' }}>
            {activeAgentCount} Active / {agents.length} Total
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Orchestrator, Architect, Developer, Tester, Security
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Execution Throughput</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc' }}>
            {completedTasks.length} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b' }}>completed</span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#34d399', marginTop: '4px', display: 'block' }}>
            {activeTasks.length} tasks executing now
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Human Approval Queue</span>
            <ShieldCheck size={18} color={pendingApprovals.length > 0 ? '#f59e0b' : '#34d399'} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: pendingApprovals.length > 0 ? '#f59e0b' : '#f8fafc' }}>
            {pendingApprovals.length} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b' }}>pending</span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Zero-Trust interactive approval gate
          </span>
        </div>
      </div>

      {/* Main Grid: Task Creator + Presets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Task Creator Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', margin: '0 0 6px', color: '#f8fafc' }}>
            Dispatch Software Task
          </h2>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px', lineHeight: '1.4' }}>
            State machine automatically plans dependencies, applies precision unified diffs, and validates test suites.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Prompt / Task Objective
              </label>
              <textarea
                rows={3}
                className="glass-input"
                placeholder="e.g. Inspect calculator.py, implement power(base, exponent), and write unit tests."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Workspace Directory (Optional)
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="Defaults to configured workspace root"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !prompt.trim()}
              className="glass-btn glass-btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '14px',
                opacity: isSubmitting || !prompt.trim() ? 0.6 : 1,
                cursor: isSubmitting || !prompt.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <Sparkles size={16} />
              {isSubmitting ? 'Scheduling Autonomous Agents...' : 'Launch Task'}
            </button>
          </form>
        </div>

        {/* Quick Action Presets */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
              Quick Action Presets
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>One-click execution</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {presets.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => setPrompt(preset.prompt)}
                className="glass-card"
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                      }}
                    >
                      {preset.category}
                    </span>
                    <strong style={{ fontSize: '13px', color: '#f1f5f9' }}>{preset.title}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.3' }}>
                    {preset.prompt}
                  </p>
                </div>

                <ArrowRight size={16} color="#818cf8" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#f8fafc' }}>
              Recent Task Activity
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Real execution history from persistent SQLite task database
            </span>
          </div>

          <button onClick={() => onNavigateTab('tasks')} className="glass-btn">
            View Task Center →
          </button>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title="No Tasks Dispatched Yet"
            description="Launch your first coding task above to observe multi-agent orchestration, diff synthesis, and test verification!"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.task_id}
                onClick={() => onSelectTask(task.task_id)}
                className="glass-card"
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          task.state === 'COMPLETED'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : task.state === 'WAITING_FOR_APPROVAL'
                            ? 'rgba(244, 63, 94, 0.2)'
                            : task.state === 'RUNNING' || task.state === 'PLANNING'
                            ? 'rgba(99, 102, 241, 0.25)'
                            : 'rgba(51, 65, 85, 0.4)',
                        color:
                          task.state === 'COMPLETED'
                            ? '#34d399'
                            : task.state === 'WAITING_FOR_APPROVAL'
                            ? '#fb7185'
                            : task.state === 'RUNNING' || task.state === 'PLANNING'
                            ? '#c7d2fe'
                            : '#94a3b8',
                        border: `1px solid ${
                          task.state === 'COMPLETED'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : task.state === 'WAITING_FOR_APPROVAL'
                            ? 'rgba(244, 63, 94, 0.4)'
                            : 'rgba(99, 102, 241, 0.3)'
                        }`,
                      }}
                    >
                      {task.state}
                    </span>
                    <strong style={{ fontSize: '14px', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </strong>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    ID: {task.task_id} • Assigned Model: {task.assigned_model || 'Local'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '12px', fontWeight: '600' }}>
                  <span>Inspect</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
