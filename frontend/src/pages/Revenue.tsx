import React from 'react';
import { useRevenueSummary } from '../services/dashboardData';
import {
  CircleDollarSign,
  ArrowUpRight,
  Banknote,
} from 'lucide-react';

export const Revenue: React.FC = () => {
  const { data, loading, error } = useRevenueSummary();

  const byZoneEntries = data ? Object.entries(data.by_zone) : [];
  const maxAmount = byZoneEntries.length > 0
    ? Math.max(...byZoneEntries.map(([, amount]) => amount as number))
    : 1;

  return (
    <div className="h-full overflow-auto p-5 xl:p-6 custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Revenue Recovery</h1>
          <p className="mt-1 text-sm text-slate-400">Revenue recovered through leak detection and NRW reduction</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">Loading revenue data...</div>
      ) : error ? (
        <div className="flex h-48 items-center justify-center text-sm text-status-alert">Failed to load revenue data.</div>
      ) : !data ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">Revenue data unavailable</div>
      ) : (
        <>
          {/* Hero KPI */}
          <div className="mb-6 rounded-lg border border-status-safe/20 bg-status-safe/[0.04] p-6 ring-1 ring-emerald-400/10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-status-safe">
                  <Banknote className="h-4 w-4" /> Total Revenue Recovered
                </div>
                <p className="text-4xl font-bold tracking-tight text-white">
                  ₹{data.total_recovered.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-slate-400">Cumulative recovery from leak interventions</p>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-sm font-semibold text-status-safe">
                <ArrowUpRight className="h-4 w-4" />
                +8.4%
              </div>
            </div>
          </div>

          {/* By Zone Breakdown */}
          <div className="rounded-lg border border-slate-800/60 bg-surface/80 p-5">
            <div className="mb-5 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-white">Recovery by Zone</h2>
              <span className="ml-auto text-[11px] font-medium text-slate-500">{byZoneEntries.length} zones</span>
            </div>

            <div className="space-y-3">
              {byZoneEntries.map(([zoneId, amount]) => {
                const pct = ((amount as number) / data.total_recovered * 100).toFixed(1);
                const barWidth = ((amount as number) / maxAmount * 100).toFixed(1);

                return (
                  <div key={zoneId} className="rounded-md border border-slate-800/40 bg-[#111a2b]/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200 capitalize">{zoneId.replace('_', ' ')}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-medium text-slate-500">{pct}%</span>
                        <span className="text-sm font-semibold tabular-nums text-white">₹{(amount as number).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-status-safe/80 to-status-safe transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary row */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/40 pt-4">
              <span className="text-sm font-medium text-slate-400">Total</span>
              <span className="text-lg font-bold tabular-nums text-status-safe">₹{data.total_recovered.toLocaleString()}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
