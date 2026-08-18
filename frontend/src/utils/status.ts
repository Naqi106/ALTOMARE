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
  
  if (zoneAlerts.some(a => a.estimated_loss_litres >= 100000)) {
    return 'ALERT';
  }
  
  if (zoneAlerts.length > 0) {
    return 'WARNING';
  }

  return 'SAFE';
};

/**
 * TEMPORARY PRESENTATION MAPPING:
 * The backend 'leak_alerts' schema only defines status: 'active' | 'resolved'.
 * It does NOT define visual severity (SAFE, WARNING, ALERT, CRITICAL).
 * This function isolates the visual risk mapping to the frontend.
 * 
 * The 100,000L threshold is an unofficial frontend demo rule and 
 * NOT a confirmed backend business rule.
 */
export const getDemoVisualSeverity = (alert: LeakAlert): RiskLevel => {
  if (alert.status !== 'active') return 'SAFE';
  if (alert.estimated_loss_litres >= 100000) return 'ALERT';
  return 'WARNING';
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
