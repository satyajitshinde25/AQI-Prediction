import React, { useState, useEffect } from 'react';
import { Wind, Activity, AlertTriangle } from 'lucide-react';
import { checkBackendHealth, API_BASE_URL } from '../services/api';

export default function Navbar() {
  const [apiOnline, setApiOnline] = useState(null); // null = checking, true = online, false = offline
  const [currentDateStr, setCurrentDateStr] = useState('');

  // Update current date string
  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    setCurrentDateStr(now.toLocaleDateString('en-IN', options));
  }, []);

  // Poll API health
  useEffect(() => {
    let isMounted = true;
    async function verifyHealth() {
      const result = await checkBackendHealth();
      if (isMounted) {
        setApiOnline(result.online);
      }
    }
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-airsense-border shadow-xs">
      <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-airsense-primary text-white flex items-center justify-center shadow-xs">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-airsense-dark flex items-center gap-1.5">
              AirSense
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-airsense-cardMuted text-airsense-primary border border-airsense-border">
                Prediction System
              </span>
            </div>
            <p className="text-[11px] text-airsense-muted hidden sm:block -mt-0.5 font-medium">
              Machine Learning Air Quality Index Forecasting
            </p>
          </div>
        </div>

        {/* Right side: Date & Backend Status */}
        <div className="flex items-center gap-3">
          {/* Current Date Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-airsense-muted bg-airsense-bg px-3 py-1.5 rounded-lg border border-airsense-border font-medium">
            <Activity className="w-3.5 h-3.5 text-airsense-primary" />
            <span>{currentDateStr}</span>
          </div>

          {/* Backend Status Indicator */}
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
              apiOnline === true
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : apiOnline === false
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-airsense-bg text-airsense-muted border-airsense-border'
            }`}
            title={apiOnline ? `FastAPI connected at ${API_BASE_URL}` : `Backend offline at ${API_BASE_URL}`}
          >
            {apiOnline === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>FastAPI Active</span>
              </>
            ) : apiOnline === false ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Backend Offline</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                <span>Checking API...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
