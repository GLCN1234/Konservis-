import React from 'react';
import { useDryerStore } from '../store/dryerStore';
import Dryer3D from '../components/Dryer3D';
import MetricCard from '../components/MetricCard';
import AlertBanner from '../components/AlertBanner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CROPS = {
  maize:'Maize', cassava:'Cassava', pepper:'Pepper',
  cocoa:'Cocoa', rice:'Rice', groundnut:'Groundnut',
};
const CROP_COLORS = {
  maize:'#fbbf24', cassava:'#fb923c', pepper:'#f87171',
  cocoa:'#92400e', rice:'#e2e8f0', groundnut:'#d97706',
};

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px' }}>
      <div style={{ fontSize:10, color:'#64748b', marginBottom:4, fontFamily:"'Space Mono'" }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:11, color:p.color, fontFamily:"'Space Mono'" }}>
          {p.name}: {typeof p.value==='number'?p.value.toFixed(1):p.value}
        </div>
      ))}
    </div>
  );
};

export default function Overview() {
  const { dryers, activeDryer, setActiveDryer, dismissAlert, getSensorHistory, getWeatherOptions, weather } = useDryerStore();
  const dryer = dryers.find(d => d.id === activeDryer) || dryers[0];
  const history = getSensorHistory(dryer.id);
  const weatherOpts = getWeatherOptions();
  const currentWeather = weatherOpts[weather];
  const cropColor = CROP_COLORS[dryer.crop] || '#38bdf8';
  const allAlerts = dryers.flatMap(d => d.alerts.map(a => ({ ...a, dryerName: d.name })));

  return (
    <div style={{ padding:'16px', maxWidth:1400 }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
          <h1 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(20px,5vw,28px)', color:'#f0f6ff', margin:0 }}>
            Mission Control
          </h1>
          <div style={{ padding:'3px 8px', background:'rgba(56,189,248,0.1)', borderRadius:20,
            border:'1px solid rgba(56,189,248,0.2)', fontSize:10, color:'#38bdf8', fontFamily:"'Space Mono'" }}>
            {currentWeather.icon} {currentWeather.label}
          </div>
        </div>
        <p style={{ color:'#4a5568', fontSize:12, fontFamily:"'DM Sans'", margin:0 }}>
          Post-Harvest OS for Africa
        </p>
      </div>

      {/* Alerts */}
      {allAlerts.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <AlertBanner alerts={allAlerts} onDismiss={(id) =>
            dryers.forEach(d => { if (d.alerts.find(a=>a.id===id)) dismissAlert(d.id,id); })
          }/>
        </div>
      )}

      {/* Dryer tabs — horizontal scroll on mobile */}
      <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch' }}>
        {dryers.map(d => {
          const sc = d.status==='running'?'#4ade80':d.status==='fault'?'#f87171':d.status==='complete'?'#38bdf8':'#4a5568';
          const isA = activeDryer===d.id;
          return (
            <button key={d.id} onClick={() => setActiveDryer(d.id)} style={{
              padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer', flexShrink:0,
              background: isA ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
              outline: isA ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: isA ? '#f0f6ff' : '#64748b',
              fontFamily:"'DM Sans'", fontWeight:600, fontSize:12, transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:6,
            }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:sc,
                boxShadow: d.status==='running'?`0 0 6px ${sc}`:'none' }} />
              {d.name}
              {d.status==='running' && (
                <span style={{ fontSize:10, color:'#4ade80', fontFamily:"'Space Mono'" }}>{d.progress.toFixed(0)}%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dryer visual + info */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr)', gap:16 }}>

        {/* Dryer card */}
        <div style={{
          background:'linear-gradient(135deg,#0d1526,#080d1a)', borderRadius:20,
          padding:20, border:'1px solid rgba(255,255,255,0.07)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:14,
        }}>
          <div style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:15, color:'#f0f6ff' }}>{dryer.name}</div>
              <div style={{ fontSize:10, color:'#64748b', fontFamily:"'Space Mono'" }}>{dryer.batchId||'No Active Batch'}</div>
            </div>
            <div style={{ padding:'3px 10px', borderRadius:20, fontSize:10,
              background:`${cropColor}20`, color:cropColor, border:`1px solid ${cropColor}44`, fontFamily:"'Space Mono'" }}>
              {CROPS[dryer.crop]||dryer.crop}
            </div>
          </div>

          {/* 3D Dryer — smaller on mobile */}
          <div style={{ width:'100%', display:'flex', justifyContent:'center', overflow:'hidden' }}>
            <div style={{ transform:'scale(0.85)', transformOrigin:'top center' }}>
              <Dryer3D dryer={dryer} size="large" />
            </div>
          </div>

          {/* Progress */}
          <div style={{ width:'100%' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:10, color:'#64748b', fontFamily:"'Space Mono'" }}>DRYING PROGRESS</span>
              <span style={{ fontSize:12, color:'#4ade80', fontFamily:"'Space Mono'", fontWeight:700 }}>
                {dryer.progress.toFixed(1)}%
              </span>
            </div>
            <div style={{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:4, width:`${dryer.progress}%`,
                background:'linear-gradient(90deg,#38bdf8,#4ade80)',
                boxShadow:'0 0 10px rgba(74,222,128,0.4)', transition:'width 0.5s',
              }}/>
            </div>
          </div>

          {/* ML estimate */}
          {dryer.status==='running' && (
            <div style={{
              width:'100%', padding:'8px 14px', borderRadius:10,
              background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.15)',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <span style={{ fontSize:10, color:'#64748b', fontFamily:"'Space Mono'" }}>ML: TIME REMAINING</span>
              <span style={{ fontSize:12, color:'#38bdf8', fontFamily:"'Space Mono'" }}>
                {dryer.mlEstimatedMinutes!=null
                  ? dryer.mlEstimatedMinutes>90
                    ? `~${(dryer.mlEstimatedMinutes/60).toFixed(1)}h`
                    : `~${Math.round(dryer.mlEstimatedMinutes)}min`
                  : 'Calculating...'}
              </span>
            </div>
          )}
        </div>

        {/* Metrics grid — 2 cols on mobile, 3 on tablet+ */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
          <MetricCard label="Temperature" value={dryer.temperature} unit="°C" icon="🌡️"
            color={dryer.temperature>70?'#f87171':dryer.temperature>50?'#fb923c':'#38bdf8'} pulse={dryer.temperature>70}/>
          <MetricCard label="Humidity" value={dryer.humidity} unit="%" icon="💧"
            color={dryer.humidity>70?'#f87171':'#38bdf8'}/>
          <MetricCard label="Moisture" value={dryer.moistureContent} unit="%" icon="🌾" color="#4ade80"/>
          <MetricCard label="Fan Speed" value={dryer.fanSpeed} unit="%" icon="🌀" color="#a78bfa" pulse={dryer.status==='running'}/>
          <MetricCard label="Energy" value={dryer.energyUsed} unit="kWh" icon="⚡" color="#fbbf24"/>
          <MetricCard label="Motor Temp" value={dryer.motorTemp} unit="°C" icon="⚙️"
            color={dryer.motorTemp>70?'#f87171':'#94a3b8'} pulse={dryer.motorTemp>70}/>
        </div>

        {/* Live chart */}
        <div style={{
          background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
          padding:20, border:'1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff' }}>Live Sensors</div>
              <div style={{ fontSize:10, color:'#4a5568', fontFamily:"'Space Mono'" }}>Last 60 seconds</div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[['#38bdf8','Temp'],['#4ade80','Moisture'],['#a78bfa','Humidity']].map(([c,l])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:8, height:2, background:c, borderRadius:1 }}/>
                  <span style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          {history.length>1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="time" tick={{ fill:'#4a5568', fontSize:8, fontFamily:"'Space Mono'" }} interval="preserveStartEnd"/>
                <YAxis tick={{ fill:'#4a5568', fontSize:8 }}/>
                <Tooltip content={<CT/>}/>
                <Line type="monotone" dataKey="temperature" stroke="#38bdf8" strokeWidth={2} dot={false} name="Temp"/>
                <Line type="monotone" dataKey="moisture"    stroke="#4ade80" strokeWidth={2} dot={false} name="Moisture"/>
                <Line type="monotone" dataKey="humidity"    stroke="#a78bfa" strokeWidth={2} dot={false} name="Humidity"/>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:28, opacity:0.2 }}>📊</div>
              <div style={{ fontSize:11, color:'#4a5568', fontFamily:"'Space Mono'", textAlign:'center' }}>Start a dryer to see live data</div>
            </div>
          )}
        </div>

        {/* Fleet status */}
        <div style={{
          background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
          padding:20, border:'1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>Fleet Status</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {dryers.map(d => {
              const sc = d.status==='running'?'#4ade80':d.status==='fault'?'#f87171':d.status==='complete'?'#38bdf8':'#4a5568';
              return (
                <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:sc, flexShrink:0,
                    boxShadow: d.status==='running'?`0 0 6px ${sc}`:'none' }}/>
                  <span style={{ flex:1, fontSize:12, color:'#94a3b8', fontFamily:"'DM Sans'" }}>{d.name}</span>
                  <span style={{ fontSize:10, color:'#4a5568', fontFamily:"'Space Mono'" }}>{CROPS[d.crop]}</span>
                  <div style={{ width:60, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
                    <div style={{ width:`${d.progress}%`, height:'100%', background:sc, borderRadius:2, transition:'width 0.5s' }}/>
                  </div>
                  <span style={{ fontSize:10, color:sc, fontFamily:"'Space Mono'", width:28, textAlign:'right' }}>{d.progress.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
