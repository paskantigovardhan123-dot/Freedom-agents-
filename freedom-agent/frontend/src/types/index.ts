export type TaskState = 
  | 'PENDING'
  | 'PLANNING'
  | 'WAITING_FOR_APPROVAL'
  | 'RUNNING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'NEEDS_INPUT'
  | 'BLOCKED';

export interface TaskEvent {
  event_id: string;
  task_id: string;
  event_type: string;
  message: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface ApprovalRequest {
  approval_id: string;
  task_id: string;
  action_type: string;
  description: string;
  details: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  resolved_at?: string | null;
}

export interface TaskItem {
  task_id: string;
  title: string;
  prompt: string;
  workspace_path: string;
  state: TaskState;
  plan_steps: string[];
  active_agent: string | null;
  assigned_model: string | null;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  diff: string;
  has_pending_approval: boolean;
  pending_approval: ApprovalRequest | null;
}

export interface ModelCapability {
  model_id: string;
  provider: string;
  is_local: boolean;
  context_window: number;
  supports_tool_calling: boolean;
  supports_structured_output: boolean;
  supports_vision?: boolean;
  description: string;
}

export interface AgentInfo {
  agent_id: string;
  name: string;
  role_title?: string;
  description: string;
  permitted_tools?: string[];
  assigned_model?: string;
  is_active?: boolean;
  status?: string;
}

export interface PolicyConfig {
  profile_name: string;
  privacy_mode: string;
  preferred_model: string;
  fallback_model: string | null;
  temperature: number;
  max_tokens: number;
  max_task_duration_seconds: number;
  max_retries: number;
  allow_network_tools: boolean;
  allow_sensitive_file_inspection: boolean;
  allow_remote_context_transfer?: boolean;
  require_approval_for_commands: boolean;
  require_approval_for_file_writes?: boolean;
  require_approval_for_git_commits: boolean;
  agent_tool_allowlist?: Record<string, string[]>;
}

export interface HealthStatus {
  status: string;
  version: string;
  privacy_mode: string;
  policy_profile: string;
}

export interface WorkspaceFilesResponse {
  workspace_root: string;
  files: string[];
}

export interface HubProvider {
  provider_id: string;
  name: string;
  type: string;
  base_url: string;
  is_local: boolean;
  enabled: boolean;
  is_available: boolean;
  model_count: number;
  models: ModelCapability[];
}

export interface CodingAgentStatus {
  name: string;
  agent_id: string;
  category: string;
  cli_detected: boolean;
  cli_path: string | null;
  server_running?: boolean;
  server_url?: string;
  has_gateway_credentials?: boolean;
  gateway_url?: string;
  status: 'READY' | 'AUTHENTICATED' | 'SETUP_REQUIRED';
  capabilities: string[];
  setup_instructions: string[];
  integration_mode: string;
}
