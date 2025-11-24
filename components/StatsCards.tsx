import React from "react";

type Stat = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

interface StatsCardsProps {
  stats: Stat[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats || stats.length === 0) {
    return <p className="text-sm text-neutral-600">No stats available.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div className="stat-label">{stat.label}</div>
            {stat.icon && (
              <div className="w-10 h-10 bg-black flex items-center justify-center flex-shrink-0">
                {stat.icon}
              </div>
            )}
          </div>
          <div className="stat-value">{stat.value}</div>
          {stat.trend && (
            <div className={`text-xs font-medium mt-2 ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
