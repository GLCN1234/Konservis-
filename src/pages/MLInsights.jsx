import React, { useState } from 'react';
import { useDryerStore, CROPS, WEATHER } from '../store/dryerStore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function MLInsights() {
  const { dryers, activeDryer, weather, ambientTemp, ambientHumidity } = useDryerStore();
  const dryer    = dryers.find(d => d.id === activeDryer) || dryers[0];
  const [selCrop, setSelCrop] = useState(dryer.crop);

  const crop      = CROPS[selCrop];       // selected crop for recipe view
  const cropData  = CROPS[dryer.crop];    // active dryer crop
  const weatherInfo = WEATHER[weather];

  // ── Real ambient conditions ──────────────────────────────────────
  const T_amb   = ambientTemp  || 28;
  const RH_amb  = ambientHumidity || weatherInfo.humidity;

  // ── Physics: current drying efficiency ──────────────────────────
  const tempFactor    = Math.max(0, (dryer.temperature - T_amb) / Math.max(1, cropData.idealTemp - T_amb));
  const fanFactor     = Math.max(0.01, dryer.fanSpeed / 100);
  const humPenalty    = (RH_amb / 100) * 0.35;
  const k_eff         = cropData.k * tempFactor * fanFactor * (1 - humPenalty);
  const remMoisture   = Math.max(0, dryer.moistureContent - cropData.Me);
  const combinedEff   = tempFactor * 0.6 + fanFactor * 0.4;

  // ML: time to target moisture using Page equation
  const estMins = (k_eff > 0.001 && remMoisture > 0.05)
    ? Math.min(600, Math.max(0, Math.log(remMoisture / 0.05) / k_eff))
    : null;

  const energyEst = cropData.dryingHours / Math.max(0.1, combinedEff)
    * ((dryer.heatingLevel / 100) * 3.0 + (dryer.fanSpeed / 100) * 0.55);

  // ── Optimal parameters for current weather ───────────────────────
  const optFan  = weather === 'harmattan' ? 60 : weather === 'rainy' ? 85 : 75;
  const optHeat = weather === 'sunny'
    ? Math.round(cropData.idealTemp * 0.85)
    : weather === 'rainy'
      ? Math.round(cropData.idealTemp * 1.05)
      : cropData.idealTemp;

  // ── AI Parameter Prescription for selected crop + weather ────────
  const prescription = {
    targetTemp:     crop.idealTemp,
    targetMoisture: crop.Me,
    fanSpeed:       weather === 'harmattan' ? 60 : weather === 'rainy' ? 85 : 75,
    heatingLevel:   weather === 'sunny'
      ? Math.round(crop.idealTemp / 95 * 70 * 0.85)
      : Math.round(crop.idealTemp / 95 * 70),
    estDuration:    crop.dryingHours,
    initialMC:      crop.M0,
  };

  // ── Risk assessment using correct field names ─────────────────────
  const risks = [
    {
      label:  'Over-drying Risk',
      risk:   dryer.moistureContent < (cropData.Me - 1) ? 'HIGH'
              : dryer.moistureContent < cropData.Me ? 'MED' : 'LOW',
      detail: `Current: ${dryer.moistureContent.toFixed(1)}% w.b. | Safe storage: ${cropData.Me}% w.b.`,
    },
    {
      label:  'Heat Stress Risk',
      risk:   dryer.temperature > cropData.idealTemp + 10 ? 'HIGH'
              : dryer.temperature > cropData.idealTemp + 5 ? 'MED' : 'LOW',
      detail: `Chamber: ${dryer.temperature.toFixed(1)}°C | Max safe: ${cropData.idealTemp}°C`,
    },
    {
      label:  'Vibration Risk',
      risk:   dryer.vibration > 0.4 ? 'HIGH' : dryer.vibration > 0.22 ? 'MED' : 'LOW',
      detail: `Vibration: ${dryer.vibration.toFixed(3)} g | Alert threshold: 0.45 g`,
    },
    {
      label:  'Humidity Risk',
      risk:   RH_amb > 75 ? 'HIGH' : RH_amb > 55 ? 'MED' : 'LOW',
      detail: `Ambient RH: ${RH_amb.toFixed(0)}% — affects drying rate by ${(humPenalty * 100).toFixed(0)}%`,
    },
  ];
  const riskColor = r => r === 'HIGH' ? '#f87171' : r === 'MED' ? '#fbbf24' : '#4ade80';

  const radarData = [
    { subject: 'Temp',     A: Math.min(100, (dryer.temperature / cropData.idealTemp) * 100) },
    { subject: 'Fan',      A: dryer.fanSpeed },
    { subject: 'Dryforce', A: Math.max(0, 100 - RH_amb) },
    { subject: 'Progress', A: dryer.progress },
    { subject: 'Heating',  A: dryer.heatingLevel },
    { subject: 'Health',   A: dryer.maintenanceScore },
  ];

  const card = (label, value, color, sub) => (
    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'Space Mono'", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, color, fontFamily: "'Syne'", fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#4a5568', fontFamily: "'Space Mono'", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 'clamp(20px,5vw,26px)', color: '#f0f6ff', margin: 0 }}>
          AI Insights
        </h1>
        <p style={{ color: '#4a5568', fontSize: 12, margin: '4px 0 0', fontFamily: "'DM Sans'" }}>
          ML-powered crop drying optimization · Real-time parameter prescription
        </p>
      </div>

      {/* Real weather banner */}
      <div style={{ padding: '10px 14px', borderRadius: 12, marginBottom: 16,
        background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{weatherInfo.icon}</span>
          <div>
            <div style={{ fontSize: 12, color: '#38bdf8', fontFamily: "'Syne'", fontWeight: 700 }}>
              {weatherInfo.label} · Lagos
            </div>
            <div style={{ fontSize: 10, color: '#4a5568', fontFamily: "'Space Mono'" }}>
              {ambientTemp ? `Real data: ${T_amb.toFixed(1)}°C · ${RH_amb.toFixed(0)}% RH` : 'Estimated conditions'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { l: 'Temp', v: `${T_amb.toFixed(1)}°C`, c: '#fb923c' },
            { l: 'RH',   v: `${RH_amb.toFixed(0)}%`, c: '#a78bfa' },
            { l: 'Drying Penalty', v: `${(humPenalty * 100).toFixed(0)}%`, c: '#fbbf24' },
          ].map(r => (
            <div key={r.l} style={{ padding: '4px 10px', borderRadius: 8, background: `${r.c}12`,
              border: `1px solid ${r.c}30`, textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: '#4a5568', fontFamily: "'Space Mono'" }}>{r.l}</div>
              <div style={{ fontSize: 12, color: r.c, fontFamily: "'Space Mono'", fontWeight: 700 }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live prediction if dryer is running */}
      {dryer.status === 'running' && (
        <div style={{ padding: 16, borderRadius: 16, marginBottom: 16,
          background: 'linear-gradient(135deg,rgba(74,222,128,0.08),rgba(56,189,248,0.06))',
          border: '1px solid rgba(74,222,128,0.25)' }}>
          <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 14, color: '#4ade80', marginBottom: 12 }}>
            🧠 Live ML Prediction — {cropData.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 12 }}>
            {card('TIME REMAINING',
              estMins != null ? (estMins > 90 ? `~${(estMins/60).toFixed(1)}h` : `~${Math.round(estMins)}min`) : 'Calculating...',
              '#38bdf8')}
            {card('EST. ENERGY', `${energyEst.toFixed(2)} kWh`, '#fbbf24')}
            {card('CURRENT MC', `${dryer.moistureContent.toFixed(1)}% w.b.`, '#4ade80', 'wet basis')}
            {card('TARGET MC', `${cropData.Me}% w.b.`, '#a78bfa', 'safe storage')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.2)' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'Space Mono'" }}>DRYING EFFICIENCY</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${combinedEff * 100}%`, height: '100%',
                  background: combinedEff > 0.7 ? '#4ade80' : '#fbbf24', borderRadius: 3 }}/>
              </div>
              <span style={{ fontSize: 13, color: combinedEff > 0.7 ? '#4ade80' : '#fbbf24',
                fontFamily: "'Space Mono'", fontWeight: 700 }}>{(combinedEff * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Parameter Prescription */}
      <div style={{ background: 'linear-gradient(135deg,#111d33,#0d1526)', borderRadius: 20,
        padding: 16, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 14, color: '#f0f6ff', marginBottom: 4 }}>
          🎯 AI Parameter Prescription
        </div>
        <div style={{ fontSize: 11, color: '#4a5568', fontFamily: "'DM Sans'", marginBottom: 14 }}>
          Exact settings to use for optimal drying — adjust crop and weather updates automatically
        </div>

        {/* Crop selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
          {Object.entries(CROPS).map(([key, c]) => (
            <button key={key} onClick={() => setSelCrop(key)} style={{
              padding: '8px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: selCrop === key ? `${c.color}22` : 'rgba(255,255,255,0.04)',
              outline: selCrop === key ? `1px solid ${c.color}66` : '1px solid rgba(255,255,255,0.06)',
              color: selCrop === key ? c.color : '#64748b',
              fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 11, transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 18 }}>{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Prescription card */}
        <div style={{ padding: 14, borderRadius: 14, background: `${crop.color}0c`,
          border: `1px solid ${crop.color}33` }}>
          <div style={{ fontFamily: "'Syne'", fontWeight: 700, color: crop.color, fontSize: 15, marginBottom: 12 }}>
            {crop.emoji} {crop.name} — Optimal Recipe
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { l: 'Set Temperature',  v: `${prescription.targetTemp}°C`,      c: '#fb923c', note: 'max safe temp' },
              { l: 'Target MC',        v: `${prescription.targetMoisture}% w.b.`, c: '#4ade80', note: 'safe storage' },
              { l: 'Initial MC',       v: `${prescription.initialMC}% w.b.`,   c: '#38bdf8', note: 'starting point' },
              { l: 'Set Fan Speed',    v: `${prescription.fanSpeed}%`,          c: '#a78bfa', note: `for ${weatherInfo.label}` },
              { l: 'Set Heating',      v: `${prescription.heatingLevel}%`,      c: '#fbbf24', note: 'element level' },
              { l: 'Est. Duration',    v: `${prescription.estDuration}h`,       c: '#38bdf8', note: 'at ideal settings' },
            ].map(r => (
              <div key={r.l} style={{ padding: '10px', borderRadius: 10, background: 'rgba(0,0,0,0.2)',
                border: `1px solid ${r.c}22` }}>
                <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'Space Mono'", marginBottom: 2 }}>{r.l}</div>
                <div style={{ fontSize: 16, color: r.c, fontFamily: "'Syne'", fontWeight: 800 }}>{r.v}</div>
                <div style={{ fontSize: 9, color: '#4a5568', fontFamily: "'Space Mono'" }}>{r.note}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.2)',
            fontSize: 12, color: '#94a3b8', fontFamily: "'DM Sans'", lineHeight: 1.6 }}>
            💡 {crop.notes}
          </div>
        </div>
      </div>

      {/* Radar + Risk side by side on tablet+ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14, marginBottom: 14 }}>
        <div style={{ background: 'linear-gradient(135deg,#111d33,#0d1526)', borderRadius: 20,
          padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 14, color: '#f0f6ff', marginBottom: 12 }}>
            Performance Radar
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)"/>
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontFamily: "'Space Mono'" }}/>
              <Radar name="Now" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'linear-gradient(135deg,#111d33,#0d1526)', borderRadius: 20,
          padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 14, color: '#f0f6ff', marginBottom: 12 }}>
            Risk Assessment
          </div>
          {risks.map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', marginBottom: 7,
              border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'DM Sans'" }}>{r.label}</div>
                <div style={{ fontSize: 9, color: '#4a5568', fontFamily: "'Space Mono'" }}>{r.detail}</div>
              </div>
              <div style={{ padding: '3px 8px', borderRadius: 7, fontSize: 10,
                background: `${riskColor(r.risk)}18`, color: riskColor(r.risk),
                border: `1px solid ${riskColor(r.risk)}44`, fontFamily: "'Space Mono'", fontWeight: 700,
                flexShrink: 0, marginLeft: 8 }}>{r.risk}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Recommendations */}
      <div style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.06),#0d1526)', borderRadius: 20,
        padding: 16, border: '1px solid rgba(56,189,248,0.2)' }}>
        <div style={{ fontFamily: "'Syne'", fontWeight: 700, fontSize: 14, color: '#38bdf8', marginBottom: 12 }}>
          🧠 Smart Recommendations
        </div>
        {[
          dryer.temperature < cropData.idealTemp - 5 && {
            icon: '🌡️', priority: 'high',
            msg: `Raise temperature to ${cropData.idealTemp}°C (currently ${dryer.temperature.toFixed(1)}°C) — drying rate is ${((1-tempFactor)*100).toFixed(0)}% below optimal`,
          },
          dryer.fanSpeed < 50 && dryer.status === 'running' && {
            icon: '🌀', priority: 'high',
            msg: `Fan speed ${dryer.fanSpeed}% is too low — raise to ${optFan}% to improve moisture removal by ~${Math.round((optFan - dryer.fanSpeed) * 0.8)}%`,
          },
          weather === 'rainy' && {
            icon: '🌧️', priority: 'medium',
            msg: `Rain detected (RH ${RH_amb.toFixed(0)}%) — humidity penalty is ${(humPenalty*100).toFixed(0)}%. Increase fan to ${optFan}%, extend drying estimate by ~15%`,
          },
          weather === 'harmattan' && {
            icon: '💨', priority: 'low',
            msg: `Harmattan conditions (RH ${RH_amb.toFixed(0)}%) — excellent for drying. Reduce heating to ${optHeat}°C and save ~20% energy`,
          },
          weather === 'sunny' && {
            icon: '☀️', priority: 'low',
            msg: `Clear skies — solar assist mode recommended. Reduce heating setpoint to ${optHeat}°C, save up to 35% energy`,
          },
          dryer.status === 'running' && dryer.heatingLevel > 0 && dryer.temperature > cropData.idealTemp + 3 && {
            icon: '⚠️', priority: 'high',
            msg: `Chamber temp ${dryer.temperature.toFixed(1)}°C exceeds ${cropData.name} safe limit (${cropData.idealTemp}°C) — reduce heating to protect crop quality`,
          },
          {
            icon: '📊', priority: 'info',
            msg: `At current settings: drying rate k_eff = ${k_eff.toFixed(5)} min⁻¹. ${estMins != null ? `Est. ${Math.round(estMins)} min to reach ${cropData.Me}% w.b.` : 'Start dryer to see live estimate.'}`,
          },
        ].filter(Boolean).map((r, i) => {
          const pc = r.priority === 'high' ? '#f87171' : r.priority === 'medium' ? '#fbbf24' : r.priority === 'low' ? '#4ade80' : '#38bdf8';
          return (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: `${pc}08`,
              border: `1px solid ${pc}20`, display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: "'DM Sans'", lineHeight: 1.5 }}>{r.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
