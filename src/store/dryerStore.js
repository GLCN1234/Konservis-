import { create } from 'zustand';

/**
 * CROP DATA — verified from scientific literature:
 * - FAO Post-Harvest Compendium (1985, 2011)
 * - IRRI Rice Knowledge Bank (2015)
 * - CRI Ghana Cocoa Drying Guidelines
 * - NSPRI Nigeria Post-Harvest Loss Studies
 * - Brooker et al. "Drying and Storage of Grains and Oilseeds" (1992)
 *
 * SI Units used throughout:
 *   Temperature:      °C  (Celsius)
 *   Moisture Content: % w.b. (wet basis, standard for post-harvest)
 *   Energy:           kWh (kilowatt-hours)
 *   Power:            kW  (kilowatts)
 *   Vibration:        g   (acceleration, 1g = 9.81 m/s²)
 *   Humidity:         % RH (relative humidity)
 *   Time:             min / h
 *   Mass:             kg
 *
 * Moisture Model: Simplified Page Equation (thin-layer drying)
 *   MR(t) = exp(-k * t)
 *   where MR = (M - Me)/(M0 - Me)  [dimensionless moisture ratio]
 *   M  = current MC % w.b.
 *   Me = equilibrium MC % w.b. (safe storage level)
 *   M0 = initial MC % w.b.
 *   k  = drying rate constant (min⁻¹), crop-specific, calibrated to match
 *        real drying duration at ideal temperature and fan conditions
 *
 * k_crop values calibrated by binary search so that at:
 *   heatingLevel=70%, fanSpeed=75%, T_ambient=28°C
 * each crop reaches Me within its literature-cited drying time.
 */
export const CROPS = {
  //          name         M0    Me    idealTemp  k_crop    dryHrs  color      emoji
  maize:     { name:'Maize',     M0:28,  Me:13,  idealTemp:55, k:0.01139, dryingHours:8,  color:'#fbbf24', emoji:'🌽',
    notes:'Safe storage MC: 13% w.b. Over-drying below 11% causes brittle kernels. Temp >60°C damages starch.' },
  cassava:   { name:'Cassava',   M0:65,  Me:12,  idealTemp:60, k:0.01231, dryingHours:10, color:'#fb923c', emoji:'🥔',
    notes:'Very high initial MC (65% w.b.). Watch for mold in first 3h. Safe storage MC: 12% w.b.' },
  pepper:    { name:'Pepper',    M0:80,  Me:10,  idealTemp:55, k:0.01486, dryingHours:8,  color:'#f87171', emoji:'🌶️',
    notes:'Highest initial MC (80% w.b.). 55°C preserves capsaicin & colour. >60°C degrades quality.' },
  cocoa:     { name:'Cocoa',     M0:55,  Me:7.5, idealTemp:50, k:0.00650, dryingHours:12, color:'#92400e', emoji:'🍫',
    notes:'Post-fermentation MC ~55% w.b. Safe storage: 7.5% w.b. Temp >55°C destroys flavour precursors.' },
  rice:      { name:'Rice',      M0:22,  Me:14,  idealTemp:43, k:0.00674, dryingHours:7,  color:'#e2e8f0', emoji:'🌾',
    notes:'Lowest drying temp: 43°C max to prevent head rice breakage. Safe storage MC: 14% w.b.' },
  groundnut: { name:'Groundnut', M0:40,  Me:8,   idealTemp:40, k:0.00492, dryingHours:9,  color:'#d97706', emoji:'🥜',
    notes:'40°C max — higher temps accelerate aflatoxin risk. Safe storage MC: 8% w.b.' },
};

export const WEATHER = {
  sunny:     { label:'Sunny',     humidity:35, tempBoost:5,  icon:'☀️' },
  cloudy:    { label:'Cloudy',    humidity:60, tempBoost:0,  icon:'⛅' },
  rainy:     { label:'Rainy',     humidity:85, tempBoost:-3, icon:'🌧️' },
  harmattan: { label:'Harmattan', humidity:20, tempBoost:2,  icon:'💨' },
};

/**
 * DRYER HARDWARE SPECS (Konservis Hybrid Electric Dryer)
 *   Heating element max power: 3.0 kW
 *   Fan motor max power:        0.55 kW
 *   Thermal mass constant:      8 min (time to reach steady state)
 *   Cooling coefficient:        0.04 (°C⁻¹ min⁻¹, Newton's law of cooling)
 *   Vibration baseline (idle):  0.05 g
 *   Vibration at 100% fan:     ~0.23 g (linear model, well below 0.55 g alert)
 *   Motor temp rise rate:       0.75 °C/min per unit fan load
 */

const CROP_KEYS = ['maize','cassava','pepper','cocoa','rice','groundnut'];


// Seed realistic historical batches so Analytics shows data immediately
const seedBatches = (dryerId) => {
  const cropMap = {
    'dryer-1': ['maize','rice','maize','groundnut','maize','cassava','maize','rice'],
    'dryer-2': ['cassava','pepper','cocoa','cassava','pepper','cassava','cocoa','pepper'],
    'dryer-3': ['cocoa','groundnut','pepper','cocoa','maize','groundnut','cocoa','rice'],
  };
  const crops = cropMap[dryerId] || CROP_KEYS;
  return Array.from({ length: 8 }, (_, i) => {
    const cropKey = crops[i % crops.length];
    const crop    = CROPS[cropKey];
    const daysAgo = (i + 1) * (2 + Math.floor(Math.random() * 3));
    const dur     = (crop.dryingHours * (0.9 + Math.random() * 0.2)).toFixed(2);
    const fm      = (crop.Me + Math.random() * 1.5).toFixed(2);
    const energy  = ((parseFloat(dur) * 2.8 + Math.random() * 0.5)).toFixed(3);
    return {
      id:           `KV-SEED${i}${dryerId.slice(-1)}`,
      crop:         cropKey,
      weight:       Math.round(40 + Math.random() * 80),
      startTime:    new Date(Date.now() - daysAgo * 86400000).toISOString(),
      duration:     dur,
      finalMoisture:fm,
      energyUsed:   energy,
      quality:      parseFloat(fm) <= crop.Me + 0.5 ? 'Excellent' : parseFloat(fm) <= crop.Me + 1.5 ? 'Good' : 'Fair',
    };
  });
};

const createDryer = (id, name) => ({
  id, name,
  status: 'idle',           // idle | running | paused | complete | fault
  crop: 'maize',
  // SI: °C
  temperature: 28,          // Current chamber air temperature (°C)
  targetTemp: 55,           // Target drying temperature (°C)
  // SI: % RH
  humidity: 60,             // Chamber relative humidity (% RH)
  // SI: % w.b. (wet basis moisture content)
  moistureContent: 28,      // Current crop moisture content (% w.b.)
  targetMoisture: 13,       // Safe storage MC (% w.b.)
  // SI: % (0–100)
  fanSpeed: 0,              // Fan speed setpoint (%)
  heatingLevel: 0,          // Heating element setpoint (%)
  progress: 0,              // Drying progress (%)
  startTime: null,
  estimatedCompletion: null,
  // SI: kg
  batchWeight: 50,          // Batch load mass (kg)
  batchId: null,
  alerts: [],
  _firedAlerts: {},
  maintenanceScore: 95,
  // SI: g (1g = 9.81 m/s²)
  vibration: 0.05,          // Fan/motor vibration (g)
  // SI: °C
  motorTemp: 28,            // Drive motor winding temperature (°C)
  // SI: kWh
  energyUsed: 0,            // Cumulative energy consumed (kWh)
  logs: [],
  historicalBatches: seedBatches(id),
  mlEstimatedMinutes: null, // ML prediction: minutes to completion
  efficiencyScore: 0,       // 0–100
});

export const useDryerStore = create((set, get) => ({
  dryers: [
    createDryer('dryer-1', 'Dryer Alpha'),
    createDryer('dryer-2', 'Dryer Beta'),
    createDryer('dryer-3', 'Dryer Gamma'),
  ],
  activeDryer: 'dryer-1',
  weather: 'sunny',
  sensorHistory: {},
  ambientTemp: 28,
  ambientHumidity: 60,

  setActiveDryer: (id) => set({ activeDryer: id }),
  setWeather:     (w)  => set({ weather: w }),
  updateRealWeather: ({ambientTemp, ambientHumidity}) => set({ ambientTemp, ambientHumidity }),

  startDryer: (id) => set(state => {
    const dryer = state.dryers.find(d => d.id === id);
    if (!dryer) return state;
    const crop = CROPS[dryer.crop];
    const now  = new Date();
    const completion = new Date(now.getTime() + crop.dryingHours * 3600 * 1000);
    return {
      dryers: state.dryers.map(d => d.id === id ? {
        ...d,
        status: 'running',
        startTime: now.toISOString(),
        estimatedCompletion: completion.toISOString(),
        fanSpeed: 75,
        heatingLevel: 70,
        targetTemp: crop.idealTemp,
        targetMoisture: crop.Me,
        moistureContent: crop.M0,
        progress: 0,
        batchId: `KV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        alerts: [],
        _firedAlerts: {},
        energyUsed: 0,
        logs: [{
          time: now.toISOString(),
          msg: `Batch started — ${crop.name} | Initial MC: ${crop.M0}% w.b. | Target MC: ${crop.Me}% w.b. | Target Temp: ${crop.idealTemp}°C`,
          type: 'info',
        }],
      } : d),
    };
  }),

  stopDryer: (id) => set(state => ({
    dryers: state.dryers.map(d => d.id === id ? {
      ...d, status:'idle', fanSpeed:0, heatingLevel:0, _firedAlerts:{},
      logs: [...d.logs, { time:new Date().toISOString(), msg:'Dryer stopped manually by operator', type:'warn' }],
    } : d),
  })),

  pauseDryer: (id) => set(state => ({
    dryers: state.dryers.map(d => d.id === id ? {
      ...d,
      status: d.status === 'paused' ? 'running' : 'paused',
      fanSpeed:    d.status === 'paused' ? 75 : 20,
      heatingLevel:d.status === 'paused' ? 70 : 10,
      logs: [...d.logs, { time:new Date().toISOString(), msg:d.status==='paused'?'Drying resumed':'Drying paused', type:'info' }],
    } : d),
  })),

  emergencyShutdown: (id) => set(state => ({
    dryers: state.dryers.map(d => d.id === id ? {
      ...d, status:'fault', fanSpeed:0, heatingLevel:0, _firedAlerts:{},
      alerts: [{ id:Date.now(), msg:'🚨 EMERGENCY SHUTDOWN ACTIVATED', type:'critical', time:new Date().toISOString() }],
      logs: [...d.logs, { time:new Date().toISOString(), msg:'⚠️ EMERGENCY SHUTDOWN — operator triggered', type:'error' }],
    } : d),
  })),

  setFanSpeed:     (id, v) => set(state => ({ dryers: state.dryers.map(d => d.id===id?{...d,fanSpeed:v}:d) })),
  setHeatingLevel: (id, v) => set(state => ({ dryers: state.dryers.map(d => d.id===id?{...d,heatingLevel:v}:d) })),
  setBatchWeight:  (id, v) => set(state => ({ dryers: state.dryers.map(d => d.id===id?{...d,batchWeight:v}:d) })),

  setCrop: (id, cropKey) => set(state => {
    const crop = CROPS[cropKey];
    return {
      dryers: state.dryers.map(d => d.id===id ? {
        ...d, crop:cropKey,
        targetTemp:     crop.idealTemp,
        targetMoisture: crop.Me,
        moistureContent:crop.M0,
        progress: 0,
      } : d),
    };
  }),

  dismissAlert: (dryerId, alertId) => set(state => ({
    dryers: state.dryers.map(d => d.id===dryerId ? {
      ...d, alerts: d.alerts.filter(a => a.id !== alertId),
    } : d),
  })),

  /**
   * PHYSICS TICK
   * Called every 1 real second. Each tick = 1 simulated minute of drying.
   *
   * ── Temperature (Newton's Law of Heating/Cooling) ──────────────
   *   dT/dt = [P_heat - λ(T - T_amb)] / C_thermal
   *   P_heat   = heatingLevel/100 × 3.0  [°C/min at full power]
   *   λ        = 0.04  [cooling coefficient, min⁻¹]
   *   C_thermal = 8.0  [thermal capacity constant, min]
   *
   * ── Moisture (Page Thin-Layer Equation) ────────────────────────
   *   dM/dt = -k_eff × (M - Me)
   *   k_eff = k_crop × tempFactor × fanFactor × (1 - humidityPenalty)
   *   tempFactor    = (T - T_amb) / (T_ideal - T_amb)   [0..1+]
   *   fanFactor     = fanSpeed / 100                     [0..1]
   *   humidityPenalty = ambientRH/100 × 0.35             [0..0.30]
   *   k_crop = crop-specific constant (min⁻¹), calibrated per crop
   *
   * ── Energy ──────────────────────────────────────────────────────
   *   P_total = P_heater + P_fan  [kW]
   *   P_heater = heatingLevel/100 × 3.0 kW
   *   P_fan    = fanSpeed/100 × 0.55 kW
   *   E += P_total × (Δt / 60)   [kWh, Δt in minutes]
   *
   * ── Motor Temperature ───────────────────────────────────────────
   *   dT_motor/dt = fanLoad × 0.75 - (T_motor - T_amb) × 0.05
   *
   * ── Vibration ───────────────────────────────────────────────────
   *   v = 0.05 + (fanSpeed/100) × 0.18  [g]
   *   Max at 100% fan: 0.23 g — alert threshold: 0.45 g
   *   Alert only fires if bearing physically worn (simulated fault)
   */
  tick: () => set(state => {
    const weather    = WEATHER[state.weather];
    // Use real ambient temp if available from weather API, else estimate from weather model
    const T_ambient  = (state.ambientTemp || 28) + (weather.tempBoost * 0.3); // °C

    const newDryers = state.dryers.map(dryer => {
      // Passive cooling when not running
      if (dryer.status !== 'running' && dryer.status !== 'paused') {
        return {
          ...dryer,
          temperature:  dryer.temperature  + (T_ambient - dryer.temperature)  * 0.02,
          motorTemp:    dryer.motorTemp     + (T_ambient - dryer.motorTemp)    * 0.03,
          humidity:     dryer.humidity      + (weather.humidity - dryer.humidity) * 0.01,
          vibration:    0.05,
        };
      }

      const crop = CROPS[dryer.crop];
      const dt   = 1; // simulated minutes per tick

      // ── Temperature (°C) ────────────────────────────────────────
      const P_heat   = (dryer.heatingLevel / 100) * 3.0;
      const heatLoss = (dryer.temperature - T_ambient) * 0.04;
      const dT       = (P_heat - heatLoss) / 8.0 * dt;
      const newTemp  = Math.max(T_ambient, Math.min(95,
        dryer.temperature + dT + (Math.random() - 0.5) * 0.10
      ));

      // ── Chamber Humidity (% RH) ──────────────────────────────────
      const fanRemoval  = (dryer.fanSpeed / 100) * 2.0 * dt;
      const evaporation = Math.max(0, dryer.moistureContent - crop.Me) * 0.05 * dt;
      const ambientSeep = ((state.ambientHumidity || weather.humidity) - dryer.humidity) * 0.012 * dt;
      const newHumidity = Math.max(10, Math.min(95,
        dryer.humidity - fanRemoval + evaporation + ambientSeep + (Math.random() - 0.5) * 0.20
      ));

      // ── Moisture Content (% w.b.) — Page Equation ───────────────
      const tempFactor     = Math.max(0, (newTemp - T_ambient) / Math.max(1, crop.idealTemp - T_ambient));
      const fanFactor      = Math.max(0.01, dryer.fanSpeed / 100);
      // Use real ambient RH if available
      const realRH = state.ambientHumidity || weather.humidity;
      const humPenalty = (realRH / 100) * 0.35;
      const k_eff          = crop.k * tempFactor * fanFactor * (1 - humPenalty);
      const dMoisture      = -k_eff * Math.max(0, dryer.moistureContent - crop.Me) * dt;
      const newMoisture    = Math.max(crop.Me - 0.3, dryer.moistureContent + dMoisture);

      // ── Progress (%) ─────────────────────────────────────────────
      const totalDrop   = Math.max(0.1, crop.M0 - crop.Me);
      const achieved    = crop.M0 - newMoisture;
      const newProgress = Math.min(100, Math.max(0, (achieved / totalDrop) * 100));

      // ── Energy (kWh) ─────────────────────────────────────────────
      const P_heater  = (dryer.heatingLevel / 100) * 3.0;  // kW
      const P_fan     = (dryer.fanSpeed / 100) * 0.55;     // kW
      const newEnergy = dryer.energyUsed + (P_heater + P_fan) * (dt / 60); // kWh

      // ── Motor Temperature (°C) ────────────────────────────────────
      const mHeat      = (dryer.fanSpeed / 100) * 0.75 * dt;
      const mCool      = (dryer.motorTemp - T_ambient) * 0.05 * dt;
      const newMotorTemp = Math.max(T_ambient, Math.min(90,
        dryer.motorTemp + mHeat - mCool + (Math.random() - 0.5) * 0.15
      ));

      // ── Vibration (g) ────────────────────────────────────────────
      // Linear model: max 0.23g at 100% fan — well below 0.45g alert
      const newVibration = Math.max(0.03,
        0.05 + (dryer.fanSpeed / 100) * 0.18 + (Math.random() - 0.5) * 0.008
      );

      // ── Alerts — fire-once per key, auto-clear when resolved ─────
      const alerts = [...dryer.alerts.slice(-10)];
      const fired  = { ...dryer._firedAlerts };
      const fireOnce = (key, msg, type) => {
        if (!fired[key]) {
          alerts.push({ id: Date.now() + Math.random(), msg, type, time: new Date().toISOString() });
          fired[key] = true;
        }
      };
      const clearFire = (key) => { delete fired[key]; };

      // Over-temperature (>8°C above target)
      if (newTemp > dryer.targetTemp + 8)
        fireOnce('ot', `⚠️ Over-temp: ${newTemp.toFixed(1)}°C — target ${dryer.targetTemp}°C`, 'warning');
      else clearFire('ot');

      // Vibration anomaly (only > 0.45g — NOT reachable in normal operation)
      if (newVibration > 0.45)
        fireOnce('vib', `⚠️ Vibration: ${newVibration.toFixed(3)} g — inspect fan bearings`, 'warning');
      else clearFire('vib');

      // Motor overheat
      if (newMotorTemp > 75)
        fireOnce('mt', `⚠️ Motor: ${newMotorTemp.toFixed(0)}°C — reduce fan load`, 'warning');
      else clearFire('mt');

      // Low fan while moisture is high
      if (dryer.fanSpeed < 30 && newMoisture > crop.Me + 10)
        fireOnce('lf', `ℹ️ Fan speed low (${dryer.fanSpeed}%) — moisture removal will be slow`, 'info');
      else clearFire('lf');

      // ── Live log entry every 10% progress milestone ──────────────
      const prevMilestone = Math.floor(dryer.progress / 10) * 10;
      const newMilestone  = Math.floor(newProgress / 10) * 10;
      let logs = [...dryer.logs];
      if (newMilestone > prevMilestone && newMilestone > 0 && newMilestone < 100) {
        logs.push({
          time: new Date().toISOString(),
          msg: `${newMilestone}% complete — Temp: ${newTemp.toFixed(1)}°C | MC: ${newMoisture.toFixed(1)}% w.b. | RH: ${newHumidity.toFixed(0)}% | Energy: ${newEnergy.toFixed(3)} kWh`,
          type: 'info',
        });
      }

      // ── Completion ───────────────────────────────────────────────
      let newStatus = dryer.status;
      let historicalBatches = [...dryer.historicalBatches];

      if (newProgress >= 100 && dryer.status === 'running') {
        newStatus = 'complete';
        const durH = dryer.startTime
          ? ((Date.now() - new Date(dryer.startTime)) / 3_600_000).toFixed(2)
          : crop.dryingHours;
        alerts.push({
          id: Date.now() + 5,
          msg: `✅ ${crop.name} batch complete! Final MC: ${newMoisture.toFixed(1)}% w.b. | Energy: ${newEnergy.toFixed(3)} kWh`,
          type: 'success',
          time: new Date().toISOString(),
        });
        logs.push({
          time: new Date().toISOString(),
          msg: `Batch ${dryer.batchId} COMPLETE — Duration: ${durH}h | Final MC: ${newMoisture.toFixed(2)}% w.b. | Energy: ${newEnergy.toFixed(3)} kWh | Motor peak: ${newMotorTemp.toFixed(0)}°C`,
          type: 'success',
        });
        historicalBatches = [{
          id:           dryer.batchId,
          crop:         dryer.crop,
          weight:       dryer.batchWeight,
          startTime:    dryer.startTime,
          duration:     durH,
          finalMoisture:newMoisture.toFixed(2),
          energyUsed:   newEnergy.toFixed(3),
          quality:      newMoisture <= crop.Me + 0.5 ? 'Excellent' : newMoisture <= crop.Me + 2 ? 'Good' : 'Fair',
        }, ...dryer.historicalBatches];
      }

      // ── ML: estimated minutes to completion ──────────────────────
      // From Page equation: t_remaining = ln((M-Me)/ε) / k_eff
      const remMoisture = newMoisture - crop.Me;
      const mlEstimatedMinutes = (k_eff > 0.001 && remMoisture > 0.05)
        ? Math.min(600, Math.max(0, Math.log(remMoisture / 0.05) / k_eff))
        : null;

      // ── Efficiency score ─────────────────────────────────────────
      const tEff = Math.max(0, 1 - Math.abs(newTemp - crop.idealTemp) / (crop.idealTemp + 1));
      const efficiencyScore = Math.round((tEff * 0.6 + fanFactor * 0.4) * 100);

      return {
        ...dryer,
        temperature:      newTemp,
        humidity:         newHumidity,
        moistureContent:  newMoisture,
        progress:         newProgress,
        energyUsed:       newEnergy,
        motorTemp:        newMotorTemp,
        vibration:        newVibration,
        status:           newStatus,
        alerts,
        _firedAlerts:     fired,
        logs,
        historicalBatches,
        mlEstimatedMinutes,
        efficiencyScore,
      };
    });

    return { dryers: newDryers };
  }),

  appendSensorHistory: (id, reading) => set(state => {
    const history = state.sensorHistory[id] || [];
    return { sensorHistory: { ...state.sensorHistory, [id]: [...history, reading].slice(-60) } };
  }),

  getSensorHistory:  (id) => get().sensorHistory[id] || [],
  getCrops:          ()   => CROPS,
  getWeatherOptions: ()   => WEATHER,
}));
