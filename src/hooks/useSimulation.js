import { useEffect } from 'react';
import { useDryerStore } from '../store/dryerStore';

export function useSimulation() {
  const { tick, dryers, appendSensorHistory } = useDryerStore();

  useEffect(() => {
    const interval = setInterval(() => {
      tick();
      // Append sensor readings for running dryers
      dryers.forEach(dryer => {
        if (dryer.status === 'running') {
          appendSensorHistory(dryer.id, {
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temperature: dryer.temperature,
            humidity: dryer.humidity,
            moisture: dryer.moistureContent,
            fanSpeed: dryer.fanSpeed,
            progress: dryer.progress,
          });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tick, dryers, appendSensorHistory]);
}
