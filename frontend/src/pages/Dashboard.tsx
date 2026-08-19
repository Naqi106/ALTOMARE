import React, { useEffect, useMemo, useState } from 'react';
import { KPICard } from '../components/KPICard';
import { ZoneMap } from '../components/ZoneMap';
import { ZoneDetails } from '../components/ZoneDetails';
import { SystemStatus } from '../components/SystemStatus';
import { NRWTrendChart } from '../components/NRWTrendChart';
import { QualityTrendChart } from '../components/QualityTrendChart';
import { RevenueCard } from '../components/RevenueCard';
import { LiveAlertFeed } from '../components/LiveAlertFeed';

import type { Zone, CorrelationEvent, LeakAlert } from '../types';
import { getZones, getCorrelation } from '../services/api';

import { AlertTriangle, Droplets, ShieldAlert, Waves } from 'lucide-react';

interface DashboardProps {
  sharedAlerts: LeakAlert[];
  sharedAlertsLoading: boolean;
  sharedAlertsError: boolean;
  sharedLastUpdated: Date | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sharedAlerts,
  sharedAlertsLoading,
  sharedAlertsError,
  sharedLastUpdated,
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationEvent[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const alerts = sharedAlerts;
  const alertsLoading = sharedAlertsLoading;
  const alertsError = sharedAlertsError;
  const lastUpdated = sharedLastUpdated;

  useEffect(() => {
    const loadData = async () => {
      try {
        const zonesData = await getZones();
        setZones(zonesData);
      } catch (error) {
        console.error("Failed to load initial dashboard data", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      // Check if we already have correlations for this zone
      const hasCorrelations = correlations.some(c => c.zone_id === selectedZone.zone_id);
      if (!hasCorrelations) {
        getCorrelation(selectedZone.zone_id)
          .then((zoneCorrelations) => {
            setCorrelations(prev => {
              // Filter out old ones for this zone just in case, then add new
              const others = prev.filter(c => c.zone_id !== selectedZone.zone_id);
              return [...others, ...zoneCorrelations];
            });
          })
          .catch(error => console.error("Failed to load correlation for zone", error));
      }
    }
  }, [selectedZone]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalNRW = 24.7;
  const activeAlertsCount = useMemo(() => alerts.filter(a => a.status === 'active').length, [alerts]);
  const unsafeZones = useMemo(() => new Set([
    ...alerts.filter(a => a.status === 'active').map(a => a.zone_id),
    ...correlations.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'ALERT').map(c => c.zone_id)
  ]).size, [alerts, correlations]);

  return (
    <div className="grid h-full min-h-[620px] grid-rows-[auto_minmax(300px,1fr)_auto] gap-5 overflow-hidden p-5 xl:gap-6 xl:p-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5 2xl:gap-5">
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
          value={activeAlertsCount}
          subtitle="Requires review"
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
        <RevenueCard />
      </div>

      <div className="grid min-h-0 grid-cols-12 gap-6">
        <section className="col-span-12 flex min-h-0 flex-col xl:col-span-8">
          <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-slate-700/80 bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
            <div className="absolute left-4 top-4 z-[500] rounded-lg border border-slate-600/60 bg-[#0f1829]/95 px-4 py-3 shadow-lg backdrop-blur pointer-events-none">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold text-white">Town Water Map</h3>
              </div>
              <p className="mt-1 text-[11px] font-normal text-slate-400">Live infrastructure status — demo overlay</p>
            </div>
            <div className="absolute bottom-4 left-4 z-[500] hidden rounded-lg border border-slate-700/60 bg-[#0f1829]/90 p-3 shadow-lg backdrop-blur md:block pointer-events-none">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-status-safe" />Safe</span>
                <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-status-warning" />Warning</span>
                <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-status-alert" />Alert</span>
                <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-status-critical" />Critical</span>
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

          <LiveAlertFeed 
            zones={zones}
            alerts={alerts}
            loading={alertsLoading}
            error={alertsError}
            lastUpdated={lastUpdated}
            onAlertClick={setSelectedZone}
          />
        </aside>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <NRWTrendChart />
        <QualityTrendChart />
        <div className="rounded-lg border border-slate-800/60 bg-surface/90 p-5 shadow-[0_12px_36px_rgba(0,0,0,0.15)]">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">System Status</h3>
          <div className="h-[92px]">
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
};
