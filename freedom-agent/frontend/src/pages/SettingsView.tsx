import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Radio,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Moon,
  Eye,
  Lock,
} from 'lucide-react';
import { PolicyConfig, ModelCapability, HealthStatus } from '../types';
import { apiClient } from '../api/client';

interface SettingsViewProps {
  policies: PolicyConfig | null;
  models: ModelCapability[];
  privacyMode: string;
  isBackendConnected: boolean;
  providerStatus: Record<string, boolean>;
  onUpdatePolicy: (profile: string) => Promise<void>;
  onUpdatePrivacy: (mode: string) => Promise<void>;
  onRefreshAll: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  policies,
  models,
  privacyMode,
  isBackendConnected,
  providerStatus,
  onUpdatePolicy,
  onUpdatePrivacy,
  onRefreshAll,
}) => {
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState<boolean>(false);
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState<boolean>(false);

  const handleTestBackend = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const health: HealthStatus = await apiClient.getHealth();
      setTestResult(`Daemon Healthy: v${health.version} • Privacy: ${health.privacy_mode} • Profile: ${health.policy_profile}`);
      await onRefreshAll();
    } catch (err: any) {
      setTestResult(`Connection Failed: ${err.message || 'Offline'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handlePrivacySelect = async (mode: string) => {
    setIsUpdatingPrivacy(true);
    try {
      await onUpdatePrivacy(mode);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handlePolicySelect = async (profile: string) => {
    setIsUpdatingPolicy(true);
    try {
      await onUpdatePolicy(profile);
    } finally {
      setIsUpdatingPolicy(false);
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
            <Settings size={20} color="#818cf8" />
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              System & Policy Settings
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
            Configure LLM inference endpoints, fail-closed privacy tiers, zero-trust permission profiles, and UI appearance.
          </p>
        </div>

        <button
          onClick={handleTestBackend}
          disabled={testingConnection}
          className="glass-btn glass-btn-primary"
          style={{ padding: '9px 18px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={testingConnection ? 'animate-spin' : ''} />
          {testingConnection ? 'Pinging Daemon...' : 'Test Backend Connection'}
        </button>
      </div>

      {testResult && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: testResult.includes('Healthy') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: `1px solid ${testResult.includes('Healthy') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: testResult.includes('Healthy') ? '#34d399' : '#fb7185',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {testResult.includes('Healthy') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{testResult}</span>
        </div>
      )}

      {/* Grid: Privacy & Backend Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Backend & Model Connection */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
              Backend & Provider Connectivity
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* FastAPI Daemon */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(7, 9, 19, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ fontSize: '13.5px', color: '#f8fafc', display: 'block' }}>
                  FastAPI Freedom Agent Core
                </strong>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>http://127.0.0.1:8000</span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: isBackendConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                  color: isBackendConnected ? '#34d399' : '#fb7185',
                }}
              >
                {isBackendConnected ? 'CONNECTED' : 'UNREACHABLE'}
              </span>
            </div>

            {/* Ollama Local Engine */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(7, 9, 19, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ fontSize: '13.5px', color: '#f8fafc', display: 'block' }}>
                  Ollama Local LLM Daemon
                </strong>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>http://127.0.0.1:11434</span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: providerStatus['ollama'] ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                  color: providerStatus['ollama'] ? '#34d399' : '#fb7185',
                }}
              >
                {providerStatus['ollama'] ? 'ONLINE' : 'NOT DETECTED'}
              </span>
            </div>

            {/* Hosted Fallback Provider */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(7, 9, 19, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ fontSize: '13.5px', color: '#f8fafc', display: 'block' }}>
                  Hosted Remote Fallback
                </strong>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>OpenAI / Anthropic Compatible</span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: providerStatus['openai'] ? 'rgba(56, 189, 248, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  color: providerStatus['openai'] ? '#38bdf8' : '#94a3b8',
                }}
              >
                {providerStatus['openai'] ? 'CONFIGURED' : 'UNCONFIGURED'}
              </span>
            </div>
          </div>
        </div>

        {/* Privacy Mode Selector */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
              Fail-Closed Privacy Tiers
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                id: 'LOCAL_ONLY',
                title: 'LOCAL ONLY (Strict Air-Gap)',
                desc: 'Requests are strictly locked to 127.0.0.1. Remote network calls fail closed with 403 Forbidden.',
                color: '#34d399',
              },
              {
                id: 'PRIVATE_HYBRID',
                title: 'PRIVATE HYBRID',
                desc: 'Local model prioritized; authorized documentation research tools can access approved endpoints.',
                color: '#f59e0b',
              },
              {
                id: 'HOSTED_DIRECT',
                title: 'HOSTED DIRECT',
                desc: 'Direct calls to hosted models when local daemon is under heavy load or unavailable.',
                color: '#818cf8',
              },
            ].map((p) => {
              const isSelected = privacyMode === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handlePrivacySelect(p.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(7, 9, 19, 0.6)',
                    border: `1px solid ${isSelected ? p.color : 'rgba(148, 163, 184, 0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <strong style={{ fontSize: '13px', color: isSelected ? p.color : '#f8fafc' }}>
                      {p.title}
                    </strong>
                    {isSelected && (
                      <span style={{ fontSize: '10.5px', color: p.color, fontWeight: 'bold' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4', display: 'block' }}>
                    {p.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Policy Profiles Switcher */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sliders size={18} color="#818cf8" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
            Zero-Trust Policy Profiles
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {[
            {
              id: 'Conservative',
              desc: 'Read-only inspection by default. Strict approvals required for all file modifications and terminal runs.',
            },
            {
              id: 'Developer',
              desc: 'Standard engineering workflow: automatic patch synthesis, test execution, and safe subprocesses.',
            },
            {
              id: 'Research',
              desc: 'Focused on codebase topology mapping, architectural planning, and documentation lookups.',
            },
            {
              id: 'Local Experimentation',
              desc: 'Rapid local iteration with higher retry budgets and relaxed interactive command prompts.',
            },
          ].map((profile) => {
            const isSelected = policies?.profile_name === profile.id;
            return (
              <div
                key={profile.id}
                onClick={() => handlePolicySelect(profile.id)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(7, 9, 19, 0.6)',
                  border: `1px solid ${isSelected ? '#6366f1' : 'rgba(148, 163, 184, 0.12)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '14px', color: isSelected ? '#a5b4fc' : '#f8fafc' }}>
                    {profile.id}
                  </strong>
                  {isSelected && (
                    <span style={{ fontSize: '10.5px', color: '#818cf8', fontWeight: 'bold' }}>
                      ENFORCED
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                  {profile.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Models List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Cpu size={18} color="#06b6d4" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
            Configured Model Registry ({models.length} Registered)
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {models.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#64748b' }}>No models currently registered.</span>
          ) : (
            models.map((m) => (
              <div
                key={m.model_id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(7, 9, 19, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                    {m.model_id}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '12px' }}>
                    Provider: {m.provider} • Context: {m.context_window.toLocaleString()} tokens
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: m.is_local ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: m.is_local ? '#34d399' : '#38bdf8',
                      fontWeight: 'bold',
                    }}
                  >
                    {m.is_local ? 'LOCAL' : 'HOSTED'}
                  </span>
                  {m.supports_tool_calling && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '12px',
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};
