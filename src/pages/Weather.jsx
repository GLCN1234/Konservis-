import React from 'react';
import { useDryerStore } from '../store/dryerStore';

const WEATHER_DETAIL = {
  sunny:    { label:'Sunny',    icon:'☀️', humidity:35, tempBoost:5,  riskLevel:'Low',    color:'#fbbf24',
    description:'Clear skies, low RH (~35%). Solar supplement available. Best drying conditions.',
    recommendation:'Reduce heating setpoint by 15%. Enable solar-assist mode. Excellent window.',
    solarMode:'Full Solar Hybrid', energySave:'Up to 40%' },
  cloudy:   { label:'Cloudy',   icon:'⛅', humidity:60, tempBoost:0,  riskLevel:'Low',    color:'#94a3b8',
    description:'Overcast, moderate RH (~60%). Standard conditions apply.',
    recommendation:'Standard recipe settings. Monitor RH every 30 min. No solar advantage.',
    solarMode:'Grid Only', energySave:'0%' },
  rainy:    { label:'Rainy',    icon:'🌧️', humidity:85, tempBoost:-3, riskLevel:'High',   color:'#38bdf8',
    description:'High ambient RH (~85%). Drying efficiency drops significantly — humidityPenalty = 0.30.',
    recommendation:'Increase fan speed +20%. Extend estimated drying window by 15–20%. Close all vents.',
    solarMode:'Grid Only', energySave:'0%' },
  harmattan:{ label:'Harmattan',icon:'💨', humidity:20, tempBoost:2,  riskLevel:'Low',    color:'#fb923c',
    description:'Dry Saharan winds, very low RH (~20%). Exceptional natural dehumidification.',
    recommendation:'Reduce heating -20%. Open exhaust vents fully. Best natural drying season in W. Africa.',
    solarMode:'Solar + Natural', energySave:'Up to 55%' },
};

const FORECAST = [
  { day:'Today',     icon:'☀️', high:34, low:22, humidity:35, good:true  },
  { day:'Tue',       icon:'⛅', high:30, low:21, humidity:58, good:true  },
  { day:'Wed',       icon:'🌧️', high:27, low:20, humidity:83, good:false },
  { day:'Thu',       icon:'🌧️', high:26, low:21, humidity:88, good:false },
  { day:'Fri',       icon:'⛅', high:29, low:20, humidity:62, good:true  },
  { day:'Sat',       icon:'☀️', high:33, low:22, humidity:38, good:true  },
  { day:'Sun',       icon:'💨', high:35, low:23, humidity:22, good:true  },
];

const ENERGY_WINDOWS = [
  { time:'6:00–10:00', mode:'Solar Hybrid',  save:'35%', color:'#fbbf24', desc:'Morning sun — good start window'  },
  { time:'10:00–14:00',mode:'Full Solar',    save:'50%', color:'#4ade80', desc:'Peak solar — maximum savings'     },
  { time:'14:00–18:00',mode:'Partial Solar', save:'25%', color:'#fb923c', desc:'Afternoon assist + grid'          },
  { time:'18:00–6:00', mode:'Grid Only',     save:'0%',  color:'#4a5568', desc:'Night — full grid power'          },
];

export default function Weather() {
  const { weather, setWeather } = useDryerStore();
  const cur = WEATHER_DETAIL[weather];
  const goodDays = FORECAST.filter(f=>f.good).length;

  return (
    <div style={{ padding:16, maxWidth:900 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(20px,5vw,26px)', color:'#f0f6ff', margin:0 }}>
          Weather Intelligence
        </h1>
        <p style={{ color:'#4a5568', fontSize:12, margin:'4px 0 0', fontFamily:"'DM Sans'" }}>
          Ambient conditions integrated into drying physics
        </p>
      </div>

      {/* Condition selector */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, color:'#38bdf8', fontFamily:"'Space Mono'", letterSpacing:2, marginBottom:10 }}>
          SET CURRENT CONDITIONS
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {Object.entries(WEATHER_DETAIL).map(([key,w]) => (
            <button key={key} onClick={() => setWeather(key)} style={{
              padding:'14px', borderRadius:16, border:'none', cursor:'pointer',
              background: weather===key?`${w.color}18`:'rgba(255,255,255,0.04)',
              outline: weather===key?`2px solid ${w.color}55`:'1px solid rgba(255,255,255,0.06)',
              transition:'all 0.2s', display:'flex', alignItems:'center', gap:12, textAlign:'left',
            }}>
              <span style={{ fontSize:28, flexShrink:0 }}>{w.icon}</span>
              <div>
                <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:13, color:weather===key?w.color:'#64748b' }}>
                  {w.label}
                </div>
                <div style={{ fontSize:10, color:'#4a5568', fontFamily:"'Space Mono'" }}>RH ~{w.humidity}%</div>
              </div>
              {weather===key && (
                <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%',
                  background:w.color, boxShadow:`0 0 8px ${w.color}`, flexShrink:0 }}/>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current conditions detail */}
      <div style={{ padding:16, borderRadius:20, marginBottom:16,
        background:`linear-gradient(135deg,${cur.color}0d,#0d1526)`,
        border:`1px solid ${cur.color}33` }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:14 }}>
          <span style={{ fontSize:48, flexShrink:0 }}>{cur.icon}</span>
          <div>
            <div style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:18, color:cur.color, marginBottom:4 }}>
              {cur.label}
            </div>
            <p style={{ fontSize:12, color:'#94a3b8', lineHeight:1.7, margin:0, fontFamily:"'DM Sans'" }}>
              {cur.description}
            </p>
          </div>
        </div>

        {/* Recommendation */}
        <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(0,0,0,0.25)',
          border:'1px solid rgba(255,255,255,0.07)', marginBottom:14 }}>
          <div style={{ fontSize:9, color:'#38bdf8', fontFamily:"'Space Mono'", marginBottom:4 }}>AI RECOMMENDATION</div>
          <div style={{ fontSize:12, color:'#f0f6ff', fontFamily:"'DM Sans'" }}>💡 {cur.recommendation}</div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { label:'Humidity',    value:`${cur.humidity}% RH`,  color:'#a78bfa' },
            { label:'Energy Save', value:cur.energySave,         color:'#4ade80' },
            { label:'Mode',        value:cur.solarMode,          color:cur.color },
          ].map(r => (
            <div key={r.label} style={{ padding:'10px 8px', borderRadius:10, background:'rgba(0,0,0,0.2)', textAlign:'center' }}>
              <div style={{ fontSize:8, color:'#64748b', fontFamily:"'Space Mono'", marginBottom:3 }}>{r.label}</div>
              <div style={{ fontSize:11, color:r.color, fontFamily:"'Syne'", fontWeight:700, lineHeight:1.3 }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-day forecast */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff' }}>
            7-Day Forecast · Lagos
          </div>
          <div style={{ fontSize:11, color:'#4ade80', fontFamily:"'Space Mono'" }}>
            {goodDays}/7 good drying days
          </div>
        </div>
        <div style={{ display:'flex', gap:8, overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:4 }}>
          {FORECAST.map((f,i) => (
            <div key={i} style={{
              padding:'12px 10px', borderRadius:12, textAlign:'center', flexShrink:0, minWidth:68,
              background:f.good?'rgba(74,222,128,0.06)':'rgba(248,113,113,0.06)',
              border:`1px solid ${f.good?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'}`,
              display:'flex', flexDirection:'column', gap:5, alignItems:'center',
            }}>
              <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'" }}>{f.day}</div>
              <div style={{ fontSize:20 }}>{f.icon}</div>
              <div style={{ fontSize:12, color:'#f0f6ff', fontFamily:"'Space Mono'", fontWeight:700 }}>{f.high}°</div>
              <div style={{ fontSize:9, color:'#4a5568', fontFamily:"'Space Mono'" }}>{f.low}°</div>
              <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'" }}>{f.humidity}%</div>
              <div style={{ fontSize:8, fontFamily:"'Space Mono'", color:f.good?'#4ade80':'#f87171', fontWeight:700 }}>
                {f.good?'✓ DRY':'✗ WET'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Energy windows */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>
          ⚡ Energy Optimisation Windows
        </div>
        {ENERGY_WINDOWS.map(w => (
          <div key={w.time} style={{ display:'flex', alignItems:'center', gap:12,
            padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(255,255,255,0.05)', marginBottom:8 }}>
            <div style={{ padding:'6px 10px', borderRadius:8, background:`${w.color}15`,
              border:`1px solid ${w.color}30`, textAlign:'center', minWidth:52, flexShrink:0 }}>
              <div style={{ fontSize:8, color:'#64748b', fontFamily:"'Space Mono'" }}>SAVE</div>
              <div style={{ fontSize:16, color:w.color, fontFamily:"'Syne'", fontWeight:700 }}>{w.save}</div>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#f0f6ff', fontFamily:"'DM Sans'", fontWeight:600 }}>
                {w.time} — <span style={{ color:w.color }}>{w.mode}</span>
              </div>
              <div style={{ fontSize:11, color:'#64748b', fontFamily:"'DM Sans'" }}>{w.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
