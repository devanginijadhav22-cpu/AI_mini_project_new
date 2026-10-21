import React from 'react';

const GaugeScore = ({ score = 85, size = 150, strokeWidth = 10, label = "Eligibility Score" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = "#18181b"; // Deep charcoal
  let badgeClass = "text-zinc-800 bg-zinc-100 border-zinc-200";
  let statusText = "Highly Eligible";

  if (score < 50) {
    strokeColor = "#71717a"; // Muted zinc
    badgeClass = "text-zinc-600 bg-zinc-100 border-zinc-200";
    statusText = "Not Eligible";
  } else if (score < 75) {
    strokeColor = "#2563eb"; // Blue accent
    badgeClass = "text-blue-800 bg-blue-50 border-blue-200";
    statusText = "Conditionally Eligible";
  } else {
    strokeColor = "#0f172a";
    badgeClass = "text-zinc-900 bg-zinc-100 border-zinc-300";
    statusText = "Highly Eligible";
  }

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f4f4f5"
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
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-semibold text-zinc-950 tracking-tight">{score}</span>
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
          {statusText}
        </span>
        <p className="text-xs text-zinc-500 mt-1 font-normal">{label}</p>
      </div>
    </div>
  );
};

export default GaugeScore;
