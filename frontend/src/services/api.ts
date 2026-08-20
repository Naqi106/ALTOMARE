import axios from 'axios';
import type { Zone, LeakAlert, CorrelationEvent } from '../types';
import { mockZones, getDeterministicGeometry } from '../data/mockData';

// Stub Axios instance for Day 1
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

export const getZones = async (): Promise<Zone[]> => {
  try {
    const response = await api.get('/zones');
    const backendZones: Zone[] = response.data;
    
    // Fallback to deterministic geometry if backend does not provide it
    return backendZones.map((bz, idx) => {
      if (!bz.geometry || !Array.isArray(bz.geometry) || bz.geometry.length === 0) {
        bz.geometry = getDeterministicGeometry(bz.zone_id, idx);
      }
      return bz;
    });
  } catch (error) {
    console.error("Failed to fetch zones from backend, using fallback mock zones", error);
    return mockZones;
  }
};

export const getAlerts = async (): Promise<LeakAlert[]> => {
  const response = await api.get('/alerts');
  return response.data;
};

export const getCorrelation = async (zone_id: string): Promise<CorrelationEvent[]> => {
  try {
    const response = await api.get(`/correlation/${zone_id}`);
    const data = response.data;
    if (!data) return [];
    const items = Array.isArray(data) ? data : [data];
    return items.filter((item: any) => item && item.event_id && item.risk_level);
  } catch {
    return [];
  }
};

export const getRevenueSummary = async () => {
  const response = await api.get('/revenue/summary');
  return response.data;
};

export const getNRWSummary = async () => {
  const response = await api.get('/nrw/summary');
  return response.data;
};

// Functions to be wired up later
export const postReading = async (data: any) => {
  return api.post('/readings', data);
};

export const postQuality = async (data: any) => {
  return api.post('/quality', data);
};

export const postAlertNotify = async (alert_id: number, channel: 'sms' | 'whatsapp') => {
  return api.post('/alerts/notify', { alert_id, channel });
};
