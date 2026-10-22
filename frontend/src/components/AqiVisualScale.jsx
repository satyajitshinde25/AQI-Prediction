import React from 'react';
import { AQI_CATEGORIES, getAqiCategory } from '../utils/constants';

export default function AqiVisualScale({ aqi }) {
  const currentVal = Math.max(0, Math.min(500, Number(aqi) || 0));
  const currentCategory = getAqiCategory(currentVal);
  // Calculate percentage along 0 - 500 scale
  const percentage = Math.min(100, Math.max(2, (currentVal / 500) * 100));

  return (
    <div className="w-full space-y-2 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs text-airsense-muted font-medium">
        <span>0 (Clean)</span>
        <span className="font-semibold text-airsense-charcoal">
          Indicator: <span style={{ color: currentCategory.color }}>{currentVal} AQI ({currentCategory.category})</span>
        </span>
        <span>500+ (Hazardous)</span>
      </div>

      {/* Segmented Gradient Bar */}
      <div className="relative">
        <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner bg-airsense-border">
          {AQI_CATEGORIES.map((cat, i) => (
            <div
              key={cat.category}
              className="h-full transition-all duration-300 relative group"
              style={{
                backgroundColor: cat.color,
                width: i === 0 ? "10%" : i === 1 ? "10%" : i === 2 ? "20%" : i === 3 ? "20%" : i === 4 ? "20%" : "20%"
              }}
              title={`${cat.category} (${cat.range})`}
            />
          ))}
        </div>

        {/* Marker pointer */}
        <div
          className="absolute -top-1.5 transition-all duration-700 ease-out flex flex-col items-center"
          style={{ left: `calc(${percentage}% - 8px)` }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
            style={{ backgroundColor: currentCategory.color }}
          />
          <div
            className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px]"
            style={{ borderTopColor: currentCategory.color }}
          />
        </div>
      </div>

      {/* Category Labels below scale */}
      <div className="grid grid-cols-6 gap-1 pt-1 text-center text-[10px] sm:text-[11px] font-medium text-airsense-muted">
        {AQI_CATEGORIES.map((cat) => (
          <div
            key={cat.category}
            className={`truncate px-0.5 rounded py-0.5 transition-colors ${
              cat.category === currentCategory.category
                ? 'font-bold bg-white text-airsense-dark shadow-xs border border-airsense-border'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            {cat.category}
          </div>
        ))}
      </div>
    </div>
  );
}
