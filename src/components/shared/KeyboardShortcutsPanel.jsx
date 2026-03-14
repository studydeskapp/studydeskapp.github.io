import React from 'react';

function KeyboardShortcutsPanel({ show, onClose, darkMode }) {
  if (!show) return null;

  const shortcuts = [
    { key: 'N', description: 'Add new assignment' },
    { key: 'C', description: 'Add new class' },
    { key: 'I', description: 'Import assignments' },
    { key: 'S', description: 'Canvas sync' },
    { key: 'M', description: 'Multi-select mode (Assignments tab)' },
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'Esc', description: 'Close modals' },
    { key: '1-9', description: 'Switch to tab (1=Dashboard, 2=Assignments, etc.)' },
    { key: 'J/K', description: 'Navigate between tabs' },
  ];

  const bg = darkMode ? 'rgba(0,0,0,.85)' : 'rgba(0,0,0,.5)';
  const card = darkMode ? '#161921' : '#fff';
  const border = darkMode ? '#262B3C' : '#E2DDD6';
  const text = darkMode ? '#DDE2F5' : '#1B1F3B';
  const text2 = darkMode ? '#9CA3AF' : '#6B7280';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: card,
          border: `1.5px solid ${border}`,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'slideUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: text, margin: 0 }}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: text2,
              padding: '4px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: darkMode ? '#1C1F2B' : '#F9FAFB',
                borderRadius: '10px',
                border: `1px solid ${border}`
              }}
            >
              <span style={{ color: text, fontSize: '0.9rem' }}>{shortcut.description}</span>
              <kbd
                style={{
                  background: darkMode ? '#262B3C' : '#fff',
                  border: `1.5px solid ${border}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: text,
                  fontFamily: 'monospace',
                  boxShadow: darkMode ? 'none' : '0 2px 0 rgba(0,0,0,0.1)',
                  minWidth: '40px',
                  textAlign: 'center'
                }}
              >
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
            borderRadius: '10px',
            fontSize: '0.8rem',
            color: text2,
            textAlign: 'center'
          }}
        >
          💡 Tip: Press <kbd style={{ padding: '2px 6px', background: darkMode ? '#262B3C' : '#fff', borderRadius: '4px', fontWeight: '600' }}>?</kbd> anytime to see this panel
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default KeyboardShortcutsPanel;
