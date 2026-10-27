import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Wrench,
  ScrollText,
  FolderGit2,
  Settings,
  Shield,
  Menu,
  X,
  Radio,
  Cpu,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  privacyMode: string;
  isBackendConnected: boolean;
  isOllamaConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  privacyMode,
  isBackendConnected,
  isOllamaConnected,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hub', label: 'Universal AI Hub', icon: Cpu },
    { id: 'agents', label: 'Agent Center', icon: Users },
    { id: 'tasks', label: 'Task Center', icon: ListTodo },
    { id: 'builder', label: 'Agent Builder', icon: Wrench },
    { id: 'activity', label: 'Activity & Logs', icon: ScrollText },
    { id: 'files', label: 'Files & Knowledge', icon: FolderGit2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(7, 9, 19, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Original FREEDOM AGENT Logo Treatment */}
        <div
          onClick={() => onSelectTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {/* Cybernetic Shield Icon Emblem */}
          <div
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              padding: '2px',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                backgroundColor: '#070913',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={20} color="#38bdf8" />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '17px',
                  fontWeight: '800',
                  letterSpacing: '0.5px',
                  background: 'linear-gradient(90deg, #ffffff 0%, #c7d2fe 60%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                FREEDOM AGENT
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 'bold',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  letterSpacing: '0.5px',
                }}
              >
                COMMAND CENTER
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block', letterSpacing: '0.2px' }}>
              Privacy-First Autonomous Multi-Agent Swarm
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px 6px',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 13px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: isSelected ? '600' : '500',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: isSelected ? '#a5b4fc' : '#94a3b8',
                  transition: 'all 0.15s ease',
                  borderBottom: isSelected ? '2px solid #6366f1' : '2px solid transparent',
                }}
              >
                <Icon size={15} color={isSelected ? '#818cf8' : '#64748b'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Live Connection & Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Real Backend Connection Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: isBackendConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              color: isBackendConnected ? '#34d399' : '#fb7185',
              border: `1px solid ${isBackendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}
            title={isBackendConnected ? 'Connected to Freedom Agent Runtime' : 'Backend connection unavailable'}
          >
            <Radio size={12} />
            <span>{isBackendConnected ? 'LIVE ENGINE' : 'DISCONNECTED'}</span>
          </div>

          {/* Local Model Daemon Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: isOllamaConnected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(148, 163, 184, 0.1)',
              color: isOllamaConnected ? '#38bdf8' : '#94a3b8',
              border: `1px solid ${isOllamaConnected ? 'rgba(56, 189, 248, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
            }}
            title={isOllamaConnected ? 'Ollama local daemon detected on 127.0.0.1' : 'Ollama local daemon not detected'}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isOllamaConnected ? '#38bdf8' : '#64748b',
              }}
            />
            <span>{isOllamaConnected ? 'OLLAMA ON' : 'OLLAMA OFF'}</span>
          </div>

          {/* Privacy Mode Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor:
                privacyMode === 'LOCAL_ONLY'
                  ? 'rgba(6, 78, 59, 0.5)'
                  : 'rgba(120, 53, 15, 0.5)',
              color: privacyMode === 'LOCAL_ONLY' ? '#6ee7b7' : '#fde68a',
              border: `1px solid ${privacyMode === 'LOCAL_ONLY' ? '#059669' : '#d97706'}`,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: privacyMode === 'LOCAL_ONLY' ? '#34d399' : '#f59e0b',
              }}
            />
            {privacyMode}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              color: '#f8fafc',
              cursor: 'pointer',
            }}
            className="mobile-hamburger"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '16px 0',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: isSelected ? '600' : '500',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: isSelected ? '#a5b4fc' : '#94a3b8',
                  textAlign: 'left',
                }}
              >
                <Icon size={18} color={isSelected ? '#818cf8' : '#64748b'} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Responsive Style Tag for Desktop vs Mobile Nav */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-hamburger {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
