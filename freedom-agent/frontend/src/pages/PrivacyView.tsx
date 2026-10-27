import React from 'react';

interface PrivacyViewProps {
  currentMode: string;
  onUpdatePrivacy: (mode: string) => Promise<void>;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ currentMode, onUpdatePrivacy }) => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Privacy & Security Governance</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
          Freedom Agent is architected with a strict privacy-first principle: no outbound requests or code leaks occur without verified, explicit user consent.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          {
            id: 'LOCAL_ONLY',
            title: '1. LOCAL ONLY (Default & Recommended)',
            desc: 'Routes all prompts exclusively to local Ollama on 127.0.0.1. Network egress for models and research is completely disabled. Fails closed if Ollama is unreachable.',
            badge: 'Air-Gapped Ready',
            badgeBg: '#064e3b',
            badgeColor: '#34d399',
          },
          {
            id: 'PRIVATE_HYBRID',
            title: '2. PRIVATE HYBRID',
            desc: 'Prefers local models for code generation. If an external model is requested, explicit prompt consent is required before transmitting project context.',
            badge: 'Consent Required',
            badgeBg: '#78350f',
            badgeColor: '#fde68a',
          },
          {
            id: 'HOSTED',
            title: '3. HOSTED PROVIDERS',
            desc: 'Connects to configured remote OpenAI-compatible endpoints. Secrets are redacted automatically before leaving the sandbox.',
            badge: 'Remote Cloud',
            badgeBg: '#1e3a5f',
            badgeColor: '#93c5fd',
          },
        ].map(mode => (
          <div
            key={mode.id}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              border: `1px solid ${currentMode === mode.id ? '#10b981' : '#1e293b'}`,
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{mode.title}</h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: mode.badgeBg,
                  color: mode.badgeColor
                }}>
                  {mode.badge}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                {mode.desc}
              </p>
            </div>

            <button
              onClick={() => onUpdatePrivacy(mode.id)}
              disabled={currentMode === mode.id}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: currentMode === mode.id ? '#065f46' : '#1e293b',
                color: currentMode === mode.id ? '#34d399' : '#cbd5e1',
                fontWeight: '600',
                fontSize: '13px',
                cursor: currentMode === mode.id ? 'default' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {currentMode === mode.id ? 'Active Mode' : 'Activate'}
            </button>
          </div>
        ))}
      </div>

      {/* Security sandbox protections list */}
      <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Active Sandbox Security Guarantees</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '13px', color: '#cbd5e1' }}>
          <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <span style={{ fontWeight: '600', color: '#38bdf8' }}>✓ Path Traversal Protection</span>
            <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>All operations are strictly validated against canonical workspace boundaries.</p>
          </div>
          <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <span style={{ fontWeight: '600', color: '#38bdf8' }}>✓ Secret Redaction Engine</span>
            <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>API keys, GitHub PATs, and bearer tokens are automatically masked from all logs.</p>
          </div>
          <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <span style={{ fontWeight: '600', color: '#38bdf8' }}>✓ Human Approval Gate</span>
            <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Risky commands (rm, git commit, git push) pause for interactive user confirmation.</p>
          </div>
          <div style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <span style={{ fontWeight: '600', color: '#38bdf8' }}>✓ No Self-Elevation</span>
            <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Agents cannot modify their own permissions or transition state outside deterministic code rules.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
