import React from 'react';
import Navbar from './components/Navbar';
import PredictPage from './pages/PredictPage';

export default function App() {
  return (
    <div className="min-h-screen bg-airsense-bg flex flex-col font-sans selection:bg-airsense-emerald selection:text-white">
      {/* Top Header */}
      <Navbar />

      {/* Main Single-Screen Content: Predict AQI spanning full width */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-6">
        <PredictPage />
      </main>
    </div>
  );
}
