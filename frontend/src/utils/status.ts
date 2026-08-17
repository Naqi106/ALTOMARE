import type { Zone, LeakAlert, CorrelationEvent, RiskLevel } from '../types';

export const getZoneStatus = (
  zone: Zone,
  alerts: LeakAlert[],
  correlations: CorrelationEvent[]
): RiskLevel => {
  // Check correlations first (highest priority for CRITICAL)
  const zoneCorrelations = correlations.filter(c => c.zone_id === zone.zone_id);
  
  if (zoneCorrelations.some(c => c.risk_level === 'CRITICAL')) {
    return 'CRITICAL';
  }
  
  if (zoneCorrelations.some(c => c.risk_level === 'ALERT')) {
    return 'ALERT';
  }

  // Check alerts
  const zoneAlerts = alerts.filter(a => a.zone_id === zone.zone_id && a.status === 'active');
  
  if (zoneAlerts.some(a => a.estimated_loss_litres > 100000)) {
    return 'ALERT';
  }
  
  if (zoneAlerts.length > 0) {
    return 'WARNING';
  }

  return 'SAFE';
};

export const getStatusColor = (status: RiskLevel) => {
  switch (status) {
    case 'SAFE': return 'text-status-safe';
    case 'WARNING': return 'text-status-warning';
    case 'ALERT': return 'text-status-alert';
    case 'CRITICAL': return 'text-status-critical';
    default: return 'text-gray-400';
  }
};

export const getStatusBgColor = (status: RiskLevel) => {
  switch (status) {
    case 'SAFE': return 'bg-status-safe';
    case 'WARNING': return 'bg-status-warning';
    case 'ALERT': return 'bg-status-alert';
    case 'CRITICAL': return 'bg-status-critical';
    default: return 'bg-gray-400';
  }
};
