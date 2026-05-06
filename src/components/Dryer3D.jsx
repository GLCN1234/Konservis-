import React, { useState, useEffect } from 'react';

const Dryer3D = ({ dryer, size = 'large' }) => {
  const [fanAngle, setFanAngle] = useState(0);
  const [heatWave, setHeatWave] = useState(0);
  const [steamOpacity, setSteamOpacity] = useState(0);

  const isRunning = dryer.status === 'running';
  const isPaused = dryer.status === 'paused';
  const isComplete = dryer.status === 'complete';
  const isFault = dryer.status === 'fault';

  const fanSpeed = dryer.fanSpeed || 0;
  const temp = dryer.temperature || 25;
  const progress = dryer.progress || 0;
  const heatingLevel = dryer.heatingLevel || 0;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setFanAngle(a => (a + (fanSpeed / 100) * 25) % 360);
      setHeatWave(w => (w + 1) % 100);
      setSteamOpacity(o => Math.sin(Date.now() / 800) * 0.5 + 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, [isRunning, fanSpeed]);

  const statusColor = isRunning ? '#4ade80' : isPaused ? '#fbbf24' : isFault ? '#f87171' : isComplete ? '#38bdf8' : '#4a5568';
  const bodyColor = isRunning ? '#1a7a3d' : isPaused ? '#7a6010' : isFault ? '#7a1a1a' : '#1c4a2e';
  const glowColor = isRunning ? 'rgba(74,222,128,0.4)' : isFault ? 'rgba(248,113,113,0.4)' : 'rgba(56,189,248,0.2)';

  const w = size === 'large' ? 500 : 280;
  const h = size === 'large' ? 380 : 210;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        inset: '-20px',
        background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none',
        animation: isRunning ? 'pulse-glow 2s infinite' : 'none',
      }} />
      
      <svg
        viewBox="0 0 500 380"
        width={w}
        height={h}
        style={{ display: 'block', filter: isFault ? 'hue-rotate(10deg)' : 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Body gradient */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d8a50" />
            <stop offset="50%" stopColor={bodyColor} />
            <stop offset="100%" stopColor="#0f3320" />
          </linearGradient>
          
          {/* Top face gradient */}
          <linearGradient id="topFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3da862" />
            <stop offset="100%" stopColor="#1a5c33" />
          </linearGradient>

          {/* Side face gradient */}
          <linearGradient id="sideFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a5c33" />
            <stop offset="100%" stopColor="#0a2e1a" />
          </linearGradient>

          {/* Display gradient */}
          <linearGradient id="displayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          {/* Heat element gradient */}
          <linearGradient id="heatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={heatingLevel > 50 ? '#ff6b35' : '#555'} />
            <stop offset="100%" stopColor={heatingLevel > 50 ? '#ff0000' : '#333'} stopOpacity="0.3" />
          </linearGradient>

          {/* Inner glow */}
          <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={heatingLevel > 30 ? 'rgba(255,100,0,0.3)' : 'rgba(0,0,0,0)'} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Grid pattern */}
          <pattern id="gridPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#1a1a1a" />
            <rect x="1" y="1" width="10" height="10" fill="#222" rx="1" />
          </pattern>

          {/* Fan blade gradient */}
          <linearGradient id="fanBladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#888" />
            <stop offset="100%" stopColor="#444" />
          </linearGradient>

          {/* Shadow */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.6)" />
          </filter>

          {/* Glow filter */}
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* === ISOMETRIC DRYER BODY === */}
        
        {/* Shadow on floor */}
        <ellipse cx="200" cy="360" rx="180" ry="20" fill="rgba(0,0,0,0.4)" />

        {/* === MAIN BODY (front face) === */}
        {/* Back-left panel (top) */}
        <polygon points="60,80 240,30 380,80 380,300 60,300" fill="url(#bodyGrad)" filter="url(#shadow)" />

        {/* Top face (isometric) */}
        <polygon points="60,80 240,30 420,80 240,130" fill="url(#topFaceGrad)" />

        {/* Right side face (darker) */}
        <polygon points="380,80 420,80 420,295 380,300" fill="url(#sideFaceGrad)" />

        {/* === FRONT DOOR (open, showing interior) === */}
        {/* Door hinge area */}
        <polygon points="60,110 60,300 130,300 130,110" fill="#0f4020" stroke="#1a5c33" strokeWidth="1" />

        {/* Interior cavity */}
        <rect x="130" y="110" width="230" height="175" fill="#111" rx="2" />
        
        {/* Inner glow when heating */}
        <rect x="130" y="110" width="230" height="175" fill="url(#innerGlow)" />

        {/* Grid/rack inside */}
        <rect x="135" y="220" width="220" height="60" fill="url(#gridPattern)" rx="2" />
        <rect x="135" y="155" width="220" height="60" fill="url(#gridPattern)" rx="2" />

        {/* Tray runners */}
        {[215, 280].map((y, i) => (
          <line key={i} x1="135" y1={y} x2="355" y2={y} stroke="#333" strokeWidth="2" />
        ))}

        {/* Crop material on tray (animated) */}
        {isRunning || isComplete ? (
          <g opacity="0.9">
            <rect x="140" y="225" width="210" height="50" fill={isComplete ? '#d97706' : '#c17b2a'} rx="2" opacity="0.7" />
            {/* Crop texture dots */}
            {Array.from({ length: 20 }, (_, i) => (
              <circle
                key={i}
                cx={145 + (i % 5) * 42}
                cy={240 + Math.floor(i / 5) * 12}
                r="4"
                fill={isComplete ? '#f59e0b' : '#a16207'}
                opacity="0.8"
              />
            ))}
          </g>
        ) : null}

        {/* === HEATING ELEMENT (spiral at top of interior) === */}
        <g transform="translate(245, 130)">
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse
              key={i}
              cx="0" cy="0"
              rx={50 - i * 7} ry={8 - i}
              fill="none"
              stroke={heatingLevel > 20 ? `rgba(255,${100 + i * 20},0,${(heatingLevel / 100)})` : '#333'}
              strokeWidth="3"
              filter={heatingLevel > 30 ? 'url(#glowFilter)' : 'none'}
            />
          ))}
        </g>

        {/* === FAN (back wall) === */}
        <g transform={`translate(245, 180) rotate(${fanAngle})`}>
          {/* Fan hub */}
          <circle cx="0" cy="0" r="8" fill="#555" />
          <circle cx="0" cy="0" r="4" fill="#888" />
          {/* Fan blades */}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i * 60) * Math.PI / 180;
            const x2 = Math.cos(angle) * 40;
            const y2 = Math.sin(angle) * 40;
            return (
              <path
                key={i}
                d={`M 0 0 L ${x2 * 0.3} ${y2 * 0.3} Q ${x2 * 0.8} ${y2 * 0.5} ${x2} ${y2} Q ${x2 * 0.6} ${y2 * 0.9} 0 0`}
                fill="url(#fanBladeGrad)"
                opacity="0.85"
              />
            );
          })}
        </g>

        {/* Heat waves (steam) when running */}
        {isRunning && heatingLevel > 20 && (
          <g opacity={steamOpacity * 0.6}>
            {[170, 200, 230, 260].map((x, i) => (
              <path
                key={i}
                d={`M${x},140 Q${x + 8 - i * 2},125 ${x},110 Q${x - 8},95 ${x},80`}
                fill="none"
                stroke="rgba(255,150,50,0.4)"
                strokeWidth="2"
                strokeDasharray="4,4"
                style={{ animation: `scan 2s ${i * 0.2}s linear infinite` }}
              />
            ))}
          </g>
        )}

        {/* === CONTROL PANEL (right side of front) === */}
        {/* Display panel */}
        <rect x="300" y="130" width="65" height="80" fill="url(#displayGrad)" rx="6" />
        <rect x="305" y="135" width="55" height="30" fill="#1a0a00" rx="4" />
        {/* Temperature display */}
        <text x="332" y="158" fill={temp > 60 ? '#ff6b35' : '#fbbf24'} fontSize="14" fontFamily="'Space Mono'" textAnchor="middle" fontWeight="700">
          {temp.toFixed(0)}°
        </text>
        <text x="332" y="170" fill="#d97706" fontSize="7" fontFamily="'Space Mono'" textAnchor="middle">TEMP</text>

        {/* Buttons on panel */}
        {[150, 165, 180].map((y, i) => (
          <rect key={i} x="308" y={y} width="18" height="8" rx="2"
            fill={i === 0 && isRunning ? '#4ade80' : i === 1 ? '#fbbf24' : '#f87171'}
            opacity="0.9"
          />
        ))}

        {/* Progress indicator strip */}
        <rect x="305" y="195" width="55" height="8" fill="#0f0f0f" rx="4" />
        <rect x="305" y="195" width={55 * progress / 100} height="8" fill={statusColor} rx="4" />
        <text x="332" y="216" fill="#d97706" fontSize="6" fontFamily="'Space Mono'" textAnchor="middle">
          {progress.toFixed(0)}% DRY
        </text>

        {/* === STATUS LIGHT === */}
        <circle cx="95" cy="130" r="10" fill={statusColor}
          filter={isRunning ? 'url(#glowFilter)' : 'none'}
          opacity={isRunning ? 0.9 : 0.5}
        />
        <text x="95" y="152" fill={statusColor} fontSize="7" fontFamily="'DM Sans'" textAnchor="middle" opacity="0.8">
          {dryer.status.toUpperCase()}
        </text>

        {/* === EXHAUST VENT (right side) === */}
        <rect x="378" y="120" width="12" height="140" fill="#0a2e1a" />
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="378" y1={130 + i * 16} x2="390" y2={130 + i * 16}
            stroke="#1a5c33" strokeWidth="1.5" />
        ))}

        {/* Exhaust heat shimmer when running */}
        {isRunning && (
          <g>
            {[135, 150, 165].map((y, i) => (
              <line key={i}
                x1="392" y1={y}
                x2={400 + Math.sin((heatWave + i * 20) * 0.1) * 5} y2={y - 20}
                stroke="rgba(255,150,0,0.3)" strokeWidth="2"
                strokeDasharray="2,3"
              />
            ))}
          </g>
        )}

        {/* === LEGS === */}
        {[80, 160, 250, 340].map((x, i) => (
          <rect key={i} x={x + 10} y={295} width="12" height="30" fill="#0f3320" rx="2" />
        ))}

        {/* === DOOR (slightly open) === */}
        <polygon
          points="60,110 60,300 40,310 40,120"
          fill="#2d7a45"
          stroke="#1a5c33"
          strokeWidth="1"
          style={{ filter: 'drop-shadow(-4px 2px 8px rgba(0,0,0,0.5))' }}
        />
        {/* Door handle */}
        <rect x="52" y="200" width="6" height="20" rx="3" fill="#888" />

        {/* === COMPANY LOGO === */}
        <text x="200" y="70" fill="rgba(255,255,255,0.15)" fontSize="11" fontFamily="'Syne'" textAnchor="middle" fontWeight="800" letterSpacing="3">
          KONSERVI
        </text>

        {/* === COMPLETION CELEBRATION === */}
        {isComplete && (
          <g>
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={i}
                cx={120 + i * 30}
                cy={50 - Math.sin(Date.now() / 500 + i) * 20}
                r="4"
                fill={['#4ade80', '#fbbf24', '#38bdf8', '#a78bfa'][i % 4]}
                opacity="0.8"
              />
            ))}
            <text x="200" y="45" fill="#4ade80" fontSize="12" fontFamily="'Syne'" textAnchor="middle" fontWeight="700"
              filter="url(#glowFilter)">
              DRYING COMPLETE ✓
            </text>
          </g>
        )}

        {/* === FAULT STATE === */}
        {isFault && (
          <g>
            <text x="200" y="45" fill="#f87171" fontSize="14" fontFamily="'Syne'" textAnchor="middle" fontWeight="800"
              filter="url(#glowFilter)" style={{ animation: 'pulse-glow 0.5s infinite' }}>
              ⚠ FAULT
            </text>
            {/* Red X overlay */}
            <line x1="130" y1="110" x2="360" y2="285" stroke="rgba(248,113,113,0.3)" strokeWidth="4" />
            <line x1="360" y1="110" x2="130" y2="285" stroke="rgba(248,113,113,0.3)" strokeWidth="4" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default Dryer3D;
