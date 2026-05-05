# 🌾 Konservis Digital Twin
### The Operating System for Post-Harvest Processing in Africa

A full-featured digital twin dashboard for the Konservis Hybrid Electric Farm Dryer — built for real-time monitoring, ML-based crop optimization, remote control, and predictive maintenance.

---

## 🚀 Quick Start (GitHub Codespaces / Terminal)

```bash
# 1. Unzip the project
unzip konservis-digital-twin.zip
cd konservis-twin

# 2. Run setup (installs deps + starts app)
bash setup.sh

# OR manually:
npm install
npm start
```

App runs at **http://localhost:3000**

---

## 🔧 Requirements

- Node.js 18+ (`node -v`)
- npm 8+ (`npm -v`)

---

## 📦 Features

| Module | Description |
|--------|-------------|
| **Mission Control** | Live 3D animated dryer, fleet overview, real-time sensor charts |
| **Remote Control** | Start/stop/pause/emergency shutdown, fan speed, heating level |
| **Analytics** | Historical batch data, moisture trends, energy vs duration, crop distribution |
| **AI Insights** | ML-powered crop recipes, risk assessment, weather intelligence, optimization |
| **Maintenance** | Predictive fault detection, vibration/heat anomalies, maintenance log |
| **Weather** | 7-day forecast, energy optimization windows, drying windows |
| **Logs** | Full audit trail, filterable event log |

---

## 🌾 Supported Crops

- 🌽 Maize (55°C, 8h)
- 🥔 Cassava (60°C, 10h)  
- 🌶️ Pepper (65°C, 6h)
- 🍫 Cocoa (50°C, 12h)
- 🌾 Rice (45°C, 7h)
- 🥜 Groundnut (40°C, 9h)

---

## 🏗️ Architecture

```
src/
├── store/dryerStore.js    # Zustand global state + simulation engine
├── hooks/useSimulation.js # 1-second physics tick
├── components/
│   ├── Dryer3D.jsx        # Animated isometric SVG dryer
│   ├── Sidebar.jsx        # Navigation
│   ├── MetricCard.jsx     # Sensor display cards
│   └── AlertBanner.jsx    # Alert system
└── pages/
    ├── Overview.jsx       # Dashboard
    ├── Control.jsx        # Remote control
    ├── Analytics.jsx      # Charts & history
    ├── MLInsights.jsx     # AI recommendations
    ├── Maintenance.jsx    # Predictive maintenance
    ├── Weather.jsx        # Weather intelligence
    └── Logs.jsx           # Event logs
```

---

## 🔌 Physical Integration

When physical dryers are ready, replace the simulation tick in `useSimulation.js` with real sensor API calls:

```js
// Replace tick() with real sensor polling:
const data = await fetch('http://your-dryer-api/sensors');
updateDryer(id, await data.json());
```

---

Built by **Konservis** · Dr. Oyebanji Project Team · 2026
