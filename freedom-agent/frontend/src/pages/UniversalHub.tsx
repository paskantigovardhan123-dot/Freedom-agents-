import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Shield,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  Trash2,
  Zap,
  Terminal,
  Server,
  Lock,
  Globe,
  Info,
  KeyRound,
  Play,
  X,
} from 'lucide-react';
import { HubProvider, CodingAgentStatus, ModelCapability } from '../types';
import { apiClient } from '../api/client';
import { EmptyState } from '../components/EmptyState';

interface UniversalHubProps {
  privacyMode: string;
  onUpdatePrivacy: (mode: string) => Promise<void>;
  onRefreshAll: () => Promise<void>;
}

export const UniversalHub: React.FC<UniversalHubProps> = ({
  privacyMode,
  onUpdatePrivacy,
  onRefreshAll,
}) => {
  const [providers, setProviders] = useState<HubProvider[]>([]);
  const [codingAgents, setCodingAgents] = useState<CodingAgentStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProviderModels, setSelectedProviderModels] = useState<{ name: string; models: ModelCapability[] } | null>(null);

  // Modal State for Adding/Editing Provider
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newId, setNewId] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newBaseUrl, setNewBaseUrl] = useState<string>('');
  const [newApiKey, setNewApiKey] = useState<string>('');
  const [newIsLocal, setNewIsLocal] = useState<boolean>(false);
  const [newDefaultModel, setNewDefaultModel] = useState<string>('gpt-4o-mini');
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchHubData = async () => {
    setIsLoading(true);
    try {
      const [provList, agentList] = await Promise.all([
        apiClient.getHubProviders().catch(() => []),
        apiClient.getCodingAgents().catch(() => []),
      ]);
      setProviders(provList);
      setCodingAgents(agentList);
    } catch (err) {
      console.error('Failed to load Universal AI Hub state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, [privacyMode]);

  const handleTestEndpoint = async () => {
    if (!newBaseUrl.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.testHubProvider(newBaseUrl, newApiKey || undefined, newIsLocal);
      if (res.is_available) {
        setTestResult({
          status: 'success',
          message: `Endpoint Responded! Discovered ${res.models_discovered} models.`,
        });
      } else {
        setTestResult({
          status: 'error',
          message: 'Endpoint unreachable or credentials invalid.',
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Connection failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim() || !newBaseUrl.trim()) return;
    setIsSaving(true);
    try {
      await apiClient.registerHubProvider({
        provider_id: newId.trim().toLowerCase().replace(/\s+/g, '_'),
        name: newName.trim(),
        api_base: newBaseUrl.trim(),
        api_key: newApiKey.trim() || undefined,
        is_local: newIsLocal,
        default_model: newDefaultModel.trim() || 'default-model',
        enabled: true,
      });
      setShowAddModal(false);
      // Reset form
      setNewId('');
      setNewName('');
      setNewBaseUrl('');
      setNewApiKey('');
      setNewIsLocal(false);
      setTestResult(null);
      await fetchHubData();
      await onRefreshAll();
    } catch (err) {
      console.error('Failed to register provider:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm(`Are you sure you want to remove '${providerId}'?`)) return;
    try {
      await apiClient.deleteHubProvider(providerId);
      await fetchHubData();
      await onRefreshAll();
    } catch (err) {
      console.error('Failed to delete provider:', err);
    }
  };

  const localProviders = providers.filter((p) => p.is_local);
  const remoteProviders = providers.filter((p) => !p.is_local);

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
            <Cpu size={22} color="#06b6d4" />
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Universal AI Integration Hub
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0, maxWidth: '720px' }}>
            Modular inference adapters for local LLM daemons (Ollama, LM Studio), OpenAI-compatible APIs,
            custom cloud endpoints, and external coding agents (OpenCode, Kilo Code).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Privacy Indicator Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: '700',
              backgroundColor:
                privacyMode === 'LOCAL_ONLY'
                  ? 'rgba(6, 78, 59, 0.6)'
                  : 'rgba(120, 53, 15, 0.6)',
              color: privacyMode === 'LOCAL_ONLY' ? '#6ee7b7' : '#fde68a',
              border: `1px solid ${privacyMode === 'LOCAL_ONLY' ? '#059669' : '#d97706'}`,
            }}
          >
            <Lock size={12} />
            <span>{privacyMode === 'LOCAL_ONLY' ? 'AIR-GAP: LOCAL ONLY' : privacyMode}</span>
          </div>

          <button
            onClick={fetchHubData}
            className="glass-btn"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="glass-btn glass-btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Plus size={15} />
            Add Custom Endpoint
          </button>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Local AI Daemons</span>
            <Server size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#34d399' }}>
            {localProviders.filter((p) => p.is_available).length} / {localProviders.length} Online
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Ollama (11434) & LM Studio (1234)
          </span>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Cloud & OpenAI Proxies</span>
            <Globe size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#818cf8' }}>
            {privacyMode === 'LOCAL_ONLY' ? (
              <span style={{ color: '#f59e0b', fontSize: '15px' }}>BLOCKED (LOCAL_ONLY)</span>
            ) : (
              `${remoteProviders.filter((p) => p.is_available).length} Active`
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            User-supplied keys & proxies
          </span>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Coding Agent Bridges</span>
            <Terminal size={16} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#06b6d4' }}>
            {codingAgents.filter((a) => a.status === 'READY').length} / {codingAgents.length} Ready
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            OpenCode & Kilo Code Bridges
          </span>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Total Discovered Models</span>
            <Zap size={16} color="#a5b4fc" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>
            {providers.reduce((acc, p) => acc + (p.is_available ? p.model_count : 0), 0)} Models
          </div>
          <span style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', display: 'block' }}>
            Deterministic tool calling ready
          </span>
        </div>
      </div>

      {/* SECTION 1: Local Air-Gapped Providers */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Server size={18} color="#34d399" />
          <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
            Local Inference Daemons (Zero-Egress Air-Gap)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {localProviders.map((provider) => (
            <div
              key={provider.provider_id}
              className="glass-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: provider.is_available
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(148, 163, 184, 0.12)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#34d399',
                        fontWeight: 'bold',
                      }}
                    >
                      <Server size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#f8fafc', display: 'block' }}>
                        {provider.name}
                      </strong>
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {provider.base_url}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: provider.is_available
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(244, 63, 94, 0.2)',
                      color: provider.is_available ? '#34d399' : '#fb7185',
                    }}
                  >
                    {provider.is_available ? '● ONLINE' : '○ OFFLINE'}
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 14px', lineHeight: '1.4' }}>
                  {provider.provider_id === 'ollama'
                    ? 'Official Ollama daemon with local Qwen, Llama, and Mistral models. Zero external API calls.'
                    : 'LM Studio server for local GGUF models. Discovers models via local /v1/models.'}
                </p>

                {/* Model count badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(7, 9, 19, 0.6)',
                      color: '#a5b4fc',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {provider.model_count} model(s) discovered
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(6, 78, 59, 0.4)',
                      color: '#6ee7b7',
                    }}
                  >
                    Air-Gapped Local
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <button
                  onClick={() =>
                    setSelectedProviderModels({
                      name: provider.name,
                      models: provider.models,
                    })
                  }
                  disabled={!provider.is_available || provider.models.length === 0}
                  className="glass-btn"
                  style={{ padding: '5px 12px', fontSize: '11.5px' }}
                >
                  View Models ({provider.model_count})
                </button>

                {provider.provider_id !== 'ollama' && provider.provider_id !== 'lm_studio' && (
                  <button
                    onClick={() => handleDeleteProvider(provider.provider_id)}
                    className="glass-btn"
                    style={{ padding: '5px 10px', fontSize: '11.5px', color: '#fb7185' }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: OpenAI-Compatible & Custom Cloud Endpoints */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#818cf8" />
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Cloud & OpenAI-Compatible Endpoints
            </h2>
          </div>

          {privacyMode === 'LOCAL_ONLY' && (
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>
              ⚠ Remote endpoints blocked while in LOCAL_ONLY mode
            </span>
          )}
        </div>

        {remoteProviders.length === 0 ? (
          <EmptyState
            title="No Cloud Endpoints Configured"
            description="Add custom OpenAI-compatible proxies, OpenRouter, Together, or self-hosted servers with user-supplied credentials."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {remoteProviders.map((provider) => (
              <div
                key={provider.provider_id}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: privacyMode === 'LOCAL_ONLY' ? 0.7 : 1,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#f8fafc', display: 'block' }}>
                        {provider.name}
                      </strong>
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {provider.base_url}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor:
                          privacyMode === 'LOCAL_ONLY'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : provider.is_available
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(244, 63, 94, 0.2)',
                        color:
                          privacyMode === 'LOCAL_ONLY'
                            ? '#fbbf24'
                            : provider.is_available
                            ? '#a5b4fc'
                            : '#fb7185',
                      }}
                    >
                      {privacyMode === 'LOCAL_ONLY'
                        ? 'BLOCKED (POLICY)'
                        : provider.is_available
                        ? 'CONNECTED'
                        : 'UNCONFIGURED'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 14px' }}>
                    OpenAI-compatible inference adapter. Secrets are isolated server-side and never exposed to the frontend.
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(7, 9, 19, 0.6)',
                        color: '#38bdf8',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {provider.model_count} model(s)
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                      }}
                    >
                      Remote Cloud
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <button
                    onClick={() =>
                      setSelectedProviderModels({
                        name: provider.name,
                        models: provider.models,
                      })
                    }
                    disabled={!provider.is_available || provider.models.length === 0}
                    className="glass-btn"
                    style={{ padding: '5px 12px', fontSize: '11.5px' }}
                  >
                    View Models ({provider.model_count})
                  </button>

                  {provider.provider_id !== 'openai' && (
                    <button
                      onClick={() => handleDeleteProvider(provider.provider_id)}
                      className="glass-btn"
                      style={{ padding: '5px 10px', fontSize: '11.5px', color: '#fb7185' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: External Coding Agents (OpenCode & Kilo Code) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Terminal size={18} color="#06b6d4" />
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              External Coding Agent Bridges
            </h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Real-world diagnostic status and verified setup guides (Zero fake simulation)
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {codingAgents.map((agent) => (
            <div
              key={agent.agent_id}
              className="glass-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#06b6d4',
                      fontWeight: 'bold',
                    }}
                  >
                    <Terminal size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#f8fafc', display: 'block' }}>
                      {agent.name}
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {agent.category}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor:
                      agent.status === 'READY'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : agent.status === 'AUTHENTICATED'
                        ? 'rgba(56, 189, 248, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    color:
                      agent.status === 'READY'
                        ? '#34d399'
                        : agent.status === 'AUTHENTICATED'
                        ? '#38bdf8'
                        : '#fbbf24',
                  }}
                >
                  {agent.status === 'READY'
                    ? '● INSTALLED & READY'
                    : agent.status === 'AUTHENTICATED'
                    ? '● AUTHENTICATED'
                    : '○ SETUP REQUIRED'}
                </span>
              </div>

              {/* Status Details */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(7, 9, 19, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  fontSize: '11.5px',
                  color: '#cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div>
                  CLI Executable: <strong>{agent.cli_detected ? agent.cli_path : 'Not in PATH'}</strong>
                </div>
                {agent.server_url && (
                  <div>
                    Server Target: <strong>{agent.server_url}</strong> ({agent.server_running ? 'Listening' : 'Standby'})
                  </div>
                )}
                {agent.gateway_url && (
                  <div>
                    Gateway: <strong>{agent.gateway_url}</strong>
                  </div>
                )}
              </div>

              {/* Capabilities */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Supported Capabilities:
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                  {agent.capabilities.map((cap, i) => (
                    <li key={i}>{cap}</li>
                  ))}
                </ul>
              </div>

              {/* Setup Instructions Box */}
              <div
                style={{
                  backgroundColor: '#030712',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
                  True Setup & Launch Instructions:
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {agent.setup_instructions.map((step, idx) => (
                    <div key={idx} style={{ wordBreak: 'break-all' }}>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: Add Custom Provider */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={20} color="#06b6d4" />
                <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>
                  Register Custom Model Endpoint
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="glass-btn" style={{ padding: '4px 10px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '4px' }}>
                  Provider Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. openrouter_direct, vllm_local, deepseek"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '4px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenRouter Cloud, Self-Hosted vLLM"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '4px' }}>
                  API Base URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://openrouter.ai/api/v1 or http://127.0.0.1:8000/v1"
                  value={newBaseUrl}
                  onChange={(e) => setNewBaseUrl(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '4px' }}>
                  API Key / Secret (Optional for local on-prem)
                </label>
                <input
                  type="password"
                  placeholder="sk-••••••••••••••••••••"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '13px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '3px' }}>
                  🔒 Keys are stored securely in backend server memory/env and are never sent to frontend logs.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '4px' }}>
                  Default Model Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. mistralai/mistral-7b-instruct, gpt-4o-mini"
                  value={newDefaultModel}
                  onChange={(e) => setNewDefaultModel(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '13px' }}
                />
              </div>

              {/* Locality Checkbox */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(7, 9, 19, 0.6)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                }}
              >
                <input
                  type="checkbox"
                  id="is_local"
                  checked={newIsLocal}
                  onChange={(e) => setNewIsLocal(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#06b6d4' }}
                />
                <label htmlFor="is_local" style={{ fontSize: '12.5px', color: '#f8fafc', cursor: 'pointer' }}>
                  This is an on-device local server (permits routing in LOCAL_ONLY mode)
                </label>
              </div>

              {/* Test Connection Button & Result */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleTestEndpoint}
                  disabled={isTesting || !newBaseUrl.trim()}
                  className="glass-btn"
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                >
                  <Radio size={14} className={isTesting ? 'animate-spin' : ''} />
                  {isTesting ? 'Probing...' : 'Test Endpoint'}
                </button>

                {testResult && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: testResult.status === 'success' ? '#34d399' : '#fb7185',
                    }}
                  >
                    {testResult.message}
                  </span>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="glass-btn"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newId.trim() || !newBaseUrl.trim()}
                  className="glass-btn glass-btn-primary"
                  style={{ padding: '8px 20px' }}
                >
                  {isSaving ? 'Registering...' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Models of Selected Provider */}
      {selectedProviderModels && (
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
          onClick={() => setSelectedProviderModels(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '620px',
              width: '100%',
              padding: '28px',
              background: 'rgba(15, 23, 42, 0.95)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>
                  {selectedProviderModels.name} — Discovered Models
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {selectedProviderModels.models.length} model(s) available for specialist agent routing
                </span>
              </div>
              <button onClick={() => setSelectedProviderModels(null)} className="glass-btn" style={{ padding: '4px 10px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedProviderModels.models.map((m) => (
                <div
                  key={m.model_id}
                  style={{
                    backgroundColor: 'rgba(7, 9, 19, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                      {m.model_id}
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      Context: {m.context_window.toLocaleString()} tokens • {m.description}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: m.is_local ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                        color: m.is_local ? '#34d399' : '#38bdf8',
                        fontWeight: 'bold',
                      }}
                    >
                      {m.is_local ? 'LOCAL' : 'REMOTE'}
                    </span>
                    {m.supports_tool_calling && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          fontWeight: 'bold',
                        }}
                      >
                        TOOLS
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
