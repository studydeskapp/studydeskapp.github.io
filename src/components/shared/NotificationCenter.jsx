import React, { useMemo } from 'react';

function NotificationCenter({ show, onClose, assignments, darkMode, onAssignmentClick }) {
  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notifs = [];
    
    // Overdue assignments
    assignments.forEach(a => {
      if (a.progress < 100 && a.dueDate) {
        const due = new Date(a.dueDate + 'T00:00:00');
        const daysLate = Math.floor((today - due) / (1000 * 60 * 60 * 24));
        
        if (daysLate > 0) {
          notifs.push({
            id: a.id,
            type: 'overdue',
            title: a.title,
            subject: a.subject,
            message: `${daysLate} day${daysLate > 1 ? 's' : ''} overdue`,
            priority: 'high',
            assignment: a
          });
        } else if (daysLate === 0) {
          notifs.push({
            id: a.id,
            type: 'due-today',
            title: a.title,
            subject: a.subject,
            message: 'Due today',
            priority: 'medium',
            assignment: a
          });
        } else if (daysLate >= -2) {
          notifs.push({
            id: a.id,
            type: 'upcoming',
            title: a.title,
            subject: a.subject,
            message: `Due in ${Math.abs(daysLate)} day${Math.abs(daysLate) > 1 ? 's' : ''}`,
            priority: 'low',
            assignment: a
          });
        }
      }
    });
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return notifs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [assignments]);

  if (!show) return null;

  const bg = darkMode ? 'rgba(0,0,0,.85)' : 'rgba(0,0,0,.5)';
  const card = darkMode ? '#161921' : '#fff';
  const border = darkMode ? '#262B3C' : '#E2DDD6';
  const text = darkMode ? '#DDE2F5' : '#1B1F3B';
  const text2 = darkMode ? '#9CA3AF' : '#6B7280';

  const getNotifColor = (type) => {
    if (type === 'overdue') return { bg: darkMode ? '#350000' : '#FEF2F2', border: darkMode ? '#7F1D1D' : '#FCA5A5', text: darkMode ? '#F87171' : '#DC2626' };
    if (type === 'due-today') return { bg: darkMode ? '#261200' : '#FFFBEB', border: darkMode ? '#78350F' : '#FDE68A', text: darkMode ? '#FBBF24' : '#D97706' };
    return { bg: darkMode ? '#001400' : '#F0FDF4', border: darkMode ? '#14532D' : '#BBF7D0', text: darkMode ? '#4ADE80' : '#16A34A' };
  };

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
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'slideUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: text, margin: 0 }}>
              🔔 Notifications
            </h2>
            {notifications.length > 0 && (
              <p style={{ fontSize: '0.85rem', color: text2, margin: '4px 0 0 0' }}>
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
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

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
            <p style={{ color: text, fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>
              All caught up!
            </p>
            <p style={{ color: text2, fontSize: '0.85rem' }}>
              No urgent assignments or deadlines right now.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((notif) => {
              const colors = getNotifColor(notif.type);
              return (
                <div
                  key={notif.id}
                  style={{
                    padding: '14px',
                    background: colors.bg,
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onClick={() => {
                    onAssignmentClick(notif.assignment);
                    onClose();
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: text, marginBottom: '4px' }}>
                        {notif.title}
                      </div>
                      {notif.subject && (
                        <div style={{ fontSize: '0.8rem', color: text2, marginBottom: '6px' }}>
                          {notif.subject}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.text }}>
                    {notif.type === 'overdue' && '⚠️ '}
                    {notif.type === 'due-today' && '📅 '}
                    {notif.type === 'upcoming' && '⏰ '}
                    {notif.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default NotificationCenter;
