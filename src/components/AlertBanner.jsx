import React from 'react';

const typeStyle = {
  critical: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.4)', color: '#f87171', icon: '🚨' },
  warning:  { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.4)',  color: '#fbbf24', icon: '⚠️' },
  success:  { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.4)',  color: '#4ade80', icon: '✅' },
  info:     { bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.4)',  color: '#38bdf8', icon: 'ℹ️' },
};

export default function AlertBanner({ alerts, onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {alerts.slice(0, 5).map(alert => {
        const s = typeStyle[alert.type] || typeStyle.info;
        return (
          <div key={alert.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: '10px',
            background: s.bg, border: `1px solid ${s.border}`,
            animation: 'fadeIn 0.3s ease',
          }}>
            <span style={{ fontSize: '14px' }}>{s.icon}</span>
            <span style={{ flex: 1, fontSize: '12px', color: s.color, fontFamily: "'DM Sans'" }}>{alert.msg}</span>
            <span style={{ fontSize: '10px', color: '#4a5568', fontFamily: "'Space Mono'", whiteSpace: 'nowrap' }}>
              {alert.time ? new Date(alert.time).toLocaleTimeString() : ''}
            </span>
            {onDismiss && (
              <button onClick={() => onDismiss(alert.id)} style={{
                background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '14px',
              }}>×</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
