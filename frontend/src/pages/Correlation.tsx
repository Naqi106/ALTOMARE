import React, { useEffect, useState } from 'react';
import type { Zone } from '../types';
import { getZones, getCorrelation } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import type { RiskLevel, CorrelationEvent } from '../types';
import { Activity, Link2, ShieldAlert, ChevronDown } from 'lucide-react';

export const Correlation: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [correlations, setCorrelations] = useState<CorrelationEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getZones().then(fetchedZones => {
      setZones(fetchedZones);
      if (fetchedZones.length > 0) {
        setSelectedZoneId(fetchedZones[0].zone_id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedZoneId) {
      setLoading(true);
      getCorrelation(selectedZoneId)
        .then(setCorrelations)
        .catch(() => setCorrelations([]))
        .finally(() => setLoading(false));
    }
  }, [selectedZoneId]);

  const zoneNameById = new Map(zones.map(z => [z.zone_id, z.name]));

  const riskCounts = correlations.reduce((acc, c) => {
    acc[c.risk_level] = (acc[c.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full overflow-auto p-5 xl:p-6 custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Correlation Analysis</h1>
          <p className="mt-1 text-sm text-slate-400">Leak-quality correlation events and contamination risk</p>
        </div>
      </div>

      {/* Zone Selector */}
      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="zone-select" className="text-sm font-medium text-slate-400">Select Zone:</label>
        <div className="relative">
          <select
            id="zone-select"
            className="appearance-none rounded-md border border-slate-700 bg-slate-800/80 py-1.5 pl-3 pr-8 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={selectedZoneId}
            onChange={e => setSelectedZoneId(e.target.value)}
          >
            {zones.map(z => (
              <option key={z.zone_id} value={z.zone_id}>{z.name} ({z.zone_id})</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2 h-4 w-4 pointer-events-none text-slate-400" />
        </div>
      </div>

      {/* Risk Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800/60 bg-surface/80 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Activity className="h-3.5 w-3.5" /> Total Events
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-white">{correlations.length}</p>
        </div>
        {(['CRITICAL', 'ALERT', 'WARNING'] as RiskLevel[]).map(level => {
          const colorMap: Record<string, string> = {
            CRITICAL: 'text-status-critical border-status-critical/20 bg-status-critical/[0.04]',
            ALERT: 'text-status-alert border-status-alert/20 bg-status-alert/[0.04]',
            WARNING: 'text-status-warning border-status-warning/20 bg-status-warning/[0.04]',
          };
          return (
            <div key={level} className={`rounded-lg border p-4 ${colorMap[level]}`}>
              <div className={`flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider`}>
                <ShieldAlert className="h-3.5 w-3.5" /> {level}
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{riskCounts[level] || 0}</p>
            </div>
          );
        })}
      </div>

      {/* Correlation Events */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-500">Loading correlation data...</div>
        ) : correlations.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-slate-800/60 bg-surface/80 text-sm text-slate-500">
            No correlation events found for this zone.
          </div>
        ) : (
          correlations.map(corr => (
            <div key={corr.event_id} className="rounded-lg border border-slate-800/60 bg-surface/80 p-5 transition-colors duration-150 hover:bg-[#1b2940]">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Link2 className="h-4 w-4 text-accent" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{zoneNameById.get(corr.zone_id) || corr.zone_id}</h3>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">Event #{corr.event_id} · {corr.zone_id}</p>
                  </div>
                </div>
                <StatusBadge status={corr.risk_level} />
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Leak Alert</p>
                  <p className="mt-1 text-sm font-medium tabular-nums text-slate-200">#{corr.leak_alert_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Quality Reading</p>
                  <p className="mt-1 text-sm font-medium tabular-nums text-slate-200">#{corr.quality_reading_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Contamination</p>
                  <p className={`mt-1 text-sm font-semibold ${corr.leak_caused_contamination ? 'text-status-critical' : 'text-status-safe'}`}>
                    {corr.leak_caused_contamination ? 'Confirmed' : 'Not linked'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Risk Level</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{corr.risk_level}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
