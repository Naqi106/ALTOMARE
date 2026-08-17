import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor?: string;
  icon?: LucideIcon;
  emphasis?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  accentColor = 'border-slate-700',
  icon: Icon,
  emphasis = false,
}) => {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : ArrowRight;

  return (
    <div
      className={`group relative h-32 overflow-hidden rounded-lg border bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-500/80 hover:bg-[#233149] ${accentColor} ${
        emphasis ? 'ring-1 ring-emerald-400/20' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition group-hover:text-white">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div className="text-[32px] font-black leading-none tracking-normal text-white">{value}</div>
        {trend && (
          <div className={`flex items-center gap-1 rounded-md border border-white/10 bg-black/15 px-2 py-1 text-xs font-bold ${
            trend === 'up' ? 'text-status-safe' :
            trend === 'down' ? 'text-status-critical' : 'text-slate-400'
          }`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
};
