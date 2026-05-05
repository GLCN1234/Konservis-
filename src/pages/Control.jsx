import React from 'react';
import { useDryerStore } from '../store/dryerStore';
import Dryer3D from '../components/Dryer3D';
import AlertBanner from '../components/AlertBanner';
import toast from 'react-hot-toast';

const CROPS = {
  maize:     { name:'Maize',     color:'#fbbf24', emoji:'🌽' },
  cassava:   { name:'Cassava',   color:'#fb923c', emoji:'🥔' },
  pepper:    { name:'Pepper',    color:'#f87171', emoji:'🌶️' },
  cocoa:     { name:'Cocoa',     color:'#92400e', emoji:'🍫' },
  rice:      { name:'Rice',      color:'#e2e8f0', emoji:'🌾' },
  groundnut: { name:'Groundnut', color:'#d97706', emoji:'🥜' },
};

function Slider({ label, value, onChange, min=0, max=100, color='#38bdf8', unit='%', disabled }) {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:11, color:'#64748b', fontFamily:"'Space Mono'" }}>{label}</span>
        <span style={{ fontSize:13, color, fontFamily:"'Space Mono'", fontWeight:700 }}>{value}{unit}</span>
      </div>
      <div style={{ position:'relative', height:10 }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.06)', borderRadius:5 }}/>
        <div style={{
          position:'absolute', left:0, top:0, height:'100%', borderRadius:5,
          width:`${((value-min)/(max-min))*100}%`,
          background:`linear-gradient(90deg,${color}88,${color})`,
          boxShadow:`0 0 10px ${color}66`, transition:'width 0.1s',
        }}/>
        <input type="range" min={min} max={max} value={value} disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position:'absolute', inset:0, width:'100%', opacity:0,
            cursor:disabled?'not-allowed':'pointer', height:'100%' }}/>
      </div>
    </div>
  );
}

function Btn({ label, onClick, color='#38bdf8', icon, disabled, full, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'13px 20px', borderRadius:12, border:'none', cursor:disabled?'not-allowed':'pointer',
      background: danger?'rgba(248,113,113,0.15)':`${color}18`,
      outline:`1px solid ${danger?'rgba(248,113,113,0.4)':color+'44'}`,
      color: danger?'#f87171':color,
      fontFamily:"'Syne'", fontWeight:700, fontSize:14,
      display:'flex', alignItems:'center', gap:8, justifyContent:'center',
      opacity:disabled?0.4:1, transition:'all 0.2s',
      width:full?'100%':'auto',
    }}>
      {icon && <span style={{ fontSize:18 }}>{icon}</span>}
      {label}
    </button>
  );
}

export default function Control() {
  const { dryers, activeDryer, startDryer, stopDryer, pauseDryer, emergencyShutdown,
    setFanSpeed, setHeatingLevel, setCrop, setBatchWeight, dismissAlert } = useDryerStore();
  const dryer = dryers.find(d => d.id === activeDryer) || dryers[0];
  const isRunning = dryer.status==='running';
  const isPaused  = dryer.status==='paused';
  const isIdle    = dryer.status==='idle';

  return (
    <div style={{ padding:16, maxWidth:900 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(20px,5vw,26px)', color:'#f0f6ff', margin:0 }}>Remote Control</h1>
        <p style={{ color:'#4a5568', fontSize:12, margin:'4px 0 0', fontFamily:"'DM Sans'" }}>Control your dryer in real time</p>
      </div>

      {dryer.alerts.length>0 && (
        <div style={{ marginBottom:16 }}>
          <AlertBanner alerts={dryer.alerts} onDismiss={id => dismissAlert(dryer.id,id)}/>
        </div>
      )}

      {/* Main action buttons — big, thumb-friendly */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {isIdle||dryer.status==='complete'||dryer.status==='fault' ? (
          <div style={{ gridColumn:'1/-1' }}>
            <Btn label="▶ Start Dryer" color="#4ade80" full onClick={() => { startDryer(dryer.id); toast.success(`${dryer.name} started!`); }}/>
          </div>
        ) : (
          <>
            <Btn label={isPaused?'▶ Resume':'⏸ Pause'} color="#fbbf24" full
              onClick={() => { pauseDryer(dryer.id); toast(`${isPaused?'Resumed':'Paused'}`); }}/>
            <Btn label="⏹ Stop" color="#94a3b8" full
              onClick={() => { stopDryer(dryer.id); toast.error('Stopped'); }}/>
          </>
        )}
        <div style={{ gridColumn:'1/-1' }}>
          <Btn label="🚨 Emergency Shutdown" danger full
            onClick={() => { emergencyShutdown(dryer.id); toast.error('EMERGENCY SHUTDOWN', { duration:5000 }); }}/>
        </div>
      </div>

      {/* Dryer visual */}
      <div style={{
        background:'linear-gradient(135deg,#0d1526,#080d1a)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16,
        display:'flex', flexDirection:'column', alignItems:'center', gap:12,
      }}>
        <div style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff' }}>{dryer.name}</div>
          <div style={{
            padding:'3px 10px', borderRadius:20, fontSize:10, fontFamily:"'Space Mono'",
            background: isRunning?'rgba(74,222,128,0.15)':dryer.status==='fault'?'rgba(248,113,113,0.15)':'rgba(255,255,255,0.05)',
            color: isRunning?'#4ade80':dryer.status==='fault'?'#f87171':'#64748b',
          }}>{dryer.status.toUpperCase()}</div>
        </div>
        <div style={{ transform:'scale(0.85)', transformOrigin:'top center' }}>
          <Dryer3D dryer={dryer} size="large"/>
        </div>
      </div>

      {/* Parameters */}
      <div style={{
        background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:20, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16,
        display:'flex', flexDirection:'column', gap:20,
      }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff' }}>Parameters</div>
        <Slider label="FAN SPEED" value={dryer.fanSpeed} color="#a78bfa"
          disabled={isIdle||dryer.status==='fault'} onChange={v => setFanSpeed(dryer.id,v)}/>
        <Slider label="HEATING LEVEL" value={dryer.heatingLevel} color="#fb923c"
          disabled={isIdle||dryer.status==='fault'} onChange={v => setHeatingLevel(dryer.id,v)}/>
        <Slider label="BATCH WEIGHT" value={dryer.batchWeight} min={10} max={200} unit="kg"
          color="#a78bfa" disabled={isRunning} onChange={v => setBatchWeight(dryer.id,v)}/>
      </div>

      {/* Crop selector */}
      <div style={{
        background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:20, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16,
      }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>Crop</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {Object.entries(CROPS).map(([key,crop]) => (
            <button key={key} onClick={() => !isRunning && setCrop(dryer.id,key)} style={{
              padding:'10px 6px', borderRadius:10, border:'none', cursor:isRunning?'not-allowed':'pointer',
              background: dryer.crop===key?`${crop.color}22`:'rgba(255,255,255,0.04)',
              outline: dryer.crop===key?`1px solid ${crop.color}66`:'1px solid rgba(255,255,255,0.06)',
              color: dryer.crop===key?crop.color:'#64748b',
              fontFamily:"'DM Sans'", fontWeight:600, fontSize:11, opacity:isRunning?0.5:1, transition:'all 0.2s',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            }}>
              <span style={{ fontSize:20 }}>{crop.emoji}</span>
              {crop.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live readings */}
      <div style={{
        background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:20, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16,
      }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>Live Readings</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { label:'Temperature',    value:`${dryer.temperature.toFixed(1)}°C`,    color:'#38bdf8' },
            { label:'Humidity',       value:`${dryer.humidity.toFixed(1)}%`,        color:'#a78bfa' },
            { label:'Moisture',       value:`${dryer.moistureContent.toFixed(1)}%`, color:'#4ade80' },
            { label:'Vibration',      value:`${dryer.vibration.toFixed(3)}g`,       color:dryer.vibration>0.45?'#f87171':'#64748b' },
            { label:'Motor Temp',     value:`${dryer.motorTemp.toFixed(1)}°C`,      color:dryer.motorTemp>70?'#f87171':'#64748b' },
            { label:'Energy Used',    value:`${dryer.energyUsed.toFixed(3)} kWh`,  color:'#fbbf24' },
          ].map(r => (
            <div key={r.label} style={{ padding:'10px', borderRadius:8, background:'rgba(255,255,255,0.03)', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#4a5568', fontFamily:"'Space Mono'", marginBottom:3 }}>{r.label}</div>
              <div style={{ fontSize:14, color:r.color, fontFamily:"'Space Mono'", fontWeight:700 }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div style={{
        background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:20, border:'1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>Event Log</div>
        <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
          {dryer.logs.length===0
            ? <div style={{ fontSize:11, color:'#4a5568', fontFamily:"'Space Mono'", textAlign:'center', padding:20 }}>No events yet</div>
            : [...dryer.logs].reverse().map((log,i) => {
                const lc = log.type==='error'?'#f87171':log.type==='warn'?'#fbbf24':log.type==='success'?'#4ade80':'#38bdf8';
                return (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:lc, marginTop:4, flexShrink:0 }}/>
                    <div>
                      <span style={{ fontSize:10, color:'#4a5568', fontFamily:"'Space Mono'" }}>
                        {new Date(log.time).toLocaleTimeString()}{'  '}
                      </span>
                      <span style={{ fontSize:11, color:'#94a3b8', fontFamily:"'DM Sans'" }}>{log.msg}</span>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
