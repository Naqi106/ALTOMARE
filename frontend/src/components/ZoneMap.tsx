import React, { useEffect, useMemo } from 'react';
import { MapContainer, Polygon, Popup, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import type { LeafletMouseEvent, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Zone, LeakAlert, CorrelationEvent, RiskLevel } from '../types';
import { getZoneStatus } from '../utils/status';

interface ZoneMapProps {
  zones: Zone[];
  alerts: LeakAlert[];
  correlations: CorrelationEvent[];
  selectedZone: Zone | null;
  onZoneSelect: (zone: Zone) => void;
}

const statusColors: Record<RiskLevel, string> = {
  SAFE: '#10B981',
  WARNING: '#F59E0B',
  ALERT: '#F97316',
  CRITICAL: '#EF4444',
};

const LeafletResizeHandler: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const invalidate = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
      });
    };

    invalidate();

    const resizeObserver = new ResizeObserver(invalidate);
    resizeObserver.observe(container);
    window.addEventListener('resize', invalidate);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);

  return null;
};

export const ZoneMap: React.FC<ZoneMapProps> = React.memo(({ zones, alerts, correlations, selectedZone, onZoneSelect }) => {
  const center: [number, number] = [28.6165, 77.2090];

  const zoneStatuses = useMemo(() => {
    return new Map(zones.map(zone => [zone.zone_id, getZoneStatus(zone, alerts, correlations)]));
  }, [zones, alerts, correlations]);

  const getPolygonOptions = (zone: Zone): PathOptions => {
    const status = zoneStatuses.get(zone.zone_id) ?? 'SAFE';
    const color = statusColors[status];
    const isSelected = selectedZone?.zone_id === zone.zone_id;
    const hasSelection = Boolean(selectedZone);

    return {
      color,
      fillColor: color,
      fillOpacity: isSelected ? 0.54 : hasSelection ? 0.12 : 0.28,
      opacity: isSelected ? 1 : hasSelection ? 0.45 : 0.82,
      weight: isSelected ? 3 : 1.5,
      lineCap: 'square',
      lineJoin: 'miter',
    };
  };

  const handleMouseOver = (event: LeafletMouseEvent, zone: Zone) => {
    if (selectedZone?.zone_id === zone.zone_id) return;
    event.target.setStyle({ fillOpacity: 0.44, opacity: 0.95, weight: 2.5 });
  };

  const handleMouseOut = (event: LeafletMouseEvent, zone: Zone) => {
    event.target.setStyle(getPolygonOptions(zone));
  };

  return (
    <div className="relative z-0 h-full min-h-0 w-full overflow-hidden rounded-lg border border-slate-700/80 bg-[#080d16] shadow-lg">
      <MapContainer
        className="h-full w-full"
        center={center}
        zoom={13}
        zoomControl={false}
        style={{ height: '100%', width: '100%', backgroundColor: '#080d16' }}
      >
        <LeafletResizeHandler />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ZoomControl position="bottomright" />

        {zones.map(zone => {
          const status = zoneStatuses.get(zone.zone_id) ?? 'SAFE';

          return (
            <Polygon
              key={zone.zone_id}
              positions={zone.geometry}
              pathOptions={getPolygonOptions(zone)}
              eventHandlers={{
                click: () => onZoneSelect(zone),
                mouseover: (event) => handleMouseOver(event, zone),
                mouseout: (event) => handleMouseOut(event, zone),
              }}
            >
              <Popup className="altomare-popup">
                <div className="min-w-36">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Demo Zone</p>
                  <h3 className="mt-1 text-sm font-black text-white">{zone.name}</h3>
                  <p className="mt-2 text-xs font-semibold text-slate-300">Status: {status}</p>
                  <p className="mt-1 text-xs text-slate-500">Click polygon for operational details.</p>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
});
