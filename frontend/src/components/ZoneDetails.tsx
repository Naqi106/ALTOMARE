import React from 'react';
import type { Zone, LeakAlert, CorrelationEvent } from '../types';
import { StatusBadge } from './StatusBadge';
import { getZoneStatus } from '../utils/status';
import { Activity, Gauge, MapPinned, ShieldAlert, Users } from 'lucide-react';

interface ZoneDetailsProps {
  zone: Zone | null;
  alerts: LeakAlert[];
  correlations: CorrelationEvent[];
}

const InfoTile: React.FC<{ label: string; value: string | number; icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-slate-700/70 bg-[#111a2b]/70 p-3">
    <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <p className="text-sm font-black text-slate-100">{value}</p>
  </div>
);

export const ZoneDetails: React.FC<ZoneDetailsProps> = ({ zone, alerts, correlations }) => {
  if (!zone) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-slate-800 bg-surface/80 p-6 text-center text-sm font-medium text-slate-500">
        Select a zone on the map to view details
      </div>
    );
  }

  const status = getZoneStatus(zone, alerts, correlations);
  const zoneAlerts = alerts.filter(a => a.zone_id === zone.zone_id && a.status === 'active');
  const zoneCorrelations = correlations.filter(c => c.zone_id === zone.zone_id);
  const primaryAlert = zoneAlerts[0];

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-slate-800 bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-200 custom-scrollbar">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            <MapPinned className="h-3.5 w-3.5 text-accent" />
            Investigation Zone
          </p>
          <h3 className="truncate text-xl font-black text-white">{zone.name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Zone ID: {zone.zone_id}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <InfoTile label="Population" value={zone.population.toLocaleString()} icon={Users} />
        <InfoTile label="Pipe Age" value={`${zone.pipe_age_years} years`} icon={Gauge} />
        <InfoTile label="Data Level" value={`Level ${zone.data_level}`} icon={Activity} />
        <InfoTile label="Status" value={status} icon={ShieldAlert} />
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-slate-700/70 bg-[#111a2b]/70 p-4">
          <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-300">Leak Signal</h4>
          {primaryAlert ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Estimated Loss</p>
                  <p className="mt-1 text-2xl font-black text-status-alert">{primaryAlert.estimated_loss_litres.toLocaleString()} L</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Confidence</p>
                  <p className="mt-1 text-lg font-black text-white">{Math.round(primaryAlert.confidence_score * 100)}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">Detection Method</span>
                <span className="font-bold text-slate-200">{primaryAlert.method}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No active leak alert for this zone.</p>
          )}
        </div>

        {zoneCorrelations.length > 0 && (
          <div className="rounded-lg border border-accent/20 bg-accent/[0.04] p-4">
            <h4 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-200">Correlation Insight</h4>
            <div className="space-y-3">
              {zoneCorrelations.map(corr => (
                <div key={corr.event_id} className="rounded-md border border-white/10 bg-black/10 p-3 text-sm">
                  <p className={corr.leak_caused_contamination ? 'font-bold text-status-critical' : 'font-semibold text-slate-200'}>
                    {corr.leak_caused_contamination ? 'Leak signal is linked to water-quality risk.' : 'Quality anomaly is not directly linked to leak signal.'}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Risk: {corr.risk_level}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
