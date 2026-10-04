import React from 'react';

const GaugeScore = ({ score = 85, size = 160, strokeWidth = 14, label = "Hybrid Score" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = "#10B981"; // Emerald
  let badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  let statusText = "Highly Eligible";

  if (score < 50) {
    strokeColor = "#EF4444"; // Red
    badgeColor = "text-rose-700 bg-rose-50 border-rose-200";
    statusText = "Not Eligible";
  } else if (score < 75) {
    strokeColor = "#F59E0B"; // Amber
    badgeColor = "text-amber-700 bg-amber-50 border-amber-200";
    statusText = "Conditionally Eligible";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{score}</span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">/ 100</span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
          {statusText}
        </span>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
};

export default GaugeScore;
