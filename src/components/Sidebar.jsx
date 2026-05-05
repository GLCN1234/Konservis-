import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/',            icon: '⬡', label: 'Overview'    },
  { path: '/control',     icon: '◈', label: 'Control'     },
  { path: '/analytics',   icon: '◻', label: 'Analytics'   },
  { path: '/ml',          icon: '◆', label: 'AI Insights' },
  { path: '/maintenance', icon: '⬢', label: 'Maintenance' },
  { path: '/weather',     icon: '◉', label: 'Weather'     },
  { path: '/logs',        icon: '≡', label: 'Logs'        },
];

/* ─── BOTTOM NAV for mobile ─────────────────────────────────────── */
export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'rgba(8,13,26,0.97)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'stretch',
      height: 60, paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {navItems.map(item => (
        <NavLink key={item.path} to={item.path} end={item.path === '/'}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            textDecoration: 'none', transition: 'all 0.2s',
            color: isActive ? '#38bdf8' : '#4a5568',
            borderTop: isActive ? '2px solid #38bdf8' : '2px solid transparent',
            background: isActive ? 'rgba(56,189,248,0.06)' : 'transparent',
          })}>
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <span style={{ fontSize: 9, fontFamily: "'Space Mono'", letterSpacing: '0.5px' }}>
            {item.label.split(' ')[0].toUpperCase()}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

/* ─── SIDEBAR for desktop ───────────────────────────────────────── */
export default function Sidebar({ dryers, activeDryer, setActiveDryer, collapsed, setCollapsed }) {
  return (
    <aside style={{
      width: collapsed ? '64px' : '220px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg,#080d1a 0%,#050810 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding:'24px 16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:8, flexShrink:0,
            background:'linear-gradient(135deg,#38bdf8,#0ea5e9)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, boxShadow:'0 0 16px rgba(56,189,248,0.4)',
          }}>🌾</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:14, color:'#f0f6ff', letterSpacing:1 }}>KONSERVIS</div>
              <div style={{ fontSize:9, color:'#38bdf8', letterSpacing:2, fontFamily:"'Space Mono'" }}>DIGITAL TWIN</div>
            </div>
          )}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} style={{
          marginTop:12, background:'none', border:'1px solid rgba(255,255,255,0.08)',
          color:'#4a5568', cursor:'pointer', borderRadius:6,
          width:'100%', padding:'4px', fontSize:10, transition:'all 0.2s',
        }}>{collapsed ? '→' : '← collapse'}</button>
      </div>

      <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius:10, marginBottom:4, textDecoration:'none', transition:'all 0.2s',
              background: isActive ? 'rgba(56,189,248,0.12)' : 'transparent',
              color: isActive ? '#38bdf8' : '#64748b',
              borderLeft: isActive ? '2px solid #38bdf8' : '2px solid transparent',
            })}>
            <span style={{ fontSize:16 }}>{item.icon}</span>
            {!collapsed && <span style={{ fontFamily:"'DM Sans'", fontWeight:500, fontSize:13 }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div style={{ padding:'12px 8px 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:9, color:'#38bdf8', letterSpacing:2, fontFamily:"'Space Mono'", marginBottom:8, paddingLeft:8 }}>DRYERS</div>
          {dryers.map(d => {
            const sc = d.status==='running'?'#4ade80':d.status==='fault'?'#f87171':d.status==='complete'?'#38bdf8':'#4a5568';
            return (
              <button key={d.id} onClick={() => setActiveDryer(d.id)} style={{
                width:'100%', padding:'8px 12px', borderRadius:8, cursor:'pointer',
                background: activeDryer===d.id ? 'rgba(56,189,248,0.1)' : 'transparent',
                border: activeDryer===d.id ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
                display:'flex', alignItems:'center', gap:8, marginBottom:4, transition:'all 0.2s',
              }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:sc, flexShrink:0,
                  boxShadow: d.status==='running'?`0 0 8px ${sc}`:'none' }} />
                <span style={{ color: activeDryer===d.id?'#f0f6ff':'#64748b', fontSize:12, fontFamily:"'DM Sans'" }}>{d.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
