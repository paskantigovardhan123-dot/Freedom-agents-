import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  Terminal,
  ChevronDown,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { TaskItem, TaskEvent } from '../types';
import { apiClient } from '../api/client';
import { EmptyState } from '../components/EmptyState';

interface ActivityLogsProps {
  tasks: TaskItem[];
  onSelectTask: (taskId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({
  tasks,
  onSelectTask,
  onNavigateTab,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<string>('ALL');
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Fetch all events for either the selected task or across all tasks
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      if (selectedTaskId !== 'ALL') {
        const evs = await apiClient.getEvents(selectedTaskId);
        setEvents(evs);
      } else {
        // Collect events from recent tasks
        const recentTasks = tasks.slice(0, 10);
        const allEvs = await Promise.all(
          recentTasks.map((t) => apiClient.getEvents(t.task_id).catch(() => []))
        );
        const combined = allEvs.flat().sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setEvents(combined);
      }
    } catch (err) {
      console.error('Failed to load activity events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedTaskId, tasks.length]);

  const filteredEvents = events.filter((ev) => {
    // Type Filter
    if (eventFilter !== 'ALL') {
      if (eventFilter === 'ERROR' && !ev.event_type.includes('ERROR') && !ev.event_type.includes('FAIL')) {
        return false;
      }
      if (eventFilter === 'APPROVAL' && !ev.event_type.includes('APPROVAL')) {
        return false;
      }
      if (eventFilter === 'COMPLETED' && !ev.event_type.includes('COMPLETED') && !ev.event_type.includes('VERIF')) {
        return false;
      }
      if (eventFilter === 'EXEC' && (ev.event_type.includes('ERROR') || ev.event_type.includes('FAIL'))) {
        return false;
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchMsg = ev.message?.toLowerCase().includes(term);
      const matchType = ev.event_type?.toLowerCase().includes(term);
      const matchId = ev.task_id?.toLowerCase().includes(term);
      const matchPayload = JSON.stringify(ev.payload || {}).toLowerCase().includes(term);
      return matchMsg || matchType || matchId || matchPayload;
    }

    return true;
  });

  const exportLogs = () => {
    const data = {
      exported_at: new Date().toISOString(),
      task_id_filter: selectedTaskId,
      total_events: filteredEvents.length,
      events: filteredEvents,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freedom_agent_audit_logs_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEventBadge = (type: string) => {
    if (type.includes('ERROR') || type.includes('FAIL')) {
      return { bg: 'rgba(244, 63, 94, 0.2)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.4)' };
    }
    if (type.includes('COMPLETED') || type.includes('VERIF')) {
      return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' };
    }
    if (type.includes('APPROVAL')) {
      return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
    }
    if (type.includes('CREATED') || type.includes('PLAN')) {
      return { bg: 'rgba(99, 102, 241, 0.2)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.4)' };
    }
    return { bg: 'rgba(6, 182, 212, 0.15)', text: '#38bdf8', border: 'rgba(6, 182, 212, 0.3)' };
  };

  const formatTimestamp = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch {
      return isoStr;
    }
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
            <ScrollText size={20} color="#818cf8" />
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Execution Activity & Audit Logs
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
            Deterministic event stream of multi-agent state transitions, tool invocations, approval records, and diff audits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchEvents}
            className="glass-btn"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={isLoadingEvents ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            disabled={filteredEvents.length === 0}
            className="glass-btn glass-btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Download size={14} />
            Export Audit Trail
          </button>
        </div>
      </div>

      {/* Control Bar: Task Dropdown + Search + Filter Pills */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Task Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', color: '#94a3b8', whiteSpace: 'nowrap' }}>Task Filter:</span>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="glass-input"
              style={{ width: '220px', padding: '6px 10px', fontSize: '12.5px', cursor: 'pointer' }}
            >
              <option value="ALL" style={{ background: '#0f172a', color: '#f8fafc' }}>
                All Tasks ({tasks.length})
              </option>
              {tasks.map((t) => (
                <option key={t.task_id} value={t.task_id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  {t.title.slice(0, 30)} ({t.task_id.slice(-6)})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '400px' }}>
            <Search
              size={14}
              color="#64748b"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search event type, log text, or payload..."
              className="glass-input"
              style={{ paddingLeft: '32px', fontSize: '12.5px' }}
            />
          </div>
        </div>

        {/* Severity Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'EXEC', label: 'Execution' },
            { id: 'APPROVAL', label: 'Approvals' },
            { id: 'COMPLETED', label: 'Success' },
            { id: 'ERROR', label: 'Errors / Warnings' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setEventFilter(f.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: eventFilter === f.id ? '700' : '500',
                cursor: 'pointer',
                backgroundColor: eventFilter === f.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: eventFilter === f.id ? '#c7d2fe' : '#94a3b8',
                borderBottom: eventFilter === f.id ? '2px solid #6366f1' : '2px solid transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Stream List */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
            Showing {filteredEvents.length} recorded events
          </span>
          {selectedTaskId !== 'ALL' && (
            <button
              onClick={() => {
                onSelectTask(selectedTaskId);
                onNavigateTab('tasks');
              }}
              className="glass-btn"
              style={{ padding: '4px 10px', fontSize: '11.5px', color: '#38bdf8' }}
            >
              Inspect in Task Center <ArrowRight size={12} />
            </button>
          )}
        </div>

        {isLoadingEvents ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: '48px', width: '100%' }} />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No Activity Events Found"
            description={
              tasks.length === 0
                ? "No tasks have been launched yet. Dispatch a task in the Dashboard or Task Center to generate execution events."
                : "No log events match your current filter criteria."
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredEvents.map((ev) => {
              const badge = getEventBadge(ev.event_type);
              const isExpanded = expandedEventId === ev.event_id;
              const hasPayload = ev.payload && Object.keys(ev.payload).length > 0;

              return (
                <div
                  key={ev.event_id}
                  style={{
                    backgroundColor: 'rgba(7, 9, 19, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    onClick={() => hasPayload && setExpandedEventId(isExpanded ? null : ev.event_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: hasPayload ? 'pointer' : 'default',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {hasPayload && (
                        <span style={{ color: '#64748b' }}>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      )}

                      {/* Event Type Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          flexShrink: 0,
                        }}
                      >
                        {ev.event_type}
                      </span>

                      {/* Message Text */}
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#e2e8f0',
                          fontFamily: 'var(--font-sans)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={ev.message}
                      >
                        {ev.message}
                      </span>
                    </div>

                    {/* Right: Task ID & Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(ev.task_id);
                          onNavigateTab('tasks');
                        }}
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: '#818cf8',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                        title="Click to view task"
                      >
                        {ev.task_id.slice(0, 10)}...
                      </span>

                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {formatTimestamp(ev.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Expandable JSON Payload Viewer */}
                  {isExpanded && hasPayload && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: '#030712',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        color: '#38bdf8',
                        overflowX: 'auto',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>
                          Payload Metadata
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(JSON.stringify(ev.payload, null, 2))}
                          className="glass-btn"
                          style={{ padding: '2px 8px', fontSize: '10px' }}
                        >
                          Copy JSON
                        </button>
                      </div>
                      <pre style={{ margin: 0 }}>{JSON.stringify(ev.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
