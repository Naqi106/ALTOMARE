import React, { useEffect, useMemo, useState } from 'react';
import type { LeakAlert, Zone } from '../types';
import { getZones } from '../services/api';
import { useNRWTrend, useRevenueSummary } from '../services/dashboardData';
import { getZoneStatus } from '../utils/status';
import {
  TrendingDown,
  AlertTriangle,
  CircleDollarSign,
  Shield,
  Calendar,
} from 'lucide-react';

interface ReportsPageProps {
  alerts: LeakAlert[];
}

export const Reports: React.FC<ReportsPageProps> = ({ alerts }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const { data: nrwData } = useNRWTrend();
  const { data: revenueData } = useRevenueSummary();

  useEffect(() => {
    getZones().then(setZones).catch(() => {});
  }, []);

  const activeAlerts = useMemo(() => alerts.filter(a => a.status === 'active'), [alerts]);
  const totalLoss = activeAlerts.reduce((sum, a) => sum + a.estimated_loss_litres, 0);
  const avgConfidence = activeAlerts.length > 0
    ? activeAlerts.reduce((sum, a) => sum + a.confidence_score, 0) / activeAlerts.length
    : 0;

  const zoneRisks = useMemo(() => {
    return zones.map(z => ({
      zone: z,
      status: getZoneStatus(z, alerts, []),
      alertCount: alerts.filter(a => a.zone_id === z.zone_id && a.status === 'active').length,
    })).sort((a, b) => {
      const order = { CRITICAL: 0, ALERT: 1, WARNING: 2, SAFE: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    });
  }, [zones, alerts]);

  const latestNRW = nrwData?.[nrwData.length - 1]?.value;
  const nrwChange = nrwData && nrwData.length >= 2
    ? (nrwData[nrwData.length - 1].value - nrwData[0].value).toFixed(1)
    : null;

  const now = new Date();
  const reportDate = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(now);

  return (
    <div className="h-full overflow-auto p-5 xl:p-6 custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Operations Report</h1>
          <p className="mt-1 text-sm text-slate-400">Summary snapshot of NRW, alerts, revenue, and zone risk</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          Generated {reportDate}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* NRW Snapshot */}
        <section className="rounded-lg border border-slate-800/60 bg-surface/80 p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-white">NRW Snapshot</h2>
            <span className="ml-auto rounded border border-slate-600/50 bg-slate-800/50 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-slate-400">DEMO</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Current NRW</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-white">{latestNRW ?? '--'}%</p>
            </div>
            <div className="rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Period Change</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${nrwChange && parseFloat(nrwChange) < 0 ? 'text-status-safe' : 'text-status-alert'}`}>
                {nrwChange ? `${nrwChange}%` : '--'}
              </p>
            </div>
            <div className="col-span-2 rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Data Points</p>
              <p className="mt-1 text-sm text-slate-300">{nrwData?.length ?? 0} readings over {nrwData?.length ?? 0} days</p>
            </div>
          </div>
        </section>

        {/* Alert Summary */}
        <section className="rounded-lg border border-slate-800/60 bg-surface/80 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-alert" />
            <h2 className="text-sm font-semibold text-white">Alert Summary</h2>
            <span className="ml-auto flex items-center gap-1.5 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-accent">LIVE</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Active</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-status-alert">{activeAlerts.length}</p>
            </div>
            <div className="rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Est. Loss</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-white">{(totalLoss / 1000).toFixed(0)}k L</p>
            </div>
            <div className="rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Avg Conf.</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-white">{Math.round(avgConfidence * 100)}%</p>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">Detection Methods</p>
            <div className="flex flex-wrap gap-2">
              {[...new Set(activeAlerts.map(a => a.method))].map(method => (
                <span key={method} className="rounded border border-slate-700/50 bg-slate-800/50 px-2 py-0.5 text-[11px] font-medium text-slate-300 capitalize">{method.replace('_', ' ')}</span>
              ))}
              {activeAlerts.length === 0 && <span className="text-[11px] text-slate-500">No active alerts</span>}
            </div>
          </div>
        </section>

        {/* Revenue Snapshot */}
        <section className="rounded-lg border border-slate-800/60 bg-surface/80 p-5">
          <div className="mb-4 flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-status-safe" />
            <h2 className="text-sm font-semibold text-white">Revenue Snapshot</h2>
            <span className="ml-auto rounded border border-slate-600/50 bg-slate-800/50 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-slate-400">DEMO</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Total Recovered</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-status-safe">
                {revenueData ? `₹${revenueData.total_recovered.toLocaleString()}` : '--'}
              </p>
            </div>
            <div className="rounded-md border border-slate-700/50 bg-[#111a2b]/60 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Active Zones</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-white">
                {revenueData ? Object.keys(revenueData.by_zone).length : '--'}
              </p>
            </div>
          </div>
          {revenueData && (
            <div className="mt-4 space-y-2">
              {Object.entries(revenueData.by_zone).map(([zoneId, amount]) => (
                <div key={zoneId} className="flex items-center justify-between rounded-md border border-slate-800/40 bg-[#111a2b]/40 px-3 py-2">
                  <span className="text-[11px] font-medium text-slate-400 capitalize">{zoneId.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold tabular-nums text-slate-200">₹{(amount as number).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Zone Risk Summary */}
        <section className="rounded-lg border border-slate-800/60 bg-surface/80 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-white">Zone Risk Summary</h2>
          </div>
          {zoneRisks.length === 0 ? (
            <p className="text-sm text-slate-500">Loading zones...</p>
          ) : (
            <div className="space-y-2">
              {zoneRisks.map(({ zone, status, alertCount }) => {
                const statusColorMap: Record<string, string> = {
                  CRITICAL: 'text-status-critical',
                  ALERT: 'text-status-alert',
                  WARNING: 'text-status-warning',
                  SAFE: 'text-status-safe',
                };
                return (
                  <div key={zone.zone_id} className="flex items-center justify-between rounded-md border border-slate-800/40 bg-[#111a2b]/40 px-3 py-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-200">{zone.name}</span>
                      <span className="ml-2 text-[10px] text-slate-500">{zone.zone_id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {alertCount > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">{alertCount} alert{alertCount > 1 ? 's' : ''}</span>
                      )}
                      <span className={`text-[11px] font-semibold uppercase ${statusColorMap[status] || 'text-slate-400'}`}>{status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
