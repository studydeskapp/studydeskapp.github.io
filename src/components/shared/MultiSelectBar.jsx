import React from 'react';

function MultiSelectBar({ selectedCount, onComplete, onDelete, onReschedule, onCancel, darkMode }) {
  if (selectedCount === 0) return null;

  const bg = darkMode ? '#1C1F2B' : '#fff';
  const border = darkMode ? '#262B3C' : '#E2DDD6';
  const text = darkMode ? '#DDE2F5' : '#1B1F3B';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: '16px',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: darkMode 
          ? '0 10px 40px rgba(0,0,0,0.5)' 
          : '0 10px 40px rgba(0,0,0,0.15)',
        zIndex: 1000,
        animation: 'slideUpFade 0.3s ease-out'
      }}
    >
      <div style={{ 
        fontSize: '0.95rem', 
        fontWeight: '600', 
        color: text,
        minWidth: '120px'
      }}>
        {selectedCount} selected
      </div>

      <div style={{ 
        width: '1px', 
        height: '32px', 
        background: border 
      }} />

      <button
        onClick={onComplete}
        style={{
          padding: '8px 16px',
          background: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
      >
        ✓ Complete
      </button>

      <button
        onClick={onReschedule}
        style={{
          padding: '8px 16px',
          background: darkMode ? '#262B3C' : '#F3F4F6',
          color: text,
          border: `1.5px solid ${border}`,
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#1C1F2B' : '#E5E7EB'}
        onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? '#262B3C' : '#F3F4F6'}
      >
        📅 Reschedule
      </button>

      <button
        onClick={onDelete}
        style={{
          padding: '8px 16px',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
      >
        🗑️ Delete
      </button>

      <div style={{ 
        width: '1px', 
        height: '32px', 
        background: border 
      }} />

      <button
        onClick={onCancel}
        style={{
          padding: '8px 12px',
          background: 'none',
          color: text,
          border: 'none',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        Cancel
      </button>

      <style>{`
        @keyframes slideUpFade {
          from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MultiSelectBar;
