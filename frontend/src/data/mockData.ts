import type { Zone, LeakAlert, QualityReading, CorrelationEvent } from '../types';

// Mock Geometry (Polygon coordinates for Leaflet)
const getRectGeometry = (lat: number, lng: number, size: number = 0.005) => {
  return [
    [lat, lng],
    [lat + size, lng],
    [lat + size, lng + size],
    [lat, lng + size],
  ];
};

export const mockZones: Zone[] = [
  { zone_id: "zone_1", name: "Downtown Core", geometry: getRectGeometry(28.6139, 77.2090), pipe_age_years: 45, population: 15000, data_level: 2 },
  { zone_id: "zone_2", name: "North Sector", geometry: getRectGeometry(28.6200, 77.2000), pipe_age_years: 20, population: 8400, data_level: 1 },
  { zone_id: "zone_3", name: "East End", geometry: getRectGeometry(28.6100, 77.2150), pipe_age_years: 55, population: 22000, data_level: 0 },
  { zone_id: "zone_4", name: "West District", geometry: getRectGeometry(28.6150, 77.1950), pipe_age_years: 15, population: 12000, data_level: 1 },
  { zone_id: "zone_5", name: "South Block", geometry: getRectGeometry(28.6050, 77.2050), pipe_age_years: 30, population: 18000, data_level: 2 },
  { zone_id: "zone_6", name: "Industrial Estate", geometry: getRectGeometry(28.6250, 77.2150), pipe_age_years: 60, population: 5000, data_level: 0 },
  { zone_id: "zone_7", name: "Residential Annex", geometry: getRectGeometry(28.6000, 77.1900), pipe_age_years: 10, population: 9500, data_level: 1 },
  { zone_id: "zone_8", name: "Old City", geometry: getRectGeometry(28.6300, 77.2250), pipe_age_years: 80, population: 35000, data_level: 0 },
];

export const mockAlerts: LeakAlert[] = [
  { alert_id: 101, zone_id: "zone_3", estimated_loss_litres: 45000, confidence_score: 0.85, method: "water_balance", timestamp: "2026-08-16T10:00:00Z", status: "active" },
  { alert_id: 102, zone_id: "zone_6", estimated_loss_litres: 120000, confidence_score: 0.92, method: "mnf", timestamp: "2026-08-16T04:30:00Z", status: "active" },
  { alert_id: 103, zone_id: "zone_8", estimated_loss_litres: 85000, confidence_score: 0.78, method: "water_balance", timestamp: "2026-08-15T14:20:00Z", status: "active" },
  { alert_id: 104, zone_id: "zone_1", estimated_loss_litres: 5000, confidence_score: 0.45, method: "ppa", timestamp: "2026-08-16T11:15:00Z", status: "active" },
];

export const mockQualityReadings: QualityReading[] = [
  { reading_id: 201, zone_id: "zone_3", ph: 7.2, turbidity: 4.5, tds: 400, chlorine: 0.5, bacteria_cfu: 0, hardness: 150, timestamp: "2026-08-16T10:15:00Z", source: "lab" },
  { reading_id: 202, zone_id: "zone_6", ph: 6.1, turbidity: 8.2, tds: 600, chlorine: 0.1, bacteria_cfu: 15, hardness: 220, timestamp: "2026-08-16T08:00:00Z", source: "sensor" }, // Unsafe
  { reading_id: 203, zone_id: "zone_8", ph: 7.4, turbidity: 2.1, tds: 350, chlorine: 1.2, bacteria_cfu: 0, hardness: 120, timestamp: "2026-08-15T16:00:00Z", source: "lab" },
];

export const mockCorrelationEvents: CorrelationEvent[] = [
  { event_id: 301, zone_id: "zone_6", leak_alert_id: 102, quality_reading_id: 202, leak_caused_contamination: true, risk_level: 'CRITICAL' },
  { event_id: 302, zone_id: "zone_3", leak_alert_id: 101, quality_reading_id: 201, leak_caused_contamination: false, risk_level: 'WARNING' },
  { event_id: 303, zone_id: "zone_8", leak_alert_id: 103, quality_reading_id: 203, leak_caused_contamination: false, risk_level: 'ALERT' },
];

export const mockRevenueSummary = {
  total_recovered: 184500,
  breakdown: [
    { zone_id: "zone_2", amount: 45000 },
    { zone_id: "zone_5", amount: 139500 }
  ]
};
