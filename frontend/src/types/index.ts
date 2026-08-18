export type RiskLevel = 'SAFE' | 'WARNING' | 'ALERT' | 'CRITICAL';

export interface Zone {
  zone_id: string;
  name: string;
  geometry: any; // Using any for Day 1 as geometry structure from PostGIS might vary
  pipe_age_years: number;
  population: number;
  data_level: 0 | 1 | 2;
}

export interface RawReading {
  reading_id: number;
  zone_id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
}

export interface BillingRecord {
  record_id: number;
  zone_id: string;
  household_id: number;
  billed_litres: number;
  benchmark_litres: number;
  billing_period: string;
}

export interface LeakAlert {
  alert_id: number;
  zone_id: string;
  estimated_loss_litres: number;
  confidence_score: number;
  method: string;
  timestamp: string;
  status: string;
}

export interface QualityReading {
  reading_id: number;
  zone_id: string;
  ph: number;
  turbidity: number;
  tds: number;
  chlorine: number;
  bacteria_cfu: number;
  hardness: number;
  timestamp: string;
  source: string;
}

export interface CorrelationEvent {
  event_id: number;
  zone_id: string;
  leak_alert_id: number;
  quality_reading_id: number;
  leak_caused_contamination: boolean;
  risk_level: RiskLevel;
}

export interface RevenueLog {
  log_id: number;
  zone_id: string;
  leak_alert_id: number;
  litres_recovered: number;
  amount_recovered: number;
  billing_cycle: string;
}
