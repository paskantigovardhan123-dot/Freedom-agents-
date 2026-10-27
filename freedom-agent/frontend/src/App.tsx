import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AgentCenter } from './pages/AgentCenter';
import { TaskCenter } from './pages/TaskCenter';
import { AgentBuilder } from './pages/AgentBuilder';
import { ActivityLogs } from './pages/ActivityLogs';
import { FilesKnowledge } from './pages/FilesKnowledge';
import { SettingsView } from './pages/SettingsView';
import { UniversalHub } from './pages/UniversalHub';
import { apiClient } from './api/client';
import { TaskItem, ModelCapability, AgentInfo, PolicyConfig } from './types';

export const App: React.FC = () => {
  const [tab, setTab] = useState<string>('dashboard');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [builderAgentId, setBuilderAgentId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelCapability[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [policies, setPolicies] = useState<PolicyConfig | null>(null);
  const [privacyMode, setPrivacyMode] = useState<string>('LOCAL_ONLY');
  const [providers, setProviders] = useState<Record<string, boolean>>({});
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  const refreshData = async () => {
    try {
      const [tList, mList, aList, pData, privData, provData] = await Promise.all([
        apiClient.listTasks().catch(() => []),
        apiClient.getModels().catch(() => []),
        apiClient.getAgents().catch(() => []),
        apiClient.getPolicies().catch(() => null),
        apiClient.getPrivacy().catch(() => ({ current_mode: 'LOCAL_ONLY', available_modes: [], description: '' })),
        apiClient.getProviders().catch(() => ({ ollama: false, openai: false })),
      ]);
      setTasks(tList);
      setModels(mList);
      setAgents(aList);
      setPolicies(pData);
      setPrivacyMode(privData.current_mode);
      setProviders(provData);
      setIsBackendConnected(true);
    } catch (err) {
      console.error('Error fetching Freedom Agent state:', err);
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (prompt: string, workspace?: string) => {
    const newTask = await apiClient.createTask(prompt, workspace);
    await refreshData();
    setSelectedTaskId(newTask.task_id);
    setTab('tasks');
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTab('tasks');
  };

  const handleApprove = async (taskId: string) => {
    await apiClient.approveTask(taskId);
    await refreshData();
  };

  const handleReject = async (taskId: string) => {
    await apiClient.rejectTask(taskId);
    await refreshData();
  };

  const handleCancel = async (taskId: string) => {
    await apiClient.cancelTask(taskId);
    await refreshData();
  };

  const handleUpdatePrivacy = async (mode: string) => {
    await apiClient.setPrivacy(mode);
    await refreshData();
  };

  const handleUpdatePolicy = async (profile: string) => {
    await apiClient.setPolicy(profile);
    await refreshData();
  };

  const activeTask = tasks.find((t) => t.task_id === selectedTaskId) || tasks[0] || null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={tab}
        onSelectTab={setTab}
        privacyMode={privacyMode}
        isBackendConnected={isBackendConnected}
        isOllamaConnected={!!providers['ollama']}
      />

      <main style={{ flex: 1, backgroundColor: '#070913' }}>
        {tab === 'dashboard' && (
          <Dashboard
            tasks={tasks}
            agents={agents}
            models={models}
            providerStatus={providers}
            privacyMode={privacyMode}
            isBackendConnected={isBackendConnected}
            onCreateTask={handleCreateTask}
            onSelectTask={handleSelectTask}
            onNavigateTab={setTab}
          />
        )}
        {tab === 'hub' && (
          <UniversalHub
            privacyMode={privacyMode}
            onUpdatePrivacy={handleUpdatePrivacy}
            onRefreshAll={refreshData}
          />
        )}
        {tab === 'agents' && (
          <AgentCenter
            agents={agents}
            activeAgentId={activeTask?.active_agent || null}
            onNavigateToBuilder={(agentId) => {
              if (agentId) setBuilderAgentId(agentId);
              setTab('builder');
            }}
          />
        )}
        {tab === 'tasks' && (
          <TaskCenter
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            onCreateTask={handleCreateTask}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={handleCancel}
          />
        )}
        {tab === 'builder' && (
          <AgentBuilder
            agents={agents}
            models={models}
            initialAgentId={builderAgentId}
            onRefreshAgents={async () => {
              const a = await apiClient.getAgents();
              setAgents(a);
            }}
          />
        )}
        {tab === 'activity' && (
          <ActivityLogs
            tasks={tasks}
            onSelectTask={handleSelectTask}
            onNavigateTab={setTab}
          />
        )}
        {tab === 'files' && <FilesKnowledge />}
        {tab === 'settings' && (
          <SettingsView
            policies={policies}
            models={models}
            privacyMode={privacyMode}
            isBackendConnected={isBackendConnected}
            providerStatus={providers}
            onUpdatePolicy={handleUpdatePolicy}
            onUpdatePrivacy={handleUpdatePrivacy}
            onRefreshAll={refreshData}
          />
        )}
      </main>
    </div>
  );
};

export default App;
