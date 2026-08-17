import React, { useEffect, useMemo, useState } from 'react';
import { KPICard } from '../components/KPICard';
import { ZoneMap } from '../components/ZoneMap';
import { ZoneDetails } from '../components/ZoneDetails';
import { AlertCard } from '../components/AlertCard';
import { SystemStatus } from '../components/SystemStatus';
import type { Zone, LeakAlert, CorrelationEvent } from '../types';
import { getZones, getAlerts, getCorrelation, getRevenueSummary } from '../services/api';
import { AlertTriangle, Banknote, Droplets, ShieldAlert, Waves } from 'lucide-react';

const AnalyticsPlaceholder: React.FC<{ title: string; label: string; accent: string }> = ({ title, label, accent }) => (
  <div className="rounded-lg border border-slate-800 bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">{title}</h3>
      <span className={`h-2 w-2 rounded-full ${accent}`} />
    </div>
    <div className="relative flex h-[92px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-700/80 bg-[#111a2b]/70 text-sm font-medium text-slate-600">
      <div className="absolute inset-x-8 bottom-6 flex items-end justify-between opacity-40">
        {[30, 48, 36, 56, 42, 70, 52].map((height, index) => (
          <span key={index} className="w-5 rounded-t bg-slate-600/50" style={{ height }} />
        ))}
      </div>
      <span className="relative">{label}</span>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [alerts, setAlerts] = useState<LeakAlert[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationEvent[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [revenue, setRevenue] = useState<{ total_recovered: number }>({ total_recovered: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [zonesData, alertsData, revData] = await Promise.all([
          getZones(),
          getAlerts(),
          getRevenueSummary()
        ]);

        setZones(zonesData);
        setAlerts(alertsData);
        setRevenue(revData as { total_recovered: number });

        const allCorrelations = await Promise.all(
          zonesData.map(z => getCorrelation(z.zone_id))
        );
        setCorrelations(allCorrelations.flat());
      } catch (error) {
        console.error("Failed to load initial dashboard data", error);
      }
    };

    loadData();
  }, []);

  const totalNRW = 24.7;
  const activeAlerts = useMemo(() => alerts.filter(a => a.status === 'active').length, [alerts]);
  const unsafeZones = useMemo(() => new Set([
    ...alerts.filter(a => a.status === 'active').map(a => a.zone_id),
    ...correlations.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'ALERT').map(c => c.zone_id)
  ]).size, [alerts, correlations]);

  const zoneNameById = useMemo(() => {
    return new Map(zones.map(zone => [zone.zone_id, zone.name]));
  }, [zones]);

  return (
    <div className="grid h-full min-h-[620px] grid-rows-[auto_minmax(300px,1fr)_auto] gap-5 overflow-hidden p-5 xl:gap-6 xl:p-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 2xl:gap-5">
        <KPICard
          title="Total NRW"
          value={`${totalNRW}%`}
          subtitle="Network loss index"
          trend="down"
          trendValue="1.2%"
          accentColor="border-l-4 border-l-slate-400 border-slate-700"
          icon={Droplets}
        />
        <KPICard
          title="Active Alerts"
          value={activeAlerts}
          subtitle="Requires review"
          trend="up"
          trendValue="2"
          accentColor="border-l-4 border-l-status-alert border-slate-700"
          icon={AlertTriangle}
        />
        <KPICard
          title="Unsafe Zones"
          value={unsafeZones}
          subtitle="Derived risk"
          accentColor="border-l-4 border-l-status-critical border-slate-700"
          icon={ShieldAlert}
        />
        <KPICard
          title="Revenue Recovered"
          value={`₹${revenue.total_recovered.toLocaleString()}`}
          subtitle="Recovered water value"
          trend="up"
          trendValue="₹15,000"
          accentColor="border-l-4 border-l-status-safe border-slate-700"
          icon={Banknote}
          emphasis
        />
      </div>

      <div className="grid min-h-0 grid-cols-12 gap-6">
        <section className="col-span-12 flex min-h-0 flex-col xl:col-span-8">
          <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-slate-700/90 bg-surface shadow-[0_22px_60px_rgba(0,0,0,0.24)]">
            <div className="absolute left-4 top-4 z-[500] rounded-lg border border-slate-600/80 bg-[#162236]/95 px-4 py-3 shadow-xl backdrop-blur pointer-events-none">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-black text-white">Town Water Map</h3>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-400">Live infrastructure status - demo overlay</p>
            </div>
            <div className="absolute bottom-4 left-4 z-[500] hidden rounded-lg border border-slate-700/80 bg-[#111a2b]/90 p-3 shadow-xl backdrop-blur md:block pointer-events-none">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-status-safe" />SAFE</span>
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-status-warning" />WARNING</span>
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-status-alert" />ALERT</span>
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-status-critical" />CRITICAL</span>
              </div>
            </div>
            <ZoneMap
              zones={zones}
              alerts={alerts}
              correlations={correlations}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
            />
          </div>
        </section>

        <aside className="col-span-12 grid min-h-0 grid-rows-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6 xl:col-span-4">
          <ZoneDetails
            zone={selectedZone}
            alerts={alerts}
            correlations={correlations}
          />

          <div className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">Live Alerts</h3>
              <span className="rounded border border-status-alert/30 bg-status-alert/10 px-2 py-1 text-[11px] font-black text-status-alert">{activeAlerts} Active</span>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {alerts.length > 0 ? (
                alerts.map(alert => (
                  <AlertCard
                    key={alert.alert_id}
                    alert={alert}
                    zoneName={zoneNameById.get(alert.zone_id) || `Zone ${alert.zone_id}`}
                  />
                ))
              ) : (
                <p className="mt-10 text-center text-sm text-slate-500">No active alerts</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <AnalyticsPlaceholder title="NRW Trend" label="[NRW Trend Chart Placeholder]" accent="bg-accent" />
        <AnalyticsPlaceholder title="Water Quality" label="[Quality Trend Chart Placeholder]" accent="bg-status-warning" />
        <div className="rounded-lg border border-slate-800 bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <h3 className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-slate-200">System Status</h3>
          <div className="h-[92px]">
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
};
