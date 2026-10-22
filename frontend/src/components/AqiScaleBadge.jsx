import React from 'react';
import { getAqiCategory } from '../utils/constants';

export default function AqiScaleBadge({ aqi, categoryName, size = 'md' }) {
  const cat = aqi !== undefined ? getAqiCategory(aqi) : null;
  const label = categoryName || cat?.category || "Unknown";
  const color = cat?.color || "#5A6B61";
  const bg = cat?.bgLight || "#F4F6F4";
  const border = cat?.border || "#DCE3DC";
  const text = cat?.textDark || "#0F1F17";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium gap-1.5",
    md: "px-3 py-1 text-xs sm:text-sm font-semibold gap-2",
    lg: "px-4 py-1.5 text-sm sm:text-base font-bold gap-2.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-all ${sizeClasses[size] || sizeClasses.md}`}
      style={{ backgroundColor: bg, borderColor: border, color: text }}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
      {cat?.range && (
        <span className="opacity-70 text-[11px] font-normal hidden sm:inline">
          ({cat.range})
        </span>
      )}
    </span>
  );
}
