import React from 'react';

const MetricCard = ({ title, value, subtitle, icon: Icon, trend }) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-5">
      <div className={Icon ? "flex items-start justify-between" : ""}>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{title}</p>
          <h3 className="text-2xl font-semibold text-zinc-950 mt-1 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5">
              {trend && <span className="font-medium text-zinc-900">{trend}</span>}
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-700 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-zinc-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
