import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  FileCode,
  Search,
  BookOpen,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Shield,
  Layers,
  Database,
  Terminal,
  Info,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { EmptyState } from '../components/EmptyState';

export const FilesKnowledge: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'knowledge'>('files');
  const [workspaceRoot, setWorkspaceRoot] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const fetchFileList = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await apiClient.getWorkspaceFiles();
      setWorkspaceRoot(res.workspace_root || '');
      setFiles(res.files || []);
      if (res.files && res.files.length > 0 && !selectedFile) {
        handleSelectFile(res.files[0]);
      }
    } catch (err) {
      console.error('Failed to load workspace files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSelectFile = async (filePath: string) => {
    setSelectedFile(filePath);
    setIsLoadingContent(true);
    try {
      const res = await apiClient.getWorkspaceFile(filePath);
      setFileContent(res.content || '');
    } catch (err) {
      console.error('Failed to read file:', err);
      setFileContent(`[Error reading ${filePath}]`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchFileList();
  }, []);

  const filteredFiles = files.filter((f) =>
    f.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const copyToClipboard = () => {
    if (!fileContent) return;
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Top Banner & Sub-Tabs */}
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
            <FolderGit2 size={20} color="#818cf8" />
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Files & Knowledge Explorer
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
            Inspect real workspace source code and observe zero-trust privacy boundaries for external knowledge bases.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveSubTab('files')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeSubTab === 'files' ? '700' : '500',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'files' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.5)',
              color: activeSubTab === 'files' ? '#c7d2fe' : '#94a3b8',
              borderBottom: activeSubTab === 'files' ? '2px solid #6366f1' : '2px solid transparent',
            }}
          >
            <FileCode size={15} />
            Workspace Source ({files.length})
          </button>
          <button
            onClick={() => setActiveSubTab('knowledge')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeSubTab === 'knowledge' ? '700' : '500',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'knowledge' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.5)',
              color: activeSubTab === 'knowledge' ? '#c7d2fe' : '#94a3b8',
              borderBottom: activeSubTab === 'knowledge' ? '2px solid #6366f1' : '2px solid transparent',
            }}
          >
            <BookOpen size={15} />
            Knowledge Base / RAG
          </button>
        </div>
      </div>

      {activeSubTab === 'files' ? (
        /* Workspace Files Browser */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Left Column: File Tree */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                Workspace Tree
              </h3>
              <button onClick={fetchFileList} className="glass-btn" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <RefreshCw size={12} className={isLoadingFiles ? 'animate-spin' : ''} />
              </button>
            </div>

            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Root: {workspaceRoot || 'Default Sandbox Workspace'}
            </span>

            {/* Search Filter */}
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                color="#64748b"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter files..."
                className="glass-input"
                style={{ paddingLeft: '30px', fontSize: '12px' }}
              />
            </div>

            {/* File List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                maxHeight: '520px',
                overflowY: 'auto',
              }}
            >
              {filteredFiles.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#64748b', padding: '10px' }}>
                  No matching files found.
                </span>
              ) : (
                filteredFiles.map((f) => {
                  const isSelected = selectedFile === f;
                  return (
                    <div
                      key={f}
                      onClick={() => handleSelectFile(f)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                        border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FileCode size={14} color={isSelected ? '#38bdf8' : '#94a3b8'} />
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontFamily: 'var(--font-mono)',
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Code Viewer */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Workspace Source Viewer
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '15px', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  {selectedFile || 'No file selected'}
                </h3>
              </div>

              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {fileContent.split('\n').length} lines • {fileContent.length} bytes
                  </span>
                  <button onClick={copyToClipboard} className="glass-btn" style={{ padding: '6px 12px', fontSize: '11.5px' }}>
                    {copied ? (
                      <>
                        <Check size={13} color="#34d399" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy Content
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {isLoadingContent ? (
              <div className="skeleton-shimmer" style={{ height: '360px', width: '100%' }} />
            ) : selectedFile ? (
              <div
                style={{
                  backgroundColor: '#040714',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '8px',
                  padding: '14px',
                  maxHeight: '520px',
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#e2e8f0',
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {fileContent}
                </pre>
              </div>
            ) : (
              <EmptyState title="Select a File" description="Pick any file from the workspace tree to view its source." />
            )}
          </div>
        </div>
      ) : (
        /* Knowledge Base / RAG Unavailable State (Required by prompt) */
        <div
          className="glass-panel"
          style={{
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <Database size={32} color="#f59e0b" />
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#fbbf24',
              padding: '3px 10px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              marginBottom: '10px',
            }}
          >
            Component Not Initialized
          </span>

          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', margin: '0 0 10px' }}>
            External Vector Knowledge Store Not Configured
          </h2>

          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '600px', margin: '0 0 24px' }}>
            Freedom Agent is strictly operating in <strong style={{ color: '#34d399' }}>Zero-Egress Local Mode</strong>.
            External vector databases (ChromaDB, Pinecone, or cloud embeddings) are intentionally unprovisioned to
            guarantee no unverified source embeddings are transmitted to remote cloud endpoints.
          </p>

          <div
            style={{
              width: '100%',
              backgroundColor: 'rgba(7, 9, 19, 0.7)',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Info size={16} color="#38bdf8" />
              <strong style={{ fontSize: '13px', color: '#f8fafc' }}>
                How Specialists Perform Research Currently
              </strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <li>
                <strong>Direct Workspace Inspection:</strong> The Software Architect and Developer agents read local project source files directly via the sandboxed <code>read_file</code> and <code>search_files</code> tools.
              </li>
              <li>
                <strong>Offline Docs Tool:</strong> The Research agent uses the offline <code>query_local_docs</code> tool to scan bundled markdown and Python docstrings.
              </li>
              <li>
                <strong>Fail-Closed Guarantee:</strong> No external vector indexing calls can leak credentials or proprietary algorithms.
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setActiveSubTab('files')}
              className="glass-btn glass-btn-primary"
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              <FileCode size={15} />
              Return to Workspace Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
