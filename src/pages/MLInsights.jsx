import React, { useState } from 'react';
import { useDryerStore, CROPS } from '../store/dryerStore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const WEATHER_ADVICE = {
  sunny:    { label:'Sunny',    icon:'☀️', advice:'Optimal! Reduce heating 15%, enable solar assist mode.' },
  cloudy:   { label:'Cloudy',   icon:'⛅', advice:'Moderate. Standard settings work well. Watch humidity.' },
  rainy:    { label:'Rainy',    icon:'🌧️', advice:'High humidity. Increase fan +20%, extend time by ~15%.' },
  harmattan:{ label:'Harmattan',icon:'💨', advice:'Excellent conditions. Reduce heating 20%, natural dehumidification active.' },
};

export default function MLInsights() {
  const { dryers, activeDryer, weather } = useDryerStore();
  const dryer = dryers.find(d=>d.id===activeDryer)||dryers[0];
  const [selCrop, setSelCrop] = useState(dryer.crop);
  const crop = CROPS[selCrop];
  const crop_data = CROPS[dryer.crop];
  const weatherAdvice = WEATHER_ADVICE[weather];

  const radarData = [
    { subject:'Temp',       A: Math.min(100,(dryer.temperature/crop_data.idealTemp)*100) },
    { subject:'Fan',        A: dryer.fanSpeed },
    { subject:'Dry. Force', A: Math.max(0,100-dryer.humidity) },
    { subject:'Progress',   A: dryer.progress },
    { subject:'Heating',    A: dryer.heatingLevel },
    { subject:'Health',     A: dryer.maintenanceScore },
  ];

  const T_ambient = 28;
  const tempFactor = Math.max(0,(dryer.temperature-T_ambient)/Math.max(1,crop_data.idealTemp-T_ambient));
  const fanFactor  = Math.max(0.01, dryer.fanSpeed/100);
  const humPenalty = (weather==='rainy'?0.85:weather==='cloudy'?0.6:weather==='harmattan'?0.2:0.35)/100*0.35;
  // Use crop-specific drying rate constant (calibrated per crop, min⁻¹)
  const k_eff = crop_data.k * tempFactor * fanFactor * (1 - humPenalty);
  const rem   = dryer.moistureContent - crop_data.idealMoisture;
  const estMins = k_eff>0.001&&rem>0.1 ? Math.min(600,Math.max(0,Math.log(rem/0.1)/k_eff)) : null;
  const combinedEff = tempFactor*0.6+fanFactor*0.4;
  const energyEst   = crop_data.dryingHours/Math.max(0.1,combinedEff)*((dryer.heatingLevel/100)*3+(dryer.fanSpeed/100)*0.55);

  const optFan  = weather==='harmattan'?60:weather==='rainy'?85:75;
  const optHeat = weather==='sunny'?Math.round(crop.idealTemp*0.85):crop.idealTemp;

  const risks = [
    { label:'Over-drying', risk:dryer.moistureContent<(crop_data.idealMoisture-2)?'HIGH':dryer.moistureContent<crop_data.idealMoisture?'MED':'LOW',
      detail:`${dryer.moistureContent.toFixed(1)}% vs target ${crop_data.idealMoisture}%` },
    { label:'Heat Stress',  risk:dryer.temperature>crop_data.idealTemp+10?'HIGH':dryer.temperature>crop_data.idealTemp+5?'MED':'LOW',
      detail:`${dryer.temperature.toFixed(0)}°C vs ideal ${crop_data.idealTemp}°C` },
    { label:'Motor Fault',  risk:dryer.vibration>0.4?'HIGH':dryer.vibration>0.22?'MED':'LOW',
      detail:`Vibration: ${dryer.vibration.toFixed(3)}g` },
  ];
  const riskColor = r => r==='HIGH'?'#f87171':r==='MED'?'#fbbf24':'#4ade80';

  return (
    <div style={{ padding:16, maxWidth:1100 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(20px,5vw,26px)', color:'#f0f6ff', margin:0 }}>AI Insights</h1>
        <p style={{ color:'#4a5568', fontSize:12, margin:'4px 0 0', fontFamily:"'DM Sans'" }}>ML-powered drying optimization</p>
      </div>

      {/* Active prediction */}
      {dryer.status==='running' && (
        <div style={{ padding:16, borderRadius:16, marginBottom:16,
          background:'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(56,189,248,0.08))',
          border:'1px solid rgba(74,222,128,0.25)' }}>
          <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#4ade80', marginBottom:6 }}>🧠 ML Active</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ padding:'10px', borderRadius:10, background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'", marginBottom:2 }}>TIME REMAINING</div>
              <div style={{ fontSize:16, color:'#38bdf8', fontFamily:"'Syne'", fontWeight:700 }}>
                {estMins!=null?(estMins>90?`~${(estMins/60).toFixed(1)}h`:`~${Math.round(estMins)}m`):'Calc...'}
              </div>
            </div>
            <div style={{ padding:'10px', borderRadius:10, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'", marginBottom:2 }}>EST. ENERGY</div>
              <div style={{ fontSize:16, color:'#fbbf24', fontFamily:"'Syne'", fontWeight:700 }}>{energyEst.toFixed(2)} kWh</div>
            </div>
          </div>
          <div style={{ marginTop:10, padding:'8px 12px', borderRadius:10, background:'rgba(255,255,255,0.04)',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#64748b', fontFamily:"'Space Mono'" }}>EFFICIENCY</span>
            <span style={{ fontSize:14, color:combinedEff>0.7?'#4ade80':'#fbbf24', fontFamily:"'Space Mono'", fontWeight:700 }}>
              {(combinedEff*100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Crop recipe selector */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:12 }}>Crop Recipes</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
          {Object.entries(CROPS).map(([key,c]) => (
            <button key={key} onClick={() => setSelCrop(key)} style={{
              padding:'10px 6px', borderRadius:10, border:'none', cursor:'pointer',
              background:selCrop===key?`${c.color}22`:'rgba(255,255,255,0.04)',
              outline:selCrop===key?`1px solid ${c.color}66`:'1px solid rgba(255,255,255,0.06)',
              color:selCrop===key?c.color:'#64748b',
              fontFamily:"'DM Sans'", fontWeight:600, fontSize:11, transition:'all 0.2s',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            }}>
              <span style={{ fontSize:20 }}>{c.emoji}</span>{c.name}
            </button>
          ))}
        </div>
        <div style={{ padding:14, borderRadius:12, background:`${crop.color}0f`, border:`1px solid ${crop.color}33` }}>
          <div style={{ fontFamily:"'Syne'", fontWeight:700, color:crop.color, fontSize:15, marginBottom:10 }}>
            {crop.emoji} {crop.name}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { l:'Target Temp',    v:`${crop.idealTemp}°C` },
              { l:'Target Moisture',v:`${crop.idealMoisture}%` },
              { l:'Est. Duration',  v:`${crop.dryingHours}h` },
              { l:'Opt. Fan Speed', v:`${optFan}%` },
            ].map(r => (
              <div key={r.l} style={{ padding:'8px', borderRadius:8, background:'rgba(0,0,0,0.2)', textAlign:'center' }}>
                <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'", marginBottom:2 }}>{r.l}</div>
                <div style={{ fontSize:14, color:crop.color, fontFamily:"'Space Mono'", fontWeight:700 }}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weather */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:12 }}>
          {weatherAdvice.icon} Weather Intelligence
        </div>
        <div style={{ padding:12, borderRadius:12, background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)', marginBottom:12 }}>
          <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.7, fontFamily:"'DM Sans'" }}>💡 {weatherAdvice.advice}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div style={{ padding:10, borderRadius:10, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'", marginBottom:2 }}>OPT. HEAT</div>
            <div style={{ fontSize:20, color:'#fbbf24', fontFamily:"'Syne'", fontWeight:800 }}>{optHeat}°C</div>
          </div>
          <div style={{ padding:10, borderRadius:10, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'#64748b', fontFamily:"'Space Mono'", marginBottom:2 }}>OPT. FAN</div>
            <div style={{ fontSize:20, color:'#a78bfa', fontFamily:"'Syne'", fontWeight:800 }}>{optFan}%</div>
          </div>
        </div>
      </div>

      {/* Radar */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:12 }}>Performance Radar</div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)"/>
            <PolarAngleAxis dataKey="subject" tick={{ fill:'#64748b', fontSize:10, fontFamily:"'Space Mono'" }}/>
            <Radar name="Now" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk assessment */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:12 }}>Risk Assessment</div>
        {risks.map(r => (
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', marginBottom:8 }}>
            <div>
              <div style={{ fontSize:12, color:'#94a3b8', fontFamily:"'DM Sans'" }}>{r.label}</div>
              <div style={{ fontSize:10, color:'#4a5568', fontFamily:"'Space Mono'" }}>{r.detail}</div>
            </div>
            <div style={{ padding:'3px 10px', borderRadius:8, fontSize:10,
              background:`${riskColor(r.risk)}18`, color:riskColor(r.risk),
              border:`1px solid ${riskColor(r.risk)}44`, fontFamily:"'Space Mono'", fontWeight:700 }}>{r.risk}</div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div style={{ background:'linear-gradient(135deg,rgba(56,189,248,0.06),#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(56,189,248,0.2)' }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#38bdf8', marginBottom:12 }}>🧠 Recommendations</div>
        {[
          dryer.temperature<crop_data.idealTemp-5&&{ icon:'🌡️', msg:`Raise temp to ${crop_data.idealTemp}°C for optimal drying` },
          dryer.fanSpeed<60&&dryer.status==='running'&&{ icon:'🌀', msg:'Fan speed below optimal — increase to 70%+' },
          weather==='rainy'&&{ icon:'🌧️', msg:'Rain: increase fan +20%, extend drying window ~1.5h' },
          weather==='harmattan'&&{ icon:'💨', msg:'Harmattan: reduce heating -20%, use natural dehumidification' },
          { icon:'📊', msg:`Based on physics model: est. ${crop_data.dryingHours}h for ${crop_data.name} at ideal settings` },
        ].filter(Boolean).map((r,i) => (
          <div key={i} style={{ padding:'10px 12px', borderRadius:10, background:'rgba(56,189,248,0.05)',
            border:'1px solid rgba(56,189,248,0.1)', display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{r.icon}</span>
            <span style={{ fontSize:12, color:'#94a3b8', fontFamily:"'DM Sans'", lineHeight:1.5 }}>{r.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
