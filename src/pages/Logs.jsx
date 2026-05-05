import React, { useState } from 'react';
import { useDryerStore } from '../store/dryerStore';

const TYPE_STYLE = {
  error:   { color:'#f87171', icon:'🔴', bg:'rgba(248,113,113,0.06)',  border:'rgba(248,113,113,0.15)' },
  warn:    { color:'#fbbf24', icon:'🟡', bg:'rgba(251,191,36,0.06)',   border:'rgba(251,191,36,0.15)'  },
  success: { color:'#4ade80', icon:'🟢', bg:'rgba(74,222,128,0.06)',   border:'rgba(74,222,128,0.15)'  },
  info:    { color:'#38bdf8', icon:'🔵', bg:'rgba(56,189,248,0.06)',   border:'rgba(56,189,248,0.15)'  },
  critical:{ color:'#f87171', icon:'🚨', bg:'rgba(248,113,113,0.08)',  border:'rgba(248,113,113,0.3)'  },
};

export default function Logs() {
  const { dryers } = useDryerStore();
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [selDryer,setSelDryer] = useState('all');

  // Merge all logs from all dryers with dryer metadata
  const allLogs = dryers
    .flatMap(d => d.logs.map(l => ({ ...l, dryerName:d.name, dryerId:d.id })))
    .sort((a, b) => new Date(b.time) - new Date(a.time));

  const filtered = allLogs.filter(l => {
    if (filter !== 'all' && l.type !== filter) return false;
    if (selDryer !== 'all' && l.dryerId !== selDryer) return false;
    if (search && !l.msg.toLowerCase().includes(search.toLowerCase())
               && !l.dryerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { all: allLogs.length };
  ['info','warn','error','success','critical'].forEach(t => {
    counts[t] = allLogs.filter(l => l.type === t).length;
  });

  return (
    <div style={{ padding:16, maxWidth:900 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(20px,5vw,26px)', color:'#f0f6ff', margin:0 }}>
          System Logs
        </h1>
        <p style={{ color:'#4a5568', fontSize:12, margin:'4px 0 0', fontFamily:"'DM Sans'" }}>
          Live audit trail — updates in real time as dryers run
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch' }}>
        {[
          { key:'all',     label:'All',     color:'#38bdf8' },
          { key:'info',    label:'Info',    color:'#38bdf8' },
          { key:'warn',    label:'Warn',    color:'#fbbf24' },
          { key:'error',   label:'Error',   color:'#f87171' },
          { key:'success', label:'Success', color:'#4ade80' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', flexShrink:0,
            background: filter===f.key?`${f.color}18`:'rgba(255,255,255,0.04)',
            outline: filter===f.key?`1px solid ${f.color}44`:'1px solid rgba(255,255,255,0.06)',
            color: filter===f.key?f.color:'#64748b',
            fontFamily:"'Space Mono'", fontSize:10, transition:'all 0.2s',
            display:'flex', gap:6, alignItems:'center',
          }}>
            {f.label}
            <span style={{ fontSize:9, color:'#4a5568', fontFamily:"'Space Mono'" }}>
              ({counts[f.key]||0})
            </span>
          </button>
        ))}
      </div>

      {/* Dryer filter + search */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <select value={selDryer} onChange={e => setSelDryer(e.target.value)} style={{
          padding:'8px 12px', borderRadius:10,
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
          color:'#f0f6ff', fontFamily:"'DM Sans'", fontSize:12, outline:'none', cursor:'pointer',
        }}>
          <option value="all">All Dryers</option>
          {dryers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex:1, minWidth:160, padding:'8px 14px', borderRadius:10,
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            color:'#f0f6ff', fontFamily:"'DM Sans'", fontSize:12, outline:'none',
          }}/>
      </div>

      {/* Entry count */}
      <div style={{ fontSize:10, color:'#4a5568', fontFamily:"'Space Mono'", marginBottom:10 }}>
        {filtered.length} ENTRIES
        {filtered.length === 0 && allLogs.length === 0 && (
          <span style={{ color:'#38bdf8', marginLeft:12 }}>← Start a dryer to generate live logs</span>
        )}
      </div>

      {/* Log list */}
      <div style={{ background:'linear-gradient(135deg,#0d1526,#080d1a)', borderRadius:16,
        border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#4a5568', fontFamily:"'Space Mono'", fontSize:11 }}>
            {allLogs.length === 0
              ? '▶ Start a dryer to see live logs here'
              : 'No logs match this filter'}
          </div>
        ) : filtered.map((log, i) => {
          const s = TYPE_STYLE[log.type] || TYPE_STYLE.info;
          return (
            <div key={i} style={{
              padding:'10px 14px',
              borderBottom: i < filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: s.bg,
              borderLeft: `3px solid ${s.color}`,
            }}>
              {/* Top row: time + dryer tag */}
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:9, color:'#4a5568', fontFamily:"'Space Mono'", flexShrink:0 }}>
                  {new Date(log.time).toLocaleString('en-NG',{ hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit', day:'numeric', month:'short' })}
                </span>
                <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4,
                  background:`${s.color}18`, color:s.color, fontFamily:"'Space Mono'", flexShrink:0 }}>
                  {log.dryerName}
                </span>
                <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4,
                  background:'rgba(255,255,255,0.05)', color:'#4a5568', fontFamily:"'Space Mono'", flexShrink:0,
                  textTransform:'uppercase' }}>
                  {log.type}
                </span>
              </div>
              {/* Message */}
              <div style={{ fontSize:12, color:'#c4d1e1', fontFamily:"'DM Sans'", lineHeight:1.5 }}>
                {log.msg}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
