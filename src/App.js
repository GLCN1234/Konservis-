import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar, { BottomNav } from './components/Sidebar';
import Overview from './pages/Overview';
import Control from './pages/Control';
import Analytics from './pages/Analytics';
import MLInsights from './pages/MLInsights';
import Maintenance from './pages/Maintenance';
import Weather from './pages/Weather';
import Logs from './pages/Logs';
import { useDryerStore } from './store/dryerStore';
import { useSimulation } from './hooks/useSimulation';
import './index.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function AppInner() {
  useSimulation();
  const { dryers, activeDryer, setActiveDryer } = useDryerStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 64 : 220);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex' }}>
      {/* Desktop sidebar only */}
      {!isMobile && (
        <Sidebar
          dryers={dryers}
          activeDryer={activeDryer}
          setActiveDryer={setActiveDryer}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}

      <main style={{
        marginLeft: sidebarWidth,
        flex: 1,
        minHeight: '100vh',
        paddingBottom: isMobile ? 68 : 0,
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflowX: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          backgroundImage:'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize:'40px 40px',
        }} />

        {/* Mobile header */}
        {isMobile && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: 'rgba(8,13,26,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:28, height:28, borderRadius:7,
                background:'linear-gradient(135deg,#38bdf8,#0ea5e9)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
              }}>🌾</div>
              <div>
                <div style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:13, color:'#f0f6ff', letterSpacing:1 }}>KONSERVIS</div>
                <div style={{ fontSize:8, color:'#38bdf8', letterSpacing:2, fontFamily:"'Space Mono'" }}>DIGITAL TWIN</div>
              </div>
            </div>
            {/* Dryer status pills */}
            <div style={{ display:'flex', gap:6 }}>
              {dryers.filter(d => d.status === 'running').length > 0 && (
                <div style={{ padding:'3px 8px', borderRadius:20, background:'rgba(74,222,128,0.15)',
                  border:'1px solid rgba(74,222,128,0.3)', fontSize:10, color:'#4ade80', fontFamily:"'Space Mono'" }}>
                  {dryers.filter(d => d.status === 'running').length} ACTIVE
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ position:'relative', zIndex:1 }}>
          <Routes>
            <Route path="/"             element={<Overview />} />
            <Route path="/control"      element={<Control />} />
            <Route path="/analytics"    element={<Analytics />} />
            <Route path="/ml"           element={<MLInsights />} />
            <Route path="/maintenance"  element={<Maintenance />} />
            <Route path="/weather"      element={<Weather />} />
            <Route path="/logs"         element={<Logs />} />
          </Routes>
        </div>
      </main>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav />}

      <Toaster
        position={isMobile ? 'top-center' : 'bottom-right'}
        toastOptions={{
          style: {
            background:'#111d33', color:'#f0f6ff',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:12, fontFamily:"'DM Sans'", fontSize:13,
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppInner />
    </BrowserRouter>
  );
}
