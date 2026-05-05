import React, { useState } from 'react';
import { useDryerStore } from '../store/dryerStore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

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
      <div style={{ fontSize:10, color:'#64748b', marginBottom:3, fontFamily:"'Space Mono'" }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:11, color:p.color, fontFamily:"'Space Mono'" }}>
          {p.name}: {typeof p.value==='number'?p.value.toFixed(2):p.value}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { dryers } = useDryerStore();
  const [sel, setSel] = useState(dryers[0]?.id);
  const dryer = dryers.find(d=>d.id===sel)||dryers[0];
  const batches = dryer?.historicalBatches||[];

  const chartData = batches.slice(0,8).reverse().map((b,i) => ({
    batch:`B${i+1}`, finalMoisture:parseFloat(b.finalMoisture),
    duration:parseFloat(b.duration), energy:parseFloat(b.energyUsed),
  }));

  const pieData = Object.entries(
    batches.reduce((acc,b) => { acc[b.crop]=(acc[b.crop]||0)+1; return acc; }, {})
  ).map(([crop,count]) => ({ name:CROPS[crop]||crop, value:count, color:CROP_COLORS[crop]||'#888' }));

  const totalKg = batches.reduce((s,b) => s+parseFloat(b.weight||0),0);
  const totalEnergy = batches.reduce((s,b) => s+parseFloat(b.energyUsed||0),0);
  const excellent = batches.filter(b=>b.quality==='Excellent').length;

  const card = (label,value,unit,color,icon) => (
    <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:16, padding:16,
      border:'1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:10, color:'#64748b', fontFamily:"'Space Mono'" }}>{label}</span>
        <span>{icon}</span>
      </div>
      <div style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(20px,5vw,26px)', color }}>
        {value}<span style={{ fontSize:12, color:'#64748b', fontFamily:"'Space Mono'" }}> {unit}</span>
      </div>
    </div>
  );

  const emptyChart = <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center',
    color:'#4a5568', fontFamily:"'Space Mono'", fontSize:11 }}>No batch data — run a dryer first</div>;

  return (
    <div style={{ padding:16, maxWidth:1200 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:'clamp(20px,5vw,26px)', color:'#f0f6ff', margin:0 }}>Analytics</h1>
        <p style={{ color:'#4a5568', fontSize:12, margin:'4px 0 0', fontFamily:"'DM Sans'" }}>Historical performance</p>
      </div>

      {/* Dryer tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
        {dryers.map(d => (
          <button key={d.id} onClick={() => setSel(d.id)} style={{
            padding:'7px 14px', borderRadius:10, border:'none', cursor:'pointer', flexShrink:0,
            background:sel===d.id?'rgba(56,189,248,0.15)':'rgba(255,255,255,0.04)',
            outline:sel===d.id?'1px solid rgba(56,189,248,0.4)':'1px solid rgba(255,255,255,0.06)',
            color:sel===d.id?'#38bdf8':'#64748b', fontFamily:"'DM Sans'", fontWeight:600, fontSize:12,
          }}>{d.name}</button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }}>
        {card('Total Batches', batches.length, '', '#38bdf8', '📦')}
        {card('Processed', totalKg.toFixed(0), 'kg', '#4ade80', '🌾')}
        {card('Energy', totalEnergy.toFixed(2), 'kWh', '#fbbf24', '⚡')}
        {card('Excellent', excellent, `/ ${batches.length}`, '#a78bfa', '🏆')}
      </div>

      {/* Moisture chart */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>
          Final Moisture per Batch
        </div>
        {chartData.length>0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="batch" tick={{ fill:'#4a5568', fontSize:10 }}/>
              <YAxis tick={{ fill:'#4a5568', fontSize:10 }}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="finalMoisture" name="Final MC %" radius={[4,4,0,0]}>
                {chartData.map((e,i) => (
                  <Cell key={i} fill={e.finalMoisture<14?'#4ade80':e.finalMoisture<18?'#fbbf24':'#f87171'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : emptyChart}
      </div>

      {/* Energy trend */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>
          Energy vs Duration
        </div>
        {chartData.length>0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="batch" tick={{ fill:'#4a5568', fontSize:10 }}/>
              <YAxis tick={{ fill:'#4a5568', fontSize:10 }}/>
              <Tooltip content={<CT/>}/>
              <Line type="monotone" dataKey="energy" stroke="#fbbf24" strokeWidth={2} dot={{ fill:'#fbbf24',r:3 }} name="Energy (kWh)"/>
              <Line type="monotone" dataKey="duration" stroke="#a78bfa" strokeWidth={2} dot={{ fill:'#a78bfa',r:3 }} name="Duration (h)"/>
            </LineChart>
          </ResponsiveContainer>
        ) : emptyChart}
      </div>

      {/* Crop distribution */}
      {pieData.length>0 && (
        <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
          padding:16, border:'1px solid rgba(255,255,255,0.07)', marginBottom:16 }}>
          <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>
            Crop Distribution
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {pieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip content={<CT/>}/>
              <Legend wrapperStyle={{ fontSize:10, color:'#64748b', fontFamily:"'Space Mono'" }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Batch table — scrollable on mobile */}
      <div style={{ background:'linear-gradient(135deg,#111d33,#0d1526)', borderRadius:20,
        padding:16, border:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:14, color:'#f0f6ff', marginBottom:14 }}>Batch History</div>
        {batches.length===0
          ? <div style={{ textAlign:'center', padding:24, color:'#4a5568', fontFamily:"'Space Mono'", fontSize:11 }}>No batches yet. Start a dryer!</div>
          : (
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                <thead>
                  <tr>
                    {['Batch','Crop','Weight','Duration','Moisture','Energy','Quality'].map(h => (
                      <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:9, color:'#38bdf8',
                        fontFamily:"'Space Mono'", letterSpacing:1, borderBottom:'1px solid rgba(255,255,255,0.06)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batches.slice(0,10).map((b,i) => {
                    const qc = b.quality==='Excellent'?'#4ade80':b.quality==='Good'?'#38bdf8':'#fbbf24';
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding:'8px 10px', fontSize:10, color:'#38bdf8', fontFamily:"'Space Mono'" }}>{b.id?.slice(-6)||`B${i+1}`}</td>
                        <td style={{ padding:'8px 10px', fontSize:11, color:CROP_COLORS[b.crop]||'#94a3b8' }}>{CROPS[b.crop]||b.crop}</td>
                        <td style={{ padding:'8px 10px', fontSize:11, color:'#94a3b8', fontFamily:"'Space Mono'" }}>{parseFloat(b.weight).toFixed(0)}kg</td>
                        <td style={{ padding:'8px 10px', fontSize:11, color:'#94a3b8', fontFamily:"'Space Mono'" }}>{parseFloat(b.duration).toFixed(1)}h</td>
                        <td style={{ padding:'8px 10px', fontSize:11, color:parseFloat(b.finalMoisture)<14?'#4ade80':'#fbbf24', fontFamily:"'Space Mono'" }}>{parseFloat(b.finalMoisture).toFixed(1)}%</td>
                        <td style={{ padding:'8px 10px', fontSize:11, color:'#94a3b8', fontFamily:"'Space Mono'" }}>{parseFloat(b.energyUsed).toFixed(2)}kWh</td>
                        <td style={{ padding:'8px 10px' }}>
                          <span style={{ fontSize:9, color:qc, background:`${qc}18`, padding:'2px 7px', borderRadius:5, fontFamily:"'Space Mono'" }}>{b.quality}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}
