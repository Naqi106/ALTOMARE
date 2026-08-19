import React from 'react';
import { Banknote } from 'lucide-react';
import { useRevenueSummary } from '../services/dashboardData';

export const RevenueCard: React.FC = () => {
  const { data, loading } = useRevenueSummary();

  return (
    <div className="col-span-2 group relative overflow-hidden rounded-lg border bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-500/80 hover:bg-[#233149] border-l-4 border-l-status-safe border-slate-700 ring-1 ring-emerald-400/20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Revenue Recovered</h3>
            <p className="mt-1 text-xs text-slate-500">Core PS Success Metric</p>
          </div>
          <span className="flex items-center gap-1.5 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent"></span>
            </span>
            LIVE
          </span>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-status-safe transition group-hover:text-emerald-400">
          <Banknote className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          {loading ? (
            <div className="h-10 w-40 animate-pulse rounded bg-slate-800" />
          ) : data && data.total_recovered != null ? (
            <div className="text-[40px] font-black leading-none tracking-tight text-white">
              ₹{Number(data.total_recovered).toLocaleString()}
            </div>
          ) : (
            <div className="text-xl font-bold text-slate-500">Unavailable</div>
          )}
        </div>
      </div>

      {!loading && data && data.by_zone && Object.keys(data.by_zone).length > 0 && (
        <div className="mt-6 border-t border-white/5 pt-4">
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Top Zone Breakdown</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(data.by_zone).map(([zoneId, amount]) => (
              <div key={zoneId} className="rounded border border-slate-800/50 bg-black/10 p-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{zoneId.replace('_', ' ')}</p>
                <p className="mt-1 text-sm font-black text-slate-200">₹{(amount as number).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
