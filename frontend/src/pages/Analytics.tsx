import React from 'react';
import { NRWTrendChart } from '../components/NRWTrendChart';
import { QualityTrendChart } from '../components/QualityTrendChart';
import { RevenueCard } from '../components/RevenueCard';
import { useNRWTrend, useQualityTrend, useRevenueSummary } from '../services/dashboardData';
import { BarChart3, TrendingDown, Droplets, CircleDollarSign } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { data: nrwData } = useNRWTrend();
  const { data: qualityData } = useQualityTrend();
  const { data: revenueData } = useRevenueSummary();

  const latestNRW = nrwData?.[nrwData.length - 1]?.value ?? '--';
  const latestTurbidity = qualityData?.[qualityData.length - 1]?.turbidity ?? '--';

  return (
    <div className="h-full overflow-auto p-5 xl:p-6 custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">NRW trends, water quality metrics, and revenue analytics</p>
        </div>
        <span className="rounded-md border border-slate-600/50 bg-slate-800/50 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-slate-400">DEMO DATA</span>
      </div>

      {/* Summary KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800/60 bg-surface/80 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <TrendingDown className="h-3.5 w-3.5" /> Current NRW
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{latestNRW}%</p>
          <p className="mt-1 text-[11px] text-slate-500">Network water loss</p>
        </div>
        <div className="rounded-lg border border-slate-800/60 bg-surface/80 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Droplets className="h-3.5 w-3.5" /> Turbidity
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{latestTurbidity} NTU</p>
          <p className="mt-1 text-[11px] text-slate-500">Latest reading</p>
        </div>
        <div className="rounded-lg border border-slate-800/60 bg-surface/80 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <CircleDollarSign className="h-3.5 w-3.5" /> Revenue Recovered
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">
            {revenueData ? `₹${revenueData.total_recovered.toLocaleString()}` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Live revenue summary</p>
        </div>
        <div className="rounded-lg border border-slate-800/60 bg-surface/80 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <BarChart3 className="h-3.5 w-3.5" /> Data Points
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{(nrwData?.length ?? 0) + (qualityData?.length ?? 0)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Across trend datasets</p>
        </div>
      </div>

      {/* Charts — Full width */}
      <div className="space-y-6">
        <div className="h-[300px]">
          <NRWTrendChart />
        </div>
        <div className="h-[300px]">
          <QualityTrendChart />
        </div>
        <RevenueCard />
      </div>
    </div>
  );
};
