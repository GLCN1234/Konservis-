import React, { useState } from 'react';
import { useDryerStore } from '../store/dryerStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Thresholds calibrated to actual physics model:
// Fan vibration max at 100% = 0.235g, alert fires at 0.55g in store
// Motor temp: heats to ~50-60°C at normal ops
const COMPONENTS = [
  { id:'fan',    label:'Fan Motor',       icon:'🌀', warnAt:0.22, critAt:0.40, metric:'vibration',  unit:'g',  desc:'Bearing wear & imbalance' },
  { id:'heater', label:'Heating Element', icon:'🔥', warnAt:72,   critAt:82,   metric:'motorTemp',  unit:'°C', desc:'Coil resistance & thermal cycling' },
  { id:'motor',  label:'Drive Motor',     icon:'⚙️', warnAt:68,   critAt:78,   metric:'motorTemp',  unit:'°C', desc:'Winding temp & current draw' },
  { id:'sensor', label:'Temp Sensor',     icon:'🌡️', warnAt:80,   critAt:90,   metric:'temperature',unit:'°C', desc:'Calibration drift & response' },
  { id:'vent',   label:'Exhaust Duct',    icon:'💨', warnAt:75,   critAt:88,   metric:'humidity',   unit:'%',  desc:'Blockage & pressure differential' },
];

const MAINT_LOGS = [
  { date:'2026-04-28', type:'Preventive', item:'Fan belt replacement',  tech:'Emeka O.',  status:'Done' },
  { date:'2026-04-15', type:'Corrective', item:'Heating coil cleaned',  tech:'Chidi A.',  status:'Done' },
  { date:'2026-03-30', type:'Inspection', item:'Full system check',     tech:'Adaeze N.', status:'Done' },
  { date:'2026-03-10', type:'Preventive', item:'Bearing lubrication',   tech:'Emeka O.',  status:'Done' },
];

export default function Maintenance() {
  const { dryers, activeDryer } = useDryerStore();
  const dryer = dryers.find(d=>d.id===activeDryer)||dryers[0];
  const [sel, setSel] = useState('fan');
  const comp = COMPONENTS.find(c=>c.id===sel);
  const value = dryer[comp.metric]||0;

  // Health: 100% when below warnAt, degrades linearly to 60% at critAt
  const raw = value >= comp.critAt
    ? 50
    : value >= comp.warnAt
      ? 100 - ((value - comp.warnAt) / (comp.critAt - comp.warnAt)) * 40
      : 100;
  const healthPct = Math.round(Math.max(0, Math.min(100, raw)));
  const status = value >= comp.critAt ? 'CRITICAL' : value >= comp.warnAt ? 'WARNING' : 'HEALTHY';
  const sc = status==='CRITICAL'?'#f87171':status==='WARNING'?'#fbbf24':'#4ade80';

  const healthTrend = Array.from({length:12},(_,i) => ({
    month:['J','F','M','A','M','J','J','A','S','O','N','D'][i],
    health: Math.max(60, 98-i*1.8+(Math.random()-0.5)*4),
  }));

  const nextService = new Date(Date.now()+7*86400000).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'});

  return (
    <div style={{ padding:16, maxWidth:1000 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(20px,5vw,26px)', color:'#f0f6ff', margin:0 }}>Maintenance</h1>
        <p style={{ color:'#4a5568', fontSize:12, margin:'4px 0 0', fontFamily:"'DM Sans'" }}>Predictive fault detection</p>
      </div>

      {/* Overall health */}
      <div style={{ padding:16, borderRadius:20, marginBottom:16,
        background:dryer.maintenanceScore>80?'linear-gradient(135deg,rgba(74,222,128,0.07),#0d1526)':'linear-gradient(135deg,rgba(251,191,36,0.07),#0d1526)',
        border:dryer.maintenanceScore>80?'1px solid rgba(74,222,128,0.2)':'1px solid rgba(251,191,36,0.2)',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12,
      }}>
        <div>
          <div style={{ fontSize:10, color:'#64748b', fontFamily:"'Space Mono'", marginBottom:4 }}>HEALTH SCORE</div>
          <div style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(36px,8vw,52px)',
            color:dryer.maintenanceScore>80?'#4ade80':'#fbbf24', lineHeight:1 }}>
            {dryer.maintenanceScore}<span style={{ fontSize:16, color:'#64748b' }}>/100</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <div style={{ padding:'8px 14px', borderRadius:10, background:'rgba(56,189,248,0.08)',
            border:'1px solid rgba(56,189,248,0.18)', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'" }}>NEXT SERVICE</div>
            <div style={{ fontSize:12, color:'#38bdf8', fontFamily:"'Space Mono'" }}>{nextService}</div>
          </div>
          <div style={{ padding:'8px 14px', borderRadius:10, background:'rgba(74,222,128,0.08)',
            border:'1px solid rgba(74,222,128,0.18)', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'" }}>BATCHES SINCE SVC</div>
            <div style={{ fontSize:12, color:'#4ade80', fontFamily:"'Space Mono'" }}>{dryer.historicalBatches.length}</div>
          </div>
        </div>
      </div>

      {/* Component list — horizontal scroll on mobile */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:16, WebkitOverflowScrolling:'touch' }}>
        {COMPONENTS.map(c => {
          const v = dryer[c.metric]||0;
          const s = v>=c.critAt?'CRITICAL':v>=c.warnAt?'WARNING':'HEALTHY';
          const color = s==='CRITICAL'?'#f87171':s==='WARNING'?'#fbbf24':'#4ade80';
          return (
            <button key={c.id} onClick={() => setSel(c.id)} style={{
              padding:'12px 14px', borderRadius:14, border:'none', cursor:'pointer', flexShrink:0,
              background:sel===c.id?'rgba(56,189,248,0.1)':'rgba(255,255,255,0.04)',
              outline:sel===c.id?'1px solid rgba(56,189,248,0.4)':'1px solid rgba(255,255,255,0.06)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:72, transition:'all 0.2s',
            }}>
              <span style={{ fontSize:22 }}>{c.icon}</span>
              <div style={{ width:6, height:6, borderRadius:'50%', background:color,
                boxShadow:s!=='HEALTHY'?`0 0 6px ${color}`:'none' }}/>
              <span style={{ fontSize:9, color:sel===c.id?'#f0f6ff':'#64748b', fontFamily:"'Space Mono'", textAlign:'center' }}>
                {c.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Component detail */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:16, color:'#f0f6ff' }}>
              {comp.icon} {comp.label}
            </div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{comp.desc}</div>
          </div>
          <div style={{ padding:'4px 10px', borderRadius:8, fontSize:11, fontFamily:"'Space Mono'",
            background:`${sc}18`, color:sc, border:`1px solid ${sc}44` }}>{status}</div>
        </div>

        {/* Health bar */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:10, color:'#64748b', fontFamily:"'Space Mono'" }}>HEALTH</span>
            <span style={{ fontSize:12, color:sc, fontFamily:"'Space Mono'", fontWeight:700 }}>{healthPct}%</span>
          </div>
          <div style={{ height:10, background:'rgba(255,255,255,0.06)', borderRadius:5, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${healthPct}%`, borderRadius:5,
              background:`linear-gradient(90deg,${sc}88,${sc})`,
              boxShadow:`0 0 10px ${sc}66`, transition:'width 0.5s' }}/>
          </div>
        </div>

        {/* Values grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { label:'Current',   value:`${value.toFixed(comp.unit==='g'?3:1)}${comp.unit}`, color:sc },
            { label:'Warn At',   value:`${comp.warnAt}${comp.unit}`, color:'#fbbf24' },
            { label:'Crit At',   value:`${comp.critAt}${comp.unit}`, color:'#f87171' },
          ].map(r => (
            <div key={r.label} style={{ padding:10, borderRadius:10, background:'rgba(255,255,255,0.04)', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#4a5568', fontFamily:"'Space Mono'", marginBottom:3 }}>{r.label}</div>
              <div style={{ fontSize:14, color:r.color, fontFamily:"'Space Mono'", fontWeight:700 }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Health trend */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:12 }}>
          Health Trend
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={healthTrend}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{ fill:'#4a5568', fontSize:9 }}/>
            <YAxis domain={[50,100]} tick={{ fill:'#4a5568', fontSize:9 }}/>
            <Tooltip contentStyle={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:8, fontFamily:"'Space Mono'", fontSize:10 }}/>
            <Line type="monotone" dataKey="health" stroke="#4ade80" strokeWidth={2} dot={false} name="Health %"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomalies */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:12 }}>
          Anomaly Log
        </div>
        {dryer.alerts.filter(a=>a.type!=='success').length>0
          ? dryer.alerts.filter(a=>a.type!=='success').map((a,i) => (
              <div key={i} style={{ padding:'10px 12px', borderRadius:10, marginBottom:6,
                background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.2)',
                display:'flex', gap:8, alignItems:'flex-start' }}>
                <span>⚠️</span>
                <div>
                  <div style={{ fontSize:12, color:'#f87171', fontFamily:"'DM Sans'" }}>{a.msg}</div>
                  <div style={{ fontSize:9, color:'#4a5568', fontFamily:"'Space Mono'" }}>{new Date(a.time).toLocaleString()}</div>
                </div>
              </div>
            ))
          : <div style={{ textAlign:'center', padding:20, color:'#4a5568', fontFamily:"'Space Mono'", fontSize:11 }}>
              ✅ No anomalies detected
            </div>
        }
      </div>

      {/* Maintenance log table */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>Maintenance Records</div>
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:420 }}>
            <thead>
              <tr>
                {['Date','Type','Item','Tech','Status'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:9, color:'#38bdf8',
                    fontFamily:"'Space Mono'", letterSpacing:1, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MAINT_LOGS.map((log,i) => (
                <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'8px 10px', fontSize:10, color:'#64748b', fontFamily:"'Space Mono'" }}>{log.date}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:5, fontFamily:"'Space Mono'",
                      background:log.type==='Corrective'?'rgba(248,113,113,0.12)':log.type==='Preventive'?'rgba(74,222,128,0.12)':'rgba(56,189,248,0.12)',
                      color:log.type==='Corrective'?'#f87171':log.type==='Preventive'?'#4ade80':'#38bdf8' }}>
                      {log.type}
                    </span>
                  </td>
                  <td style={{ padding:'8px 10px', fontSize:11, color:'#94a3b8', fontFamily:"'DM Sans'" }}>{log.item}</td>
                  <td style={{ padding:'8px 10px', fontSize:11, color:'#94a3b8', fontFamily:"'DM Sans'" }}>{log.tech}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:5, background:'rgba(74,222,128,0.12)', color:'#4ade80', fontFamily:"'Space Mono'" }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
