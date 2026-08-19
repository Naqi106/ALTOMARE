import { useMemo } from 'react';
import { AlertCard } from './AlertCard';
import type { Zone, LeakAlert } from '../types';

interface LiveAlertFeedProps {
  zones: Zone[];
  alerts: LeakAlert[];
  loading: boolean;
  error: boolean;
  lastUpdated: Date | null;
  onAlertClick: (zone: Zone) => void;
}

export const LiveAlertFeed: React.FC<LiveAlertFeedProps> = ({ 
  zones, 
  alerts,
  loading,
  error,
  lastUpdated,
  onAlertClick 
}) => {

  const zoneNameById = useMemo(() => {
    return new Map(zones.map(zone => [zone.zone_id, zone.name]));
  }, [zones]);

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">Live Alerts</h3>
          <span className="flex items-center gap-1.5 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent"></span>
            </span>
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <span className="rounded border border-status-alert/30 bg-status-alert/10 px-2 py-1 text-[11px] font-black text-status-alert">
            {activeAlertsCount} Active
          </span>
        </div>
      </div>
      
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar relative">
        {loading && alerts.length === 0 ? (
          <div className="mt-10 text-center text-sm font-medium text-slate-500">Loading live alerts...</div>
        ) : error && alerts.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-sm font-semibold text-status-critical">Failed to load alerts</p>
            <p className="mt-1 text-xs text-slate-500">Could not connect to the alerts service.</p>
          </div>
        ) : alerts.length > 0 ? (
          alerts.map(alert => (
            <div key={alert.alert_id} className="cursor-pointer" onClick={() => {
              const zone = zones.find(z => z.zone_id === alert.zone_id);
              if (zone) onAlertClick(zone);
            }}>
              <AlertCard
                alert={alert}
                zoneName={zoneNameById.get(alert.zone_id) || `Zone ${alert.zone_id}`}
              />
            </div>
          ))
        ) : (
          <p className="mt-10 text-center text-sm font-medium text-slate-500">No active alerts</p>
        )}
      </div>
    </div>
  );
};
