import React, { useState, useEffect } from 'react';
import { TaskItem, TaskEvent } from '../types';
import { TaskTimeline } from '../components/TaskTimeline';
import { DiffViewer } from '../components/DiffViewer';
import { ApprovalModal } from '../components/ApprovalModal';
import { apiClient } from '../api/client';

interface TaskWorkspaceProps {
  selectedTaskId: string | null;
  tasks: TaskItem[];
  onApprove: (taskId: string) => Promise<void>;
  onReject: (taskId: string) => Promise<void>;
  onCancel: (taskId: string) => Promise<void>;
}

export const TaskWorkspace: React.FC<TaskWorkspaceProps> = ({
  selectedTaskId,
  tasks,
  onApprove,
  onReject,
  onCancel,
}) => {
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);

  useEffect(() => {
    if (selectedTaskId) {
      const found = tasks.find(t => t.task_id === selectedTaskId);
      if (found) {
        setActiveTask(found);
        apiClient.getEvents(found.task_id).then(setEvents).catch(console.error);
      }
    } else if (tasks.length > 0) {
      setActiveTask(tasks[0]);
      apiClient.getEvents(tasks[0].task_id).then(setEvents).catch(console.error);
    }
  }, [selectedTaskId, tasks]);

  if (!activeTask) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
        No task selected. Select or launch a task from the Dashboard.
      </div>
    );
  }

  const exportReport = () => {
    const report = {
      task: activeTask,
      events: events,
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0f172a',
        padding: '20px 24px',
        borderRadius: '12px',
        border: '1px solid #1e293b'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>{activeTask.title}</h2>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#312e81',
              color: '#c7d2fe'
            }}>
              {activeTask.state}
            </span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
            ID: {activeTask.task_id} • Workspace: {activeTask.workspace_path}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={exportReport}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '13px'
            }}
          >
            Export Report
          </button>
          {activeTask.state !== 'COMPLETED' && activeTask.state !== 'CANCELLED' && (
            <button
              onClick={() => onCancel(activeTask.task_id)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                backgroundColor: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '13px'
              }}
            >
              Cancel Task
            </button>
          )}
        </div>
      </div>

      {/* State Machine Step Timeline */}
      <TaskTimeline currentState={activeTask.state} />

      {/* Pending Approval Dialog */}
      {activeTask.pending_approval && activeTask.pending_approval.status === 'PENDING' && (
        <ApprovalModal
          request={activeTask.pending_approval}
          onApprove={() => onApprove(activeTask.task_id)}
          onReject={() => onReject(activeTask.task_id)}
        />
      )}

      {/* Architecture Plan Steps */}
      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Architectural Plan & Steps</h3>
        {activeTask.plan_steps && activeTask.plan_steps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeTask.plan_steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#020617',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  fontSize: '13px',
                  color: '#cbd5e1'
                }}
              >
                {step}
              </div>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '13px', color: '#64748b' }}>No architectural steps generated yet.</span>
        )}
      </div>

      {/* Unified Diff Inspector */}
      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Code Changes & Unified Diff</h3>
        <DiffViewer diff={activeTask.diff} />
      </div>

      {/* Task Event Audit Trail */}
      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Execution Audit Log</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map((evt, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 12px',
                backgroundColor: '#020617',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontWeight: '600', color: '#818cf8', marginRight: '8px' }}>[{evt.event_type}]</span>
                <span style={{ color: '#e2e8f0' }}>{evt.message}</span>
              </div>
              <span style={{ color: '#64748b', fontSize: '11px' }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
