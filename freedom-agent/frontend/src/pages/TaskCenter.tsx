import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Play,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Download,
  Ban,
  Terminal,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TaskItem, TaskEvent } from '../types';
import { TaskTimeline } from '../components/TaskTimeline';
import { DiffViewer } from '../components/DiffViewer';
import { ApprovalModal } from '../components/ApprovalModal';
import { EmptyState } from '../components/EmptyState';
import { apiClient } from '../api/client';

interface TaskCenterProps {
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onCreateTask: (prompt: string, workspace?: string) => Promise<void>;
  onApprove: (taskId: string) => Promise<void>;
  onReject: (taskId: string) => Promise<void>;
  onCancel: (taskId: string) => Promise<void>;
}

export const TaskCenter: React.FC<TaskCenterProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onCreateTask,
  onApprove,
  onReject,
  onCancel,
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [prompt, setPrompt] = useState<string>('');
  const [workspace, setWorkspace] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [events, setEvents] = useState<TaskEvent[]>([]);

  const activeTask = tasks.find((t) => t.task_id === selectedTaskId) || tasks[0] || null;

  useEffect(() => {
    if (activeTask) {
      apiClient.getEvents(activeTask.task_id).then(setEvents).catch(console.error);
    }
  }, [activeTask?.task_id, activeTask?.state]);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ALL') return true;
    if (filter === 'RUNNING') return t.state === 'RUNNING' || t.state === 'PLANNING' || t.state === 'VERIFYING';
    if (filter === 'APPROVAL') return t.state === 'WAITING_FOR_APPROVAL';
    if (filter === 'COMPLETED') return t.state === 'COMPLETED';
    if (filter === 'FAILED') return t.state === 'FAILED' || t.state === 'CANCELLED';
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
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

  const exportReport = () => {
    if (!activeTask) return;
    const report = {
      task: activeTask,
      events,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freedom_agent_report_${activeTask.task_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      {/* Top Banner */}
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
            <ListTodo size={20} color="#818cf8" />
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Autonomous Task Center
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
            Inspect task lifecycles, review unified diffs, approve operations, and audit step logs.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[
            { id: 'ALL', label: `All (${tasks.length})` },
            { id: 'RUNNING', label: `Executing (${tasks.filter((t) => t.state === 'RUNNING' || t.state === 'PLANNING').length})` },
            { id: 'APPROVAL', label: `Approval (${tasks.filter((t) => t.has_pending_approval).length})` },
            { id: 'COMPLETED', label: `Completed (${tasks.filter((t) => t.state === 'COMPLETED').length})` },
            { id: 'FAILED', label: `Failed/Cancelled (${tasks.filter((t) => t.state === 'FAILED' || t.state === 'CANCELLED').length})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilter(pill.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: filter === pill.id ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: filter === pill.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: filter === pill.id ? '#c7d2fe' : '#94a3b8',
                borderBottom: filter === pill.id ? '2px solid #6366f1' : '2px solid transparent',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Left Task List + Right Deep-Dive Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Left Column: Task Creator & Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Task Creation Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
              Create New Task
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                rows={2}
                className="glass-input"
                placeholder="Describe your coding task..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ fontSize: '13px' }}
              />
              <input
                type="text"
                className="glass-input"
                placeholder="Workspace path (optional)"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                style={{ fontSize: '12px' }}
              />
              <button
                type="submit"
                disabled={isSubmitting || !prompt.trim()}
                className="glass-btn glass-btn-primary"
                style={{
                  padding: '9px',
                  fontSize: '13px',
                  opacity: isSubmitting || !prompt.trim() ? 0.6 : 1,
                  cursor: isSubmitting || !prompt.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles size={15} />
                {isSubmitting ? 'Starting...' : 'Submit Task'}
              </button>
            </form>
          </div>

          {/* Task Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTasks.length === 0 ? (
              <EmptyState title="No Tasks in Filter" description="No tasks match the active status filter." />
            ) : (
              filteredTasks.map((t) => {
                const isSelected = activeTask?.task_id === t.task_id;
                return (
                  <div
                    key={t.task_id}
                    onClick={() => onSelectTask(t.task_id)}
                    className="glass-card"
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #6366f1' : '1px solid rgba(148, 163, 184, 0.12)',
                      backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.85)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            t.state === 'COMPLETED'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : t.state === 'WAITING_FOR_APPROVAL'
                              ? 'rgba(244, 63, 94, 0.2)'
                              : t.state === 'RUNNING' || t.state === 'PLANNING'
                              ? 'rgba(99, 102, 241, 0.25)'
                              : 'rgba(51, 65, 85, 0.4)',
                          color:
                            t.state === 'COMPLETED'
                              ? '#34d399'
                              : t.state === 'WAITING_FOR_APPROVAL'
                              ? '#fb7185'
                              : t.state === 'RUNNING' || t.state === 'PLANNING'
                              ? '#c7d2fe'
                              : '#94a3b8',
                        }}
                      >
                        {t.state}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{t.created_at?.slice(11, 19)}</span>
                    </div>

                    <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block', marginBottom: '2px' }}>
                      {t.title}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {t.task_id} • Model: {t.assigned_model || 'Local'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep-Dive Task Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTask ? (
            <>
              {/* Task Header & Controls */}
              <div
                className="glass-panel"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                      {activeTask.title}
                    </h2>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                      }}
                    >
                      {activeTask.state}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    ID: {activeTask.task_id} • Workspace: {activeTask.workspace_path}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={exportReport} className="glass-btn" style={{ padding: '7px 12px', fontSize: '12px' }}>
                    <Download size={14} />
                    Export
                  </button>
                  {activeTask.state !== 'COMPLETED' && activeTask.state !== 'CANCELLED' && activeTask.state !== 'FAILED' && (
                    <button
                      onClick={() => onCancel(activeTask.task_id)}
                      className="glass-btn"
                      style={{ padding: '7px 12px', fontSize: '12px', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                    >
                      <Ban size={14} />
                      Cancel Task
                    </button>
                  )}
                </div>
              </div>

              {/* State Machine Step Progression */}
              <TaskTimeline currentState={activeTask.state} />

              {/* Pending Approval Modal / Card */}
              {activeTask.pending_approval && activeTask.pending_approval.status === 'PENDING' && (
                <ApprovalModal
                  request={activeTask.pending_approval}
                  onApprove={() => onApprove(activeTask.task_id)}
                  onReject={() => onReject(activeTask.task_id)}
                />
              )}

              {/* Architectural Plan Steps */}
              {activeTask.plan_steps && activeTask.plan_steps.length > 0 && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Layers size={16} color="#818cf8" />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                      Architectural Plan Steps
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeTask.plan_steps.map((step, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(7, 9, 19, 0.6)',
                          border: '1px solid rgba(148, 163, 184, 0.1)',
                          fontSize: '12.5px',
                          color: '#cbd5e1',
                        }}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unified Diff Viewer */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FileCode size={16} color="#06b6d4" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                    Code Modifications & Unified Diff
                  </h3>
                </div>
                <DiffViewer diff={activeTask.diff} />
              </div>

              {/* Event Stream & Terminal Log */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Terminal size={16} color="#a5b4fc" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                    Execution Audit Log
                  </h3>
                </div>

                <div
                  style={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                  }}
                >
                  {events.length === 0 ? (
                    <span style={{ color: '#64748b' }}>No events recorded.</span>
                  ) : (
                    events.map((ev, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(7, 9, 19, 0.6)',
                          border: '1px solid rgba(148, 163, 184, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#818cf8', marginRight: '6px' }}>[{ev.event_type}]</strong>
                          <span style={{ color: '#cbd5e1' }}>{ev.message}</span>
                        </div>
                        <span style={{ color: '#64748b', fontSize: '10.5px', flexShrink: 0 }}>
                          {ev.timestamp?.slice(11, 19)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <EmptyState title="No Task Selected" description="Select a task from the list or dispatch a new one." />
          )}
        </div>
      </div>
    </div>
  );
};
