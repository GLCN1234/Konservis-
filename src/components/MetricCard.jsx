import React from 'react';

export default function MetricCard({ label, value, unit, icon, color = '#38bdf8', trend, sublabel, pulse }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #111d33 0%, #0d1526 100%)',
      border: `1px solid ${pulse ? color + '55' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '16px', padding: '20px',
      position: 'relative', overflow: 'hidden',
      boxShadow: pulse ? `0 0 20px ${color}22` : 'none',
      transition: 'all 0.3s',
    }}>
      {/* Bg accent */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: '#64748b', fontFamily: "'Space Mono'", letterSpacing: '1px', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{
          fontSize: '32px', fontFamily: "'Syne'", fontWeight: 800, color,
          lineHeight: 1,
          textShadow: pulse ? `0 0 20px ${color}` : 'none',
        }}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span style={{ fontSize: '14px', color: '#64748b', fontFamily: "'Space Mono'" }}>{unit}</span>
      </div>

      {sublabel && <div style={{ marginTop: '6px', fontSize: '11px', color: '#4a5568' }}>{sublabel}</div>}

      {trend !== undefined && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: trend >= 0 ? '#4ade80' : '#f87171' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
          </span>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>from last batch</span>
        </div>
      )}
    </div>
  );
}
