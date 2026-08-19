import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Zone, LeakAlert } from '../types';
import { getZones } from '../services/api';
import { getZoneStatus } from '../utils/status';
import { StatusBadge } from '../components/StatusBadge';
import {
  MapPinned,
  Users,
  Gauge,
  Activity,
  Search,
  Layers,
} from 'lucide-react';

interface ZonesPageProps {
  alerts: LeakAlert[];
}

export const Zones: React.FC<ZonesPageProps> = ({ alerts }) => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getZones()
      .then(z => { setZones(z); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return zones;
    const q = searchQuery.toLowerCase();
    return zones.filter(z =>
      z.name.toLowerCase().includes(q) ||
      z.zone_id.toLowerCase().includes(q)
    );
  }, [zones, searchQuery]);

  const dataLevelLabel = (level: number) => {
    if (level === 0) return 'Minimal';
    if (level === 1) return 'Partial';
    return 'Full';
  };

  return (
    <div className="h-full overflow-auto p-5 xl:p-6 custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Zone Overview</h1>
          <p className="mt-1 text-sm text-slate-400">Infrastructure zones and operational status</p>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-slate-300">{zones.length} zones</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search zones..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-800/60 bg-[#111a2b]/60 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-accent/40"
        />
      </div>

      {/* Zone Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">Loading zones...</div>
      ) : filteredZones.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">No zones found</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredZones.map(zone => {
            const status = getZoneStatus(zone, alerts, []);

            return (
              <button
                key={zone.zone_id}
                onClick={() => navigate('/dashboard')}
                className="group rounded-lg border border-slate-800/60 bg-surface/80 p-5 text-left transition-all duration-200 hover:border-slate-600/80 hover:bg-[#1b2940]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPinned className="h-4 w-4 shrink-0 text-accent" />
                      <h3 className="truncate text-sm font-semibold text-white group-hover:text-accent transition-colors duration-200">{zone.name}</h3>
                    </div>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">{zone.zone_id}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      <Users className="h-3 w-3" /> Pop.
                    </div>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-200">{zone.population.toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      <Gauge className="h-3 w-3" /> Pipe Age
                    </div>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-200">{zone.pipe_age_years}y</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      <Activity className="h-3 w-3" /> Data
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-200">{dataLevelLabel(zone.data_level)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
