import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LeakAlert, Zone } from '../types';
import { getZones } from '../services/api';
import {
  AlertTriangle,
  Bell,
  Droplets,
  Search,
  ShieldAlert,
} from 'lucide-react';

interface AlertsPageProps {
  alerts: LeakAlert[];
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
}

export const Alerts: React.FC<AlertsPageProps> = ({ alerts, loading, error, lastUpdated }) => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getZones().then(setZones).catch(() => {});
  }, []);

  const zoneNameById = useMemo(() => new Map(zones.map(z => [z.zone_id, z.name])), [zones]);

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (filter === 'active') result = result.filter(a => a.status === 'active');
    if (filter === 'resolved') result = result.filter(a => a.status === 'resolved');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        (zoneNameById.get(a.zone_id) || '').toLowerCase().includes(q) ||
        a.zone_id.toLowerCase().includes(q) ||
        a.method.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [alerts, filter, searchQuery, zoneNameById]);

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const totalLoss = alerts
    .filter(a => a.status === 'active')
    .reduce((sum, a) => sum + a.estimated_loss_litres, 0);

  const formatTimestamp = (ts: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(ts));
  };

  return (
    <div className="h-full overflow-auto p-5 xl:p-6 custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Alert Management</h1>
          <p className="mt-1 text-sm text-slate-400">Monitor and review leak detection alerts across all zones</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            LIVE
          </span>
          {lastUpdated && (
            <span className="text-[11px] font-medium text-slate-500">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800/60 bg-surface/80 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Bell className="h-3.5 w-3.5" /> Total Alerts
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{alerts.length}</p>
        </div>
        <div className="rounded-lg border border-status-alert/20 bg-status-alert/[0.04] p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-status-alert">
            <AlertTriangle className="h-3.5 w-3.5" /> Active
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-status-alert">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-status-safe/20 bg-status-safe/[0.04] p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-status-safe">
            <ShieldAlert className="h-3.5 w-3.5" /> Resolved
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-status-safe">{resolvedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-800/60 bg-surface/80 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Droplets className="h-3.5 w-3.5" /> Est. Active Loss
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{(totalLoss / 1000).toFixed(0)}k L</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-800/60 bg-[#111a2b]/60 p-0.5">
          {(['all', 'active', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-all duration-200 ${
                filter === f
                  ? 'bg-accent/10 text-accent'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search zones, methods..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800/60 bg-[#111a2b]/60 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-accent/40"
          />
        </div>
        <span className="text-[11px] font-medium text-slate-500">{filteredAlerts.length} results</span>
      </div>

      {/* Alert Table */}
      {loading && alerts.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">Loading alerts...</div>
      ) : error && alerts.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <p className="text-sm font-medium text-status-critical">Failed to load alerts</p>
          <p className="text-xs text-slate-500">Could not connect to the alerts service.</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">No alerts matching current filters</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-800/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 bg-[#111a2b]/80">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Alert ID</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Zone</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Est. Loss</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Confidence</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Method</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Timestamp</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map(alert => {
                const confidencePercent = Math.round(alert.confidence_score * 100);

                return (
                  <tr
                    key={alert.alert_id}
                    className="border-b border-slate-800/40 bg-surface/40 transition-colors duration-150 hover:bg-[#1b2940] cursor-pointer"
                    onClick={() => navigate('/dashboard')}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">#{alert.alert_id}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-100">
                        {zoneNameById.get(alert.zone_id) || alert.zone_id}
                      </div>
                      <div className="text-[10px] text-slate-500">{alert.zone_id}</div>
                    </td>
                    <td className={`px-4 py-3 font-semibold tabular-nums ${alert.estimated_loss_litres >= 100000 ? 'text-status-critical' : 'text-status-alert'}`}>
                      {(alert.estimated_loss_litres / 1000).toFixed(1)}k L
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
                          <span className="block h-full rounded-full bg-accent" style={{ width: `${confidencePercent}%` }} />
                        </span>
                        <span className="text-xs font-medium tabular-nums text-slate-300">{confidencePercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-300 capitalize">{alert.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatTimestamp(alert.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        alert.status === 'active'
                          ? 'bg-status-alert/10 text-status-alert border border-status-alert/20'
                          : 'bg-status-safe/10 text-status-safe border border-status-safe/20'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
