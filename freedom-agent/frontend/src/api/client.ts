import {
  TaskItem,
  TaskEvent,
  ModelCapability,
  AgentInfo,
  PolicyConfig,
  HealthStatus,
  WorkspaceFilesResponse,
  HubProvider,
  CodingAgentStatus,
} from '../types';

const BASE_URL = '/api';

export const apiClient = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
    return res.json();
  },

  async getProviders(): Promise<Record<string, boolean>> {
    const res = await fetch(`${BASE_URL}/providers`);
    if (!res.ok) throw new Error(`Providers fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async getModels(): Promise<ModelCapability[]> {
    const res = await fetch(`${BASE_URL}/models`);
    if (!res.ok) throw new Error(`Models fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async getAgents(): Promise<AgentInfo[]> {
    const res = await fetch(`${BASE_URL}/agents`);
    if (!res.ok) throw new Error(`Agents fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async updateAgent(
    agentId: string,
    permittedTools?: string[],
    customInstructions?: string
  ): Promise<any> {
    const res = await fetch(`${BASE_URL}/agents/${agentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permitted_tools: permittedTools,
        custom_instructions: customInstructions,
      }),
    });
    if (!res.ok) throw new Error(`Agent update failed: HTTP ${res.status}`);
    return res.json();
  },

  async listTasks(): Promise<TaskItem[]> {
    const res = await fetch(`${BASE_URL}/tasks`);
    if (!res.ok) throw new Error(`Tasks fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async createTask(prompt: string, workspace_path?: string): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, workspace_path }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Task creation failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getTask(taskId: string): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`);
    if (!res.ok) throw new Error(`Task fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async approveTask(taskId: string): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error(`Task approval failed: HTTP ${res.status}`);
    return res.json();
  },

  async rejectTask(taskId: string): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/reject`, { method: 'POST' });
    if (!res.ok) throw new Error(`Task rejection failed: HTTP ${res.status}`);
    return res.json();
  },

  async cancelTask(taskId: string): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error(`Task cancellation failed: HTTP ${res.status}`);
    return res.json();
  },

  async getEvents(taskId: string): Promise<TaskEvent[]> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/events`);
    if (!res.ok) throw new Error(`Events fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async getDiff(taskId: string): Promise<{ task_id: string; diff: string }> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/diff`);
    if (!res.ok) throw new Error(`Diff fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async getPrivacy(): Promise<{ current_mode: string; available_modes: string[]; description: string }> {
    const res = await fetch(`${BASE_URL}/settings/privacy`);
    if (!res.ok) throw new Error(`Privacy settings fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async setPrivacy(privacy_mode: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings/privacy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privacy_mode }),
    });
    if (!res.ok) throw new Error(`Privacy update failed: HTTP ${res.status}`);
    return res.json();
  },

  async getPolicies(): Promise<PolicyConfig> {
    const res = await fetch(`${BASE_URL}/settings/policies`);
    if (!res.ok) throw new Error(`Policies fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async setPolicy(policy_profile: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy_profile }),
    });
    if (!res.ok) throw new Error(`Policy update failed: HTTP ${res.status}`);
    return res.json();
  },

  async getWorkspaceFiles(): Promise<WorkspaceFilesResponse> {
    const res = await fetch(`${BASE_URL}/workspace/files`);
    if (!res.ok) throw new Error(`Workspace files fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async getWorkspaceFile(path: string): Promise<{ path: string; content: string }> {
    const res = await fetch(`${BASE_URL}/workspace/file?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error(`File fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async getHubProviders(): Promise<HubProvider[]> {
    const res = await fetch(`${BASE_URL}/hub/providers`);
    if (!res.ok) throw new Error(`Hub providers fetch failed: HTTP ${res.status}`);
    return res.json();
  },

  async registerHubProvider(data: {
    provider_id: string;
    name: string;
    api_base: string;
    api_key?: string;
    is_local?: boolean;
    default_model?: string;
    enabled?: boolean;
  }): Promise<HubProvider> {
    const res = await fetch(`${BASE_URL}/hub/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Provider registration failed: HTTP ${res.status}`);
    return res.json();
  },

  async deleteHubProvider(providerId: string): Promise<{ status: string; provider_id: string }> {
    const res = await fetch(`${BASE_URL}/hub/providers/${providerId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Provider deletion failed: HTTP ${res.status}`);
    return res.json();
  },

  async testHubProvider(
    api_base: string,
    api_key?: string,
    is_local?: boolean
  ): Promise<{ status: string; is_available: boolean; models_discovered: number; models: ModelCapability[] }> {
    const res = await fetch(`${BASE_URL}/hub/providers/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_base, api_key, is_local }),
    });
    if (!res.ok) throw new Error(`Provider test failed: HTTP ${res.status}`);
    return res.json();
  },

  async getCodingAgents(): Promise<CodingAgentStatus[]> {
    const res = await fetch(`${BASE_URL}/hub/coding-agents`);
    if (!res.ok) throw new Error(`Coding agents fetch failed: HTTP ${res.status}`);
    return res.json();
  },
};
