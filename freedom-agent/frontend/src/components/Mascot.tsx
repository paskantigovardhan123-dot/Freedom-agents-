import React, { useState } from 'react';

interface MascotProps {
  status?: 'idle' | 'executing' | 'approval' | 'error';
  currentTaskTitle?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  status = 'idle',
  currentTaskTitle,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "Privacy Guard: Running in Local Only mode ensures 0 external network egress.",
    "Human Approval: Commands like 'rm' and 'git commit' will pause for your confirmation.",
    "Multi-Agent Synergy: The Software Architect plans minimal diffs before Developer codes.",
    "Deterministic State: Tasks flow strictly through verifiable steps with test validation.",
    "Air-Gapped: Ollama local models keep all source code securely on your machine.",
  ];

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % tips.length);
  };

  const getBeaconColor = () => {
    switch (status) {
      case 'executing':
        return '#8b5cf6'; // Violet pulse
      case 'approval':
        return '#f59e0b'; // Amber warning
      case 'error':
        return '#f43f5e'; // Rose
      default:
        return '#10b981'; // Emerald ready
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Animated Robot Avatar Container */}
      <div
        className="animate-float"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleNextTip}
        style={{
          position: 'relative',
          width: '56px',
          height: '56px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title="Click me for a pro tip!"
      >
        {/* Outer Glow Halo */}
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${getBeaconColor()}40 0%, transparent 70%)`,
            filter: 'blur(6px)',
            transition: 'background 0.3s',
          }}
        />

        {/* Mascot Head Body */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '16px',
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: `2px solid ${isHovered ? '#06b6d4' : 'rgba(99, 102, 241, 0.4)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.1), 0 6px 12px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
        >
          {/* Antenna / Beacon */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getBeaconColor(),
              boxShadow: `0 0 8px ${getBeaconColor()}`,
              transition: 'background-color 0.3s',
            }}
          />

          {/* Visor Screen */}
          <div
            style={{
              width: '40px',
              height: '22px',
              borderRadius: '8px',
              backgroundColor: '#020617',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '6px',
            }}
          >
            {/* Left Eye */}
            <div
              style={{
                width: isHovered ? '8px' : '6px',
                height: isHovered ? '3px' : '6px',
                borderRadius: isHovered ? '2px' : '50%',
                backgroundColor: '#06b6d4',
                boxShadow: '0 0 6px #06b6d4',
                transition: 'all 0.15s ease',
              }}
            />
            {/* Right Eye */}
            <div
              style={{
                width: isHovered ? '8px' : '6px',
                height: isHovered ? '3px' : '6px',
                borderRadius: isHovered ? '2px' : '50%',
                backgroundColor: '#06b6d4',
                boxShadow: '0 0 6px #06b6d4',
                transition: 'all 0.15s ease',
              }}
            />
          </div>

          {/* Chin Plate */}
          <div
            style={{
              width: '18px',
              height: '2px',
              backgroundColor: 'rgba(148, 163, 184, 0.4)',
              borderRadius: '1px',
              marginTop: '4px',
            }}
          />
        </div>
      </div>

      {/* Mascot Speech Bubble & Context */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#c7d2fe' }}>
            Cipher <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(Guardian Bot)</span>
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: `${getBeaconColor()}20`,
              color: getBeaconColor(),
              border: `1px solid ${getBeaconColor()}40`,
            }}
          >
            {status}
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
          {currentTaskTitle ? (
            <>
              Working on: <strong style={{ color: '#f8fafc' }}>{currentTaskTitle}</strong>
            </>
          ) : (
            tips[tipIndex]
          )}
        </p>
      </div>

      {/* Interactive Pro Tip Switcher */}
      <button
        onClick={handleNextTip}
        style={{
          background: 'transparent',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          color: '#94a3b8',
          fontSize: '11px',
          padding: '4px 10px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#38bdf8';
          e.currentTarget.style.borderColor = '#06b6d4';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#94a3b8';
          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        }}
      >
        Tip 💡
      </button>
    </div>
  );
};
